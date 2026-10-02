import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/haptics.dart';
import '../../home/providers/feed_provider.dart';
import '../models/comment_models.dart';

class CommentsState {
  final bool isLoading;
  final bool isLoadingMore;
  final bool isSending;
  final List<Comment> comments;
  final String? nextCursor;
  final String? error;
  final CommentFilter filter;
  final String? replyToId;
  final String? replyToName;

  /// Which comments have their replies open. Held here rather than inside
  /// each card so a reload does not close them.
  final Set<String> expandedReplies;

  const CommentsState({
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isSending = false,
    this.comments = const [],
    this.nextCursor,
    this.error,
    this.filter = CommentFilter.newest,
    this.replyToId,
    this.replyToName,
    this.expandedReplies = const {},
  });

  CommentsState copyWith({
    bool? isLoading,
    bool? isLoadingMore,
    bool? isSending,
    List<Comment>? comments,
    String? nextCursor,
    String? error,
    CommentFilter? filter,
    String? replyToId,
    String? replyToName,
    bool clearReply = false,
    bool clearError = false,
    bool clearCursor = false,
    Set<String>? expandedReplies,
  }) {
    return CommentsState(
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isSending: isSending ?? this.isSending,
      comments: comments ?? this.comments,
      nextCursor: clearCursor ? null : (nextCursor ?? this.nextCursor),
      error: clearError ? null : (error ?? this.error),
      filter: filter ?? this.filter,
      replyToId: clearReply ? null : (replyToId ?? this.replyToId),
      replyToName: clearReply ? null : (replyToName ?? this.replyToName),
      expandedReplies: expandedReplies ?? this.expandedReplies,
    );
  }
}

/// A post's true comment count, by post id — an absolute number, not an
/// adjustment.
///
/// A post is shown in several places at once: the feed list, the detail screen
/// opened from the grid, a brand's profile, each holding its own copy. This
/// held a *delta* before, which was then also applied to the feed's own copy,
/// so one deletion counted twice and read as -2; and because the delta was
/// never cleared, a refreshed post stayed wrong for the rest of the session.
/// The count is now written once, from the server's own total.
final commentCountProvider = StateProvider<Map<String, int>>((ref) => {});

class CommentsNotifier extends StateNotifier<CommentsState> {
  final ApiClient _api;
  final Ref _ref;
  final String postId;

  CommentsNotifier(this._api, this._ref, this.postId) : super(const CommentsState());

  Future<void> loadComments() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _api.dio.get(
        '/posts/$postId/comments',
        queryParameters: {'limit': 20},
      );

      final data = response.data;
      final commentsJson = data['data'] as List<dynamic>? ?? [];
      final comments = commentsJson
          .map((j) => Comment.fromJson(j as Map<String, dynamic>))
          .toList();

      state = state.copyWith(isLoading: false, comments: comments, nextCursor: data['nextCursor']);
      _publishCount(data, comments);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load comments');
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || state.nextCursor == null) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final response = await _api.dio.get(
        '/posts/$postId/comments',
        queryParameters: {'limit': 20, 'cursor': state.nextCursor},
      );

      final data = response.data;
      final commentsJson = data['data'] as List<dynamic>? ?? [];
      final newComments = commentsJson
          .map((j) => Comment.fromJson(j as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        isLoadingMore: false,
        comments: [...state.comments, ...newComments],
        nextCursor: data['nextCursor'],
      );
      _publishCount(data, state.comments);
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  Future<bool> addComment(String content) async {
    if (content.trim().isEmpty) return false;

    state = state.copyWith(isSending: true);
    Haptics.light();

    try {
      final body = <String, dynamic>{'content': content.trim()};
      if (state.replyToId != null) {
        body['parentId'] = state.replyToId;
      }

      await _api.dio.post('/posts/$postId/comments', data: body);

      // Reload comments to get fresh data with proper user info
      state = state.copyWith(isSending: false, clearReply: true);
      await loadComments();
      return true;
    } catch (e) {
      state = state.copyWith(isSending: false);
      return false;
    }
  }

  Future<bool> deleteComment(String commentId) async {
    try {
      await _api.dio.delete('/comments/$commentId');
      Haptics.light();
      // Reloading republishes the count, replies included, so nothing here
      // has to guess how far it moved.
      await loadComments();
      return true;
    } catch (e) {
      // The server allows only the comment's own author; anyone else gets a
      // 403. The button is hidden for them, so this is a network hiccup.
      debugPrint('Deleting comment failed: $e');
      return false;
    }
  }

  /// Records what the post's comment count actually is, for every screen
  /// drawing it.
  ///
  /// `total` is the server's count of every comment on the post, replies
  /// included. Older servers do not send it: then the count is only safe to
  /// publish when this page is the whole thread (no cursor to follow), and
  /// otherwise the existing number is left alone rather than made up.
  void _publishCount(dynamic data, List<Comment> comments) {
    final total = data is Map ? data['total'] : null;
    int? count;
    if (total is int) {
      count = total;
    } else if (state.nextCursor == null) {
      count = comments.fold<int>(0, (sum, c) => sum + 1 + c.replies.length);
    }
    if (count == null) return;

    final counts = Map<String, int>.from(_ref.read(commentCountProvider));
    counts[postId] = count;
    _ref.read(commentCountProvider.notifier).state = counts;
    _ref.read(feedProvider.notifier).setCommentCount(postId, count);
  }

  /// Opens or closes one comment's replies. Reloading after a reply rebuilt
  /// the list, and with the state inside each card the thread you had just
  /// replied in closed itself.
  void toggleReplies(String commentId) {
    final open = Set<String>.from(state.expandedReplies);
    if (!open.remove(commentId)) open.add(commentId);
    state = state.copyWith(expandedReplies: open);
  }

  void setReplyTo(String commentId, String authorName) {
    Haptics.selection();
    state = state.copyWith(
      replyToId: commentId,
      replyToName: authorName,
      expandedReplies: {...state.expandedReplies, commentId},
    );
  }

  void clearReply() {
    state = state.copyWith(clearReply: true);
  }

  void setFilter(CommentFilter filter) {
    state = state.copyWith(filter: filter);
    // In a real implementation, you could re-sort or re-fetch with a different sort order
  }

  void toggleLike(String commentId) {
    Haptics.light();

    List<Comment> updateTree(List<Comment> comments) {
      return comments.map((c) {
        if (c.id == commentId) {
          return c.copyWith(isLiked: !c.isLiked, likeCount: c.likeCount + (c.isLiked ? -1 : 1));
        }
        if (c.replies.isNotEmpty) {
          return c.copyWith(replies: updateTree(c.replies));
        }
        return c;
      }).toList();
    }

    state = state.copyWith(comments: updateTree(state.comments));
  }
}

final commentsProvider = StateNotifierProvider.family<CommentsNotifier, CommentsState, String>((
  ref,
  postId,
) {
  final api = ref.read(apiClientProvider);
  return CommentsNotifier(api, ref, postId)..loadComments();
});

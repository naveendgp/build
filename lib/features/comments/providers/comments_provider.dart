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
    );
  }
}

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

      state = state.copyWith(
        isLoading: false,
        comments: comments,
        nextCursor: data['nextCursor'],
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load comments',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || state.nextCursor == null) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final response = await _api.dio.get(
        '/posts/$postId/comments',
        queryParameters: {
          'limit': 20,
          'cursor': state.nextCursor,
        },
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
      _ref.read(feedProvider.notifier).adjustCommentCount(postId, 1);
      return true;
    } catch (e) {
      state = state.copyWith(isSending: false);
      return false;
    }
  }

  Future<void> deleteComment(String commentId) async {
    try {
      await _api.dio.delete('/comments/$commentId');
      Haptics.light();
      await loadComments();
      _ref.read(feedProvider.notifier).adjustCommentCount(postId, -1);
    } catch (_) {}
  }

  void setReplyTo(String commentId, String authorName) {
    Haptics.selection();
    state = state.copyWith(replyToId: commentId, replyToName: authorName);
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
          return c.copyWith(
            isLiked: !c.isLiked,
            likeCount: c.likeCount + (c.isLiked ? -1 : 1),
          );
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

final commentsProvider = StateNotifierProvider.family<CommentsNotifier, CommentsState, String>(
  (ref, postId) {
    final api = ref.read(apiClientProvider);
    return CommentsNotifier(api, ref, postId)..loadComments();
  },
);

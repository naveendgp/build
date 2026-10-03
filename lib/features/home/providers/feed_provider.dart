import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../user_profile/providers/user_profile_provider.dart';
import '../../user_profile/providers/reminders_provider.dart';
import '../../brand_profile/providers/brand_profile_provider.dart';
import '../../comments/providers/comments_provider.dart';
import '../../brand_profile/screens/brand_saved_posts_screen.dart';
import '../../settings/providers/interests_provider.dart';
import '../../settings/providers/others_provider.dart';
import '../models/feed_models.dart';

enum FeedViewMode { single, grid }

enum FeedLoadState { initial, loading, loaded, error, empty }

class FeedState {
  final List<FeedPost> posts;
  final FeedViewMode viewMode;
  final FeedLoadState loadState;
  final bool isLoadingMore;
  final String? nextCursor;

  const FeedState({
    this.posts = const [],
    this.viewMode = FeedViewMode.single,
    this.loadState = FeedLoadState.initial,
    this.isLoadingMore = false,
    this.nextCursor,
  });

  FeedState copyWith({
    List<FeedPost>? posts,
    FeedViewMode? viewMode,
    FeedLoadState? loadState,
    bool? isLoadingMore,
    String? nextCursor,
  }) {
    return FeedState(
      posts: posts ?? this.posts,
      viewMode: viewMode ?? this.viewMode,
      loadState: loadState ?? this.loadState,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      nextCursor: nextCursor ?? this.nextCursor,
    );
  }
}

class FeedNotifier extends StateNotifier<FeedState> {
  final Ref ref;

  FeedNotifier(this.ref) : super(const FeedState()) {
    loadFeed();
  }

  ApiClient get _apiClient => ref.read(apiClientProvider);

  Future<void> loadFeed() async {
    state = state.copyWith(loadState: FeedLoadState.loading);
    try {
      final res = await _apiClient.dio.get('/feed');
      if (res.statusCode == 200) {
        final dataList = res.data['data'] as List;
        final nextCursor = res.data['nextCursor'] as String?;
        final posts = dataList.map((j) => FeedPost.fromJson(j)).toList();
        state = state.copyWith(
          posts: posts,
          loadState: posts.isEmpty ? FeedLoadState.empty : FeedLoadState.loaded,
          nextCursor: nextCursor,
        );
      } else {
        state = state.copyWith(loadState: FeedLoadState.error);
      }
    } catch (e) {
      state = state.copyWith(loadState: FeedLoadState.error);
    }
  }

  Future<void> refreshFeed() async {
    // Counts come back fresh from the server, so the running adjustments are
    // dropped rather than counted twice.
    ref.read(commentCountProvider.notifier).state = {};
    state = state.copyWith(loadState: FeedLoadState.loading);
    try {
      final res = await _apiClient.dio.get('/feed');
      if (res.statusCode == 200) {
        final dataList = res.data['data'] as List;
        final nextCursor = res.data['nextCursor'] as String?;
        final posts = dataList.map((j) => FeedPost.fromJson(j)).toList();
        state = state.copyWith(
          posts: posts,
          loadState: posts.isEmpty ? FeedLoadState.empty : FeedLoadState.loaded,
          nextCursor: nextCursor,
        );
      } else {
        state = state.copyWith(loadState: FeedLoadState.error);
      }
    } catch (e) {
      state = state.copyWith(loadState: FeedLoadState.error);
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore ||
        state.loadState == FeedLoadState.loading ||
        state.nextCursor == null) {
      return;
    }
    final requestCursor = state.nextCursor;
    state = state.copyWith(isLoadingMore: true);
    try {
      final res = await _apiClient.dio.get('/feed', queryParameters: {'cursor': requestCursor});
      if (res.statusCode == 200) {
        final dataList = res.data['data'] as List;
        final nextCursor = res.data['nextCursor'] as String?;
        final morePosts = dataList.map((j) => FeedPost.fromJson(j)).toList();
        // Guard against duplicates in case the same page is delivered twice.
        final existingIds = state.posts.map((p) => p.id).toSet();
        final deduped = morePosts.where((p) => !existingIds.contains(p.id)).toList();
        state = state.copyWith(
          posts: [...state.posts, ...deduped],
          nextCursor: nextCursor,
          isLoadingMore: false,
        );
      } else {
        state = state.copyWith(isLoadingMore: false);
      }
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
      // Ignore or show small toast
    }
  }

  void toggleViewMode() {
    state = state.copyWith(
      viewMode: state.viewMode == FeedViewMode.single ? FeedViewMode.grid : FeedViewMode.single,
    );
  }

  void setViewMode(FeedViewMode mode) {
    state = state.copyWith(viewMode: mode);
  }

  /// Adjusts a post's comment count by [delta] (+1 on add, -1 on delete).
  /// A delta rather than setting an absolute count, because the comment
  /// sheet only ever loads one page at a time — its loaded-list length
  /// isn't the true total once a post has more comments than fit on a page.
  /// Sets a post's comment count to what the server says it is. This took a
  /// delta before, which the sheet applied on top of its own adjustment.
  void setCommentCount(String postId, int count) {
    final updated = state.posts.map((p) {
      if (p.id == postId) return p.copyWith(commentCount: count);
      return p;
    }).toList();
    state = state.copyWith(posts: updated);
  }

  Future<void> toggleLike(String postId) async {
    bool isLiking = false;
    final updated = state.posts.map((p) {
      if (p.id == postId) {
        isLiking = !p.isLiked;
        return p.copyWith(
          isLiked: isLiking,
          likeCount: isLiking ? p.likeCount + 1 : (p.likeCount - 1).clamp(0, 1 << 31),
        );
      }
      return p;
    }).toList();
    state = state.copyWith(posts: updated);

    // API request
    try {
      if (isLiking) {
        await _apiClient.dio.post('/likes/$postId');
      } else {
        await _apiClient.dio.delete('/likes/$postId');
      }
    } catch (e) {
      // Put it back. The heart used to stay where it was tapped while the
      // server knew nothing about it, until something refetched the post.
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id != postId) return p;
          return p.copyWith(
            isLiked: !isLiking,
            likeCount: isLiking ? (p.likeCount - 1).clamp(0, 1 << 31) : p.likeCount + 1,
          );
        }).toList(),
      );
    }
  }

  Future<void> toggleBookmark(String postId) async {
    bool isSaving = false;
    FeedPost? targetPost;

    final updated = state.posts.map((p) {
      if (p.id == postId) {
        isSaving = !p.isBookmarked;
        targetPost = p.copyWith(isBookmarked: isSaving);
        return targetPost!;
      }
      return p;
    }).toList();
    state = state.copyWith(posts: updated);

    if (targetPost != null) {
      // Sync user profile saved posts (for regular users)
      ref.read(userProfileProvider.notifier).syncSavedPost(postId, isSaving, targetPost);
      // Invalidate brand saved posts provider so the brand saved page refreshes
      ref.invalidate(brandSavedPostsProvider);
    }

    // API request
    try {
      if (isSaving) {
        await _apiClient.dio.post('/saved-posts/$postId/save');
      } else {
        await _apiClient.dio.delete('/saved-posts/$postId/save');
      }
    } catch (e) {
      // Put it back, here and in the saved lists that were just told about it.
      final reverted = state.posts.map((p) {
        if (p.id != postId) return p;
        return p.copyWith(isBookmarked: !isSaving);
      }).toList();
      state = state.copyWith(posts: reverted);
      if (targetPost != null) {
        ref
            .read(userProfileProvider.notifier)
            .syncSavedPost(postId, !isSaving, targetPost!.copyWith(isBookmarked: !isSaving));
        ref.invalidate(brandSavedPostsProvider);
      }
    }
  }

  Future<void> toggleFollow(String postId) async {
    String? targetBrandId;
    bool isFollowing = false;

    final updated = state.posts.map((p) {
      if (p.id == postId) {
        targetBrandId = p.brandId;
        isFollowing = !p.isFollowing;
        return p.copyWith(isFollowing: isFollowing);
      }
      return p;
    }).toList();

    state = state.copyWith(posts: updated);

    if (targetBrandId != null) {
      // Update other posts by the same brand so UI stays consistent
      final allUpdated = state.posts.map((p) {
        if (p.brandId == targetBrandId) {
          return p.copyWith(isFollowing: isFollowing);
        }
        return p;
      }).toList();
      state = state.copyWith(posts: allUpdated);

      try {
        if (isFollowing) {
          await _apiClient.dio.post('/follow/$targetBrandId');
        } else {
          await _apiClient.dio.delete('/follow/$targetBrandId');
        }
        // The brand's own screen holds its own copy of this, so following
        // from the feed left "Follow" showing on the profile until a restart.
        ref.invalidate(brandProfileProvider(targetBrandId!));
        ref.invalidate(userProfileProvider);
      } catch (e) {
        // Ignore for optimistic UI
      }
    }
  }

  /// Returns false when the reminder was not stored, so the screen can stop
  /// telling the person it was set.
  /// Marks every post by a brand as followed or not, after the brand's own
  /// screen changed it. The feed keeps its own copy per post.
  void markBrandFollowed(String brandId, bool isFollowing) {
    state = state.copyWith(
      posts: state.posts
          .map((p) => p.brandId == brandId ? p.copyWith(isFollowing: isFollowing) : p)
          .toList(),
    );
  }

  Future<bool> setReminder(String postId, DateTime reminderTime) async {
    try {
      await _apiClient.dio.post(
        '/reminders',
        data: {
          'postId': postId,
          'title': 'Saved Post Reminder',
          'reminderTime': reminderTime.toUtc().toIso8601String(),
        },
      );
      // Refresh the upcoming reminders list so it shows up in the Profile tab
      ref.read(remindersProvider.notifier).loadReminders();
      return true;
    } catch (e) {
      debugPrint('Setting a reminder failed: $e');
      return false;
    }
  }

  Future<void> markNotInterested(String postId) async {
    state = state.copyWith(posts: state.posts.where((p) => p.id != postId).toList());
    try {
      await _apiClient.dio.post('/posts/$postId/not-interested');
      // The two lists are exclusive on the server: marking a post Not
      // interested drops any Interested on it. Without this the app went on
      // showing it in both.
      ref.read(interestsProvider.notifier).forget(postId);
      ref.invalidate(notInterestedPostsProvider);
    } catch (e) {
      // Ignore
    }
  }

  Future<void> archivePost(String postId) async {
    // Optimistic UI update: Remove the post from the feed
    state = state.copyWith(posts: state.posts.where((p) => p.id != postId).toList());
    try {
      await _apiClient.dio.post('/posts/$postId/archive');
    } catch (e) {
      // Ignore
    }
  }

  Future<void> deletePost(String postId) async {
    try {
      await _apiClient.dio.delete('/posts/$postId');

      // Remove from current feed state
      final currentPosts = List<FeedPost>.from(state.posts);
      currentPosts.removeWhere((p) => p.id == postId);

      state = state.copyWith(posts: currentPosts);

      // Also remove from brand profile state instantly
      try {
        ref.read(brandProfileProvider('me').notifier).removePost(postId);
      } catch (_) {}
    } catch (e) {
      // Handle error, e.g., show snackbar
      debugPrint('Error deleting post: $e');
      rethrow;
    }
  }
}

final feedProvider = StateNotifierProvider.autoDispose<FeedNotifier, FeedState>((ref) {
  return FeedNotifier(ref);
});

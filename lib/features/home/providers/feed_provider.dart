import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../user_profile/providers/user_profile_provider.dart';
import '../../user_profile/providers/reminders_provider.dart';
import '../../brand_profile/providers/brand_profile_provider.dart';
import '../../brand_profile/screens/brand_saved_posts_screen.dart';
import '../models/feed_models.dart';

enum FeedViewMode { single, grid }
enum FeedLoadState { initial, loading, loaded, error, empty }

class FeedState {
  final List<FeedPost> posts;
  final FeedViewMode viewMode;
  final FeedLoadState loadState;
  final String feedTitle;
  final int feedTitleIndex;
  final String? nextCursor;

  const FeedState({
    this.posts = const [],
    this.viewMode = FeedViewMode.single,
    this.loadState = FeedLoadState.initial,
    this.feedTitle = 'For You',
    this.feedTitleIndex = 0,
    this.nextCursor,
  });

  FeedState copyWith({
    List<FeedPost>? posts,
    FeedViewMode? viewMode,
    FeedLoadState? loadState,
    String? feedTitle,
    int? feedTitleIndex,
    String? nextCursor,
  }) {
    return FeedState(
      posts: posts ?? this.posts,
      viewMode: viewMode ?? this.viewMode,
      loadState: loadState ?? this.loadState,
      feedTitle: feedTitle ?? this.feedTitle,
      feedTitleIndex: feedTitleIndex ?? this.feedTitleIndex,
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

  static const _titles = ['For You', 'Trending', 'Inspired by You'];

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
    if (state.loadState == FeedLoadState.loading || state.nextCursor == null) return;
    try {
      final res = await _apiClient.dio.get('/feed', queryParameters: {'cursor': state.nextCursor});
      if (res.statusCode == 200) {
        final dataList = res.data['data'] as List;
        final nextCursor = res.data['nextCursor'] as String?;
        final morePosts = dataList.map((j) => FeedPost.fromJson(j)).toList();
        state = state.copyWith(
          posts: [...state.posts, ...morePosts],
          nextCursor: nextCursor,
        );
      }
    } catch (e) {
      // Ignore or show small toast
    }
  }

  void toggleViewMode() {
    state = state.copyWith(
      viewMode: state.viewMode == FeedViewMode.single
          ? FeedViewMode.grid
          : FeedViewMode.single,
    );
  }

  void setViewMode(FeedViewMode mode) {
    state = state.copyWith(viewMode: mode);
  }

  void cycleFeedTitle() {
    final next = (state.feedTitleIndex + 1) % _titles.length;
    state = state.copyWith(feedTitle: _titles[next], feedTitleIndex: next);
    // In a real app we might refetch based on the title category here
  }

  Future<void> toggleLike(String postId) async {
    bool isLiking = false;
    final updated = state.posts.map((p) {
      if (p.id == postId) {
        isLiking = !p.isLiked;
        return p.copyWith(
          isLiked: isLiking,
          likeCount: isLiking ? p.likeCount + 1 : p.likeCount - 1,
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
      // Ignore for optimistic UI
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
      // Ignore for optimistic UI, or could revert state
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
      } catch (e) {
        // Ignore for optimistic UI
      }
    }
  }

  Future<void> setReminder(String postId, DateTime reminderTime) async {
    try {
      await _apiClient.dio.post('/reminders', data: {
        'postId': postId,
        'title': 'Saved Post Reminder',
        'reminderTime': reminderTime.toUtc().toIso8601String(),
      });
      // Refresh the upcoming reminders list so it shows up in the Profile tab
      ref.read(remindersProvider.notifier).loadReminders();
    } catch (e) {
      // Could show error in UI
    }
  }

  Future<void> markNotInterested(String postId) async {
    state = state.copyWith(
      posts: state.posts.where((p) => p.id != postId).toList(),
    );
    try {
      await _apiClient.dio.post('/posts/$postId/not-interested');
    } catch (e) {
      // Ignore
    }
  }

  Future<void> archivePost(String postId) async {
    // Optimistic UI update: Remove the post from the feed
    state = state.copyWith(
      posts: state.posts.where((p) => p.id != postId).toList(),
    );
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

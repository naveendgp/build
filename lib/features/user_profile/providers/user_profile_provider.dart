import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/user_profile_models.dart';

class UserProfileState {
  final bool isLoading;
  final UserProfileData? profile;
  final List<SavedPostItem> savedPosts;
  final List<CollectionItem> collections;
  final ProfileTab currentTab;
  final String searchQuery;
  final String? error;

  const UserProfileState({
    this.isLoading = false,
    this.profile,
    this.savedPosts = const [],
    this.collections = const [],
    this.currentTab = ProfileTab.saved,
    this.searchQuery = '',
    this.error,
  });

  UserProfileState copyWith({
    bool? isLoading,
    UserProfileData? profile,
    List<SavedPostItem>? savedPosts,
    List<CollectionItem>? collections,
    ProfileTab? currentTab,
    String? searchQuery,
    String? error,
  }) {
    return UserProfileState(
      isLoading: isLoading ?? this.isLoading,
      profile: profile ?? this.profile,
      savedPosts: savedPosts ?? this.savedPosts,
      collections: collections ?? this.collections,
      currentTab: currentTab ?? this.currentTab,
      searchQuery: searchQuery ?? this.searchQuery,
      error: error ?? this.error,
    );
  }
}

class UserProfileNotifier extends StateNotifier<UserProfileState> {
  final ApiClient apiClient;

  UserProfileNotifier(this.apiClient) : super(const UserProfileState(isLoading: true)) {
    loadProfile();
  }

  Future<void> loadProfile() async {
    try {
      final responses = await Future.wait([
        apiClient.dio.get('/user/me'),
        apiClient.dio.get('/saved-posts'),
        apiClient.dio.get('/collections'),
      ]);

      if (mounted) {
        print("PROFILE JSON: ${responses[0].data}");
        state = state.copyWith(
          isLoading: false,
          profile: UserProfileData.fromJson(responses[0].data),
          savedPosts: (responses[1].data as List).map((e) => SavedPostItem.fromJson(e)).toList(),
          collections: (responses[2].data as List).map((e) => CollectionItem.fromJson(e)).toList(),
          error: null,
        );
      }
    } catch (e, st) {
      debugPrint('UserProfile API Error: $e\n$st');
      if (mounted) {
        state = state.copyWith(isLoading: false, error: e.toString(), profile: null);
      }
    }
  }

  void setTab(ProfileTab tab) {
    if (state.currentTab != tab) {
      state = state.copyWith(currentTab: tab);
    }
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void syncSavedPost(String postId, bool isSaving, dynamic post) {
    final updatedPosts = List<SavedPostItem>.from(state.savedPosts);
    if (isSaving) {
      // Add if not exists
      if (!updatedPosts.any((p) => p.id == postId)) {
        updatedPosts.insert(
          0,
          SavedPostItem(
            id: postId,
            imageUrl: post.mediaUrl ?? '',
            title: post.title ?? '',
            aspectRatio: post.aspectRatio ?? 1.0,
          ),
        );
      }
    } else {
      updatedPosts.removeWhere((p) => p.id == postId);
    }
    state = state.copyWith(savedPosts: updatedPosts);
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      // `/user/profile` does not exist — the route is `/user/me`, and this
      // call answered 404.
      final res = await apiClient.dio.put('/user/me', data: data);
      if (res.statusCode == 200) {
        await loadProfile();
        return true;
      }
    } catch (e) {
      debugPrint('Update Profile Error: \$e');
    }
    return false;
  }
}

final userProfileProvider =
    StateNotifierProvider.autoDispose<UserProfileNotifier, UserProfileState>((ref) {
      final apiClient = ref.watch(apiClientProvider);
      return UserProfileNotifier(apiClient);
    });

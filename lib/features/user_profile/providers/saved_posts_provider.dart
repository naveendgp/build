import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../repositories/saved_posts_repository.dart';

final savedPostsRepositoryProvider = Provider<SavedPostsRepository>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return SavedPostsRepository(apiClient);
});

// A simple provider to keep track of locally saved post IDs for fast UI updates
class SavedPostsNotifier extends StateNotifier<Set<String>> {
  final SavedPostsRepository _repository;

  SavedPostsNotifier(this._repository) : super({});

  // Call this to initialize the set with data from the profile endpoint if needed
  void setInitialSavedPosts(List<String> postIds) {
    state = Set.from(postIds);
  }

  Future<void> toggleSave(String postId, {required bool currentlySaved}) async {
    // Optimistic UI update
    if (currentlySaved) {
      state = {...state}..remove(postId);
      try {
        await _repository.unsavePost(postId);
      } catch (e) {
        // Revert on failure
        state = {...state}..add(postId);
        rethrow;
      }
    } else {
      state = {...state}..add(postId);
      try {
        await _repository.savePost(postId);
      } catch (e) {
        // Revert on failure
        state = {...state}..remove(postId);
        rethrow;
      }
    }
  }
}

final savedPostsProvider = StateNotifierProvider<SavedPostsNotifier, Set<String>>((ref) {
  final repository = ref.watch(savedPostsRepositoryProvider);
  return SavedPostsNotifier(repository);
});

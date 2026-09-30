import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/user_profile_models.dart';
import '../repositories/collections_repository.dart';

final collectionsRepositoryProvider = Provider<CollectionsRepository>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return CollectionsRepository(apiClient);
});

class CollectionsNotifier extends StateNotifier<AsyncValue<List<CollectionItem>>> {
  final CollectionsRepository _repository;

  CollectionsNotifier(this._repository) : super(const AsyncValue.loading()) {
    fetchCollections();
  }

  Future<void> fetchCollections() async {
    state = const AsyncValue.loading();
    try {
      final collections = await _repository.getCollections();
      state = AsyncValue.data(collections);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<CollectionItem> createCollection(String name) async {
    try {
      final newCollection = await _repository.createCollection(name);
      state = state.whenData((collections) => [newCollection, ...collections]);
      return newCollection;
    } catch (e) {
      // Re-throw so UI can show error
      rethrow;
    }
  }

  Future<void> deleteCollection(String id) async {
    try {
      await _repository.deleteCollection(id);
      state = state.whenData((collections) => collections.where((c) => c.id != id).toList());
    } catch (e) {
      rethrow;
    }
  }

  Future<void> togglePostInCollection(
    String collectionId,
    dynamic post, {
    required bool isCurrentlyInCollection,
  }) async {
    final postId = post.id;
    // Optimistically update state
    state = state.whenData((collections) {
      return collections.map((c) {
        if (c.id == collectionId) {
          final updatedPosts = List<SavedPostItem>.from(c.posts);
          int newPostCount = c.postCount;

          List<String> newCoverImages = List.from(c.coverImages);

          if (isCurrentlyInCollection) {
            updatedPosts.removeWhere((p) => p.id == postId);
            newPostCount = (newPostCount > 0) ? newPostCount - 1 : 0;
            if (newCoverImages.contains(post.mediaUrl)) {
              newCoverImages.remove(post.mediaUrl);
            }
          } else {
            updatedPosts.add(
              SavedPostItem(
                id: postId,
                imageUrl: post.mediaUrl ?? '',
                title: post.title ?? '',
                aspectRatio: post.aspectRatio ?? 1.0,
              ),
            );
            newPostCount += 1;
            if (post.mediaUrl != null &&
                post.mediaUrl.isNotEmpty &&
                !newCoverImages.contains(post.mediaUrl)) {
              newCoverImages.add(post.mediaUrl);
            }
          }

          return CollectionItem(
            id: c.id,
            title: c.title,
            postCount: newPostCount,
            lastUpdated: 'Just now',
            isPrivate: c.isPrivate,
            coverImages: newCoverImages,
            posts: updatedPosts,
          );
        }
        return c;
      }).toList();
    });

    try {
      if (isCurrentlyInCollection) {
        await _repository.removePostFromCollection(collectionId, postId);
      } else {
        await _repository.addPostToCollection(collectionId, postId);
      }
    } catch (e) {
      // Refresh state to rollback
      fetchCollections();
      rethrow;
    }
  }
}

final collectionsProvider =
    StateNotifierProvider<CollectionsNotifier, AsyncValue<List<CollectionItem>>>((ref) {
      final repository = ref.watch(collectionsRepositoryProvider);
      return CollectionsNotifier(repository);
    });

import '../../../core/network/api_client.dart';
import '../models/user_profile_models.dart';

class CollectionsRepository {
  final ApiClient _apiClient;

  CollectionsRepository(this._apiClient);

  Future<List<CollectionItem>> getCollections() async {
    try {
      final response = await _apiClient.dio.get('/collections');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => CollectionItem.fromJson(json)).toList();
      } else {
        throw Exception('Failed to fetch collections');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<CollectionItem> createCollection(String name) async {
    try {
      final response = await _apiClient.dio.post('/collections', data: {'name': name});

      if (response.statusCode == 200 || response.statusCode == 201) {
        return CollectionItem.fromJson(response.data);
      } else {
        throw Exception('Failed to create collection');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> deleteCollection(String id) async {
    try {
      final response = await _apiClient.dio.delete('/collections/$id');

      if (response.statusCode != 200) {
        throw Exception('Failed to delete collection');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> addPostToCollection(String collectionId, String postId) async {
    try {
      final response = await _apiClient.dio.post('/collections/$collectionId/posts/$postId');
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Failed to add post to collection');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> removePostFromCollection(String collectionId, String postId) async {
    try {
      final response = await _apiClient.dio.delete('/collections/$collectionId/posts/$postId');
      if (response.statusCode != 200) {
        throw Exception('Failed to remove post from collection');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}

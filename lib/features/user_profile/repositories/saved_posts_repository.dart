import '../../../core/network/api_client.dart';

class SavedPostsRepository {
  final ApiClient _apiClient;

  SavedPostsRepository(this._apiClient);

  Future<void> savePost(String postId) async {
    try {
      final response = await _apiClient.dio.post('/saved-posts/$postId/save');
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Failed to save post');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> unsavePost(String postId) async {
    try {
      final response = await _apiClient.dio.delete('/saved-posts/$postId/save');
      if (response.statusCode != 200) {
        throw Exception('Failed to unsave post');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}

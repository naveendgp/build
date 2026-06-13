import '../../../core/network/api_client.dart';
import '../models/notification_models.dart';

class NotificationsRepository {
  final ApiClient _apiClient;

  NotificationsRepository(this._apiClient);

  Future<List<AppNotification>> getNotifications({String? cursor}) async {
    try {
      final response = await _apiClient.dio.get(
        '/notifications',
        queryParameters: cursor != null ? {'cursor': cursor} : null,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((json) {
          // Map backend fields to frontend model
          return AppNotification.fromJson({
            ...json,
            'message': json['body'], // Map 'body' to 'message'
            'referenceId': json['entityId'], // Map 'entityId' to 'referenceId'
            'entityType': json['entityType'],
          });
        }).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to load notifications: $e');
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _apiClient.dio.post('/notifications/$id/read');
    } catch (e) {
      throw Exception('Failed to mark notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _apiClient.dio.post('/notifications/read-all');
    } catch (e) {
      throw Exception('Failed to mark all notifications as read: $e');
    }
  }

  Future<void> clearAllNotifications() async {
    try {
      await _apiClient.dio.delete('/notifications/all');
    } catch (e) {
      throw Exception('Failed to clear all notifications: $e');
    }
  }
}

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../home/models/feed_models.dart';

class UpcomingReminder {
  final String id;
  final String title;
  final String? description;
  final DateTime reminderTime;
  final bool isTriggered;
  final FeedPost? post;

  UpcomingReminder({
    required this.id,
    required this.title,
    this.description,
    required this.reminderTime,
    required this.isTriggered,
    this.post,
  });

  factory UpcomingReminder.fromJson(Map<String, dynamic> json) {
    FeedPost? parsedPost;
    if (json['post'] != null) {
      // Create a simplified FeedPost just for rendering the image and title
      final mediaList = json['post']['media'] as List?;
      final mediaUrl = (mediaList != null && mediaList.isNotEmpty)
          ? mediaList[0]['url']
          : 'https://via.placeholder.com/150';
          
      parsedPost = FeedPost(
        id: json['post']['id'],
        brandId: '',
        brandName: '',
        brandAvatar: '',
        title: json['post']['title'] ?? '',
        description: '',
        mediaUrl: mediaUrl,
        aspectRatio: 1.0,
        timestamp: '',
        tags: const [],
      );
    }

    return UpcomingReminder(
      id: json['id'],
      title: json['title'] ?? '',
      description: json['description'],
      reminderTime: DateTime.parse(json['reminderTime']).toLocal(),
      isTriggered: json['isTriggered'] == true || json['isTriggered'] == 'true',
      post: parsedPost,
    );
  }
}

class RemindersState {
  final bool isLoading;
  final List<UpcomingReminder> reminders;
  final String? error;

  RemindersState({
    this.isLoading = true,
    this.reminders = const [],
    this.error,
  });

  RemindersState copyWith({
    bool? isLoading,
    List<UpcomingReminder>? reminders,
    String? error,
  }) {
    return RemindersState(
      isLoading: isLoading ?? this.isLoading,
      reminders: reminders ?? this.reminders,
      error: error ?? this.error,
    );
  }
}

class RemindersNotifier extends StateNotifier<RemindersState> {
  final ApiClient _apiClient;
  final String _endpoint;

  /// [endpoint] defaults to the upcoming-only list (used by the
  /// notifications bell). Pass '/reminders' via [allRemindersProvider] for
  /// the full history, matching what the web app shows.
  RemindersNotifier(this._apiClient, {String endpoint = '/reminders/upcoming'})
      : _endpoint = endpoint,
        super(RemindersState()) {
    loadReminders();
  }

  /// The upcoming-only endpoint returns a bare JSON array, but the full
  /// history endpoint wraps it in an object (e.g. {"reminders": [...]}).
  /// Handle both shapes instead of assuming one.
  List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map) {
      for (final key in ['reminders', 'data', 'items', 'results']) {
        final value = data[key];
        if (value is List) return value;
      }
    }
    return [];
  }

  Future<void> loadReminders() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _apiClient.dio.get(_endpoint);
      debugPrint('loadReminders($_endpoint) response: ${res.statusCode} ${res.data}');
      if (res.statusCode == 200) {
        final data = _extractList(res.data);
        final reminders = data.map((json) => UpcomingReminder.fromJson(json)).toList();
        state = state.copyWith(isLoading: false, reminders: reminders);
      } else {
        state = state.copyWith(isLoading: false, error: 'Failed to load reminders (status ${res.statusCode})');
      }
    } on DioException catch (e) {
      debugPrint('loadReminders($_endpoint) DioException: ${e.response?.statusCode} ${e.response?.data} | ${e.message}');
      final serverMsg = e.response?.data is Map ? e.response?.data['message'] : null;
      state = state.copyWith(
        isLoading: false,
        error: serverMsg ?? 'Failed to load reminders (${e.response?.statusCode ?? e.type}): ${e.response?.data ?? e.message}',
      );
    } catch (e) {
      debugPrint('loadReminders($_endpoint) unexpected error: $e');
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
  
  void removeReminder(String id) {
    final updated = state.reminders.where((r) => r.id != id).toList();
    state = state.copyWith(reminders: updated);
  }
}

final remindersProvider = StateNotifierProvider<RemindersNotifier, RemindersState>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return RemindersNotifier(apiClient);
});

/// Full reminder history (all reminders ever set, not just upcoming/
/// untriggered ones) — used on the dedicated Reminders page reached from
/// the profile stats row, to match the web app's "history" view.
final allRemindersProvider = StateNotifierProvider<RemindersNotifier, RemindersState>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return RemindersNotifier(apiClient, endpoint: '/reminders');
});

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
      isTriggered: json['isTriggered'] ?? false,
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

  RemindersNotifier(this._apiClient) : super(RemindersState()) {
    loadReminders();
  }

  Future<void> loadReminders() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _apiClient.dio.get('/reminders/upcoming');
      if (res.statusCode == 200) {
        final data = res.data as List;
        final reminders = data.map((json) => UpcomingReminder.fromJson(json)).toList();
        state = state.copyWith(isLoading: false, reminders: reminders);
      } else {
        state = state.copyWith(isLoading: false, error: 'Failed to load reminders');
      }
    } catch (e) {
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

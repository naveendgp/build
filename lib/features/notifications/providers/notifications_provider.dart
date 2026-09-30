import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/notification_models.dart';
import '../repositories/notifications_repository.dart';

enum NotificationFilter { all, reminders, brands, messages, activity }

class NotificationsState {
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final List<AppNotification> notifications;
  final NotificationFilter activeFilter;
  final int unreadCount;

  const NotificationsState({
    this.isLoading = true,
    this.isLoadingMore = false,
    this.error,
    this.notifications = const [],
    this.activeFilter = NotificationFilter.all,
    this.unreadCount = 0,
  });

  NotificationsState copyWith({
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    List<AppNotification>? notifications,
    NotificationFilter? activeFilter,
    int? unreadCount,
    bool clearError = false,
  }) {
    return NotificationsState(
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      notifications: notifications ?? this.notifications,
      activeFilter: activeFilter ?? this.activeFilter,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final NotificationsRepository _repository;

  NotificationsNotifier(this._repository) : super(const NotificationsState()) {
    loadNotifications();
  }

  Future<void> loadNotifications() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final notifications = await _repository.getNotifications();

      state = state.copyWith(
        isLoading: false,
        notifications: notifications,
        unreadCount: notifications.where((n) => !n.isRead).length,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setFilter(NotificationFilter filter) {
    state = state.copyWith(activeFilter: filter);
  }

  List<AppNotification> get filteredNotifications {
    switch (state.activeFilter) {
      case NotificationFilter.reminders:
        return state.notifications.where((n) => n.type == NotificationType.reminder).toList();
      case NotificationFilter.brands:
        return state.notifications.where((n) => n.type == NotificationType.brand).toList();
      case NotificationFilter.messages:
        return state.notifications.where((n) => n.type == NotificationType.message).toList();
      case NotificationFilter.activity:
        return state.notifications.where((n) => n.type == NotificationType.social).toList();
      case NotificationFilter.all:
        return state.notifications;
    }
  }

  Future<void> markAsRead(String id) async {
    // Optimistic UI update
    final updated = state.notifications.map((n) {
      if (n.id == id && !n.isRead) {
        return n.copyWith(isRead: true);
      }
      return n;
    }).toList();

    state = state.copyWith(
      notifications: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    );

    // Call backend in background
    try {
      await _repository.markAsRead(id);
    } catch (e) {
      // Revert on failure
      loadNotifications();
    }
  }

  Future<void> markAllAsRead() async {
    // Optimistic UI update
    final updated = state.notifications.map((n) => n.copyWith(isRead: true)).toList();
    state = state.copyWith(notifications: updated, unreadCount: 0);

    // Call backend
    try {
      await _repository.markAllAsRead();
    } catch (e) {
      loadNotifications();
    }
  }

  void deleteNotification(String id) {
    final updated = state.notifications.where((n) => n.id != id).toList();
    state = state.copyWith(
      notifications: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    );
  }

  Future<void> clearAllNotifications() async {
    // Optimistic UI update
    state = state.copyWith(notifications: [], unreadCount: 0);

    // Call backend
    try {
      await _repository.clearAllNotifications();
    } catch (e) {
      // Revert on failure
      loadNotifications();
    }
  }
}

final notificationsProvider =
    StateNotifierProvider.autoDispose<NotificationsNotifier, NotificationsState>((ref) {
      final apiClient = ref.read(apiClientProvider);
      final repository = NotificationsRepository(apiClient);
      return NotificationsNotifier(repository);
    });

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:convert';

import '../../features/messaging/providers/messaging_provider.dart';
import '../network/api_client.dart';
import '../router/app_router.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();

  factory NotificationService() {
    return _instance;
  }

  NotificationService._internal();

  // Resolved lazily — accessing FirebaseMessaging.instance throws if no
  // Firebase app exists, so we must not touch it at construction time.
  FirebaseMessaging? _fcm;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  bool _channelInitialized = false;
  bool _listenerSetUp = false;

  /// Sets up local notifications and FCM. Never throws — notification setup
  /// is best-effort and must not be able to break callers such as login or
  /// session restore.
  Future<void> initialize() async {
    try {
      await _initialize();
    } catch (e, stack) {
      debugPrint('[NotificationService] Initialization failed (non-fatal): $e\n$stack');
    }
  }

  Future<void> _initialize() async {
    // --- One-time setup: local notification channel & foreground listener ---
    if (!_channelInitialized) {
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      // iOS/macOS require their own settings object, otherwise initialize()
      // throws "iOS settings must be set when targeting iOS platform".
      const DarwinInitializationSettings initializationSettingsDarwin =
          DarwinInitializationSettings(
            requestAlertPermission: true,
            requestBadgePermission: true,
            requestSoundPermission: true,
          );

      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsDarwin,
        macOS: initializationSettingsDarwin,
      );

      await _localNotifications.initialize(
        settings: initializationSettings,
        onDidReceiveNotificationResponse: (response) {
          final payload = response.payload;
          if (payload == null || payload.isEmpty) return;
          try {
            _openFor(Map<String, dynamic>.from(jsonDecode(payload) as Map));
          } catch (e) {
            debugPrint('[NotificationService] Could not read the tapped payload: $e');
          }
        },
      );

      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        'high_importance_channel',
        'High Importance Notifications',
        description: 'This channel is used for important notifications.',
        importance: Importance.max,
      );

      // Reminders are something the person asked for at a chosen time, so
      // they get their own channel: distinct heading, and settable on its own
      // in Android's notification settings.
      const AndroidNotificationChannel reminderChannel = AndroidNotificationChannel(
        'reminders_channel',
        'Reminders',
        description: 'Posts you asked to be reminded about.',
        importance: Importance.max,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(reminderChannel);

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();

      _channelInitialized = true;
    }

    // --- FCM token registration ---
    // FCM requires an initialized Firebase app. On platforms where Firebase
    // config is absent (e.g. iOS without GoogleService-Info.plist) this is
    // skipped so it can never break login / session restore.
    if (Firebase.apps.isEmpty) {
      debugPrint('[NotificationService] Firebase not initialized; skipping FCM setup.');
      return;
    }

    final fcm = _fcm ??= FirebaseMessaging.instance;

    NotificationSettings settings = await fcm.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint('[NotificationService] Permission status: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Always try to get and register the token
      String? token = await fcm.getToken();
      debugPrint('[NotificationService] FCM Token: $token');
      if (token != null) {
        await _registerTokenWithBackend(token);
      }

      // Set up listeners only once
      if (!_listenerSetUp) {
        fcm.onTokenRefresh.listen((newToken) {
          debugPrint('[NotificationService] FCM Token refreshed: $newToken');
          _registerTokenWithBackend(newToken);
        });

        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          debugPrint('[NotificationService] Foreground message received!');
          debugPrint('[NotificationService] Title: ${message.notification?.title}');
          debugPrint('[NotificationService] Body: ${message.notification?.body}');

          final notification = message.notification;

          if (notification != null && !kIsWeb) {
            // Check if this is a message for the currently active chat screen
            if (message.data['referenceType'] == 'CONVERSATION' &&
                message.data['referenceId'] == ChatNotifier.activeConversationId) {
              debugPrint(
                '[NotificationService] Silencing notification because user is on the chat screen',
              );
              return;
            }

            _localNotifications.show(
              id: notification.hashCode,
              title: notification.title,
              body: notification.body,
              // So a tap on this one lands in the same place a tap on a
              // background notification does.
              payload: jsonEncode(message.data),
              notificationDetails: const NotificationDetails(
                android: AndroidNotificationDetails(
                  'high_importance_channel',
                  'High Importance Notifications',
                  channelDescription: 'This channel is used for important notifications.',
                  icon: '@mipmap/ic_launcher',
                  color: Color(0xFF7C5CFF),
                  importance: Importance.max,
                  priority: Priority.high,
                ),
              ),
            );
          }
        });

        // A tap on a notification used to do nothing but bring the app
        // forward, wherever it had been left. It now opens what the
        // notification is about — the post, the chat, the brand.
        FirebaseMessaging.onMessageOpenedApp.listen((message) => _openFor(message.data));

        // The same tap, when the app was not running at all.
        final launchedBy = await fcm.getInitialMessage();
        if (launchedBy != null) {
          // After the first frame, so the router exists to navigate with.
          WidgetsBinding.instance.addPostFrameCallback((_) => _openFor(launchedBy.data));
        }

        _listenerSetUp = true;
      }
    }
  }

  /// Opens whatever a notification refers to.
  ///
  /// The backend sends `referenceType` and `referenceId` with every push —
  /// POST, CONVERSATION, BRAND — the same pair the in-app list routes on.
  void _openFor(Map<String, dynamic> data) {
    final id = data['referenceId']?.toString();
    if (id == null || id.isEmpty) return;
    final type = (data['referenceType'] ?? data['type'] ?? '').toString().toUpperCase();

    try {
      final router = AppRouter.router;
      if (type.contains('CONVERSATION') || type.contains('MESSAGE')) {
        router.push('/messages/$id');
      } else if (type.contains('BRAND')) {
        router.push('/brand/$id');
      } else {
        // NEW_POST, REMINDER, likes and comments all point at a post.
        router.push('/explore/post', extra: id);
      }
    } catch (e) {
      debugPrint('[NotificationService] Could not open the notification target: $e');
    }
  }

  Future<void> showLocalNotification({
    required int id,
    required String title,
    required String body,
    bool isReminder = false,
  }) async {
    await _localNotifications.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: isReminder ? _reminderDetails(body) : _defaultDetails,
    );
  }

  static const NotificationDetails _defaultDetails = NotificationDetails(
    android: AndroidNotificationDetails(
      'high_importance_channel',
      'High Importance Notifications',
      channelDescription: 'This channel is used for important notifications.',
      icon: '@mipmap/ic_launcher',
      color: Color(0xFF7C5CFF),
      importance: Importance.max,
      priority: Priority.high,
    ),
  );

  /// A reminder reads as an alarm rather than as another message: the app's
  /// red, the notification mark rather than the launcher icon, the whole text
  /// shown without expanding, and Android's own reminder category so the
  /// system treats it that way.
  NotificationDetails _reminderDetails(String body) => NotificationDetails(
    android: AndroidNotificationDetails(
      'reminders_channel',
      'Reminders',
      channelDescription: 'Posts you asked to be reminded about.',
      icon: '@drawable/ic_notification',
      color: const Color(0xFFFF0000),
      colorized: true,
      importance: Importance.max,
      priority: Priority.max,
      category: AndroidNotificationCategory.reminder,
      ticker: 'Reminder',
      styleInformation: BigTextStyleInformation(body, contentTitle: 'Reminder'),
    ),
  );

  Future<void> _registerTokenWithBackend(String token) async {
    try {
      debugPrint('[NotificationService] Registering FCM token with backend...');
      final response = await ApiClient().dio.post(
        '/notifications/fcm-token',
        data: {'fcmToken': token},
      );
      debugPrint('[NotificationService] FCM token registered! Status: ${response.statusCode}');
    } catch (e) {
      debugPrint('[NotificationService] FAILED to register FCM token: $e');
    }
  }
}

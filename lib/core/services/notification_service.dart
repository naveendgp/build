import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../features/messaging/providers/messaging_provider.dart';
import '../network/api_client.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();

  factory NotificationService() {
    return _instance;
  }

  NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  bool _channelInitialized = false;
  bool _listenerSetUp = false;

  Future<void> initialize() async {
    // --- One-time setup: local notification channel & foreground listener ---
    if (!_channelInitialized) {
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      
      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _localNotifications.initialize(settings: initializationSettings);

      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        'high_importance_channel',
        'High Importance Notifications',
        description: 'This channel is used for important notifications.',
        importance: Importance.max,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();

      _channelInitialized = true;
    }

    // --- Always attempt FCM token registration (even on re-calls) ---
    NotificationSettings settings = await _fcm.requestPermission(
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
      String? token = await _fcm.getToken();
      debugPrint('[NotificationService] FCM Token: $token');
      if (token != null) {
        await _registerTokenWithBackend(token);
      }

      // Set up listeners only once
      if (!_listenerSetUp) {
        _fcm.onTokenRefresh.listen((newToken) {
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
              debugPrint('[NotificationService] Silencing notification because user is on the chat screen');
              return;
            }

            _localNotifications.show(
              id: notification.hashCode,
              title: notification.title,
              body: notification.body,
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

        _listenerSetUp = true;
      }
    }
  }

  Future<void> showLocalNotification({
    required int id,
    required String title,
    required String body,
  }) async {
    await _localNotifications.show(
      id: id,
      title: title,
      body: body,
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

  Future<void> _registerTokenWithBackend(String token) async {
    try {
      debugPrint('[NotificationService] Registering FCM token with backend...');
      final response = await ApiClient().dio.post('/notifications/fcm-token', data: {
        'fcmToken': token,
      });
      debugPrint('[NotificationService] FCM token registered! Status: ${response.statusCode}');
    } catch (e) {
      debugPrint('[NotificationService] FAILED to register FCM token: $e');
    }
  }
}

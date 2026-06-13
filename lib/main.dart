import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'app.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

void main() {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Global error handlers
    FlutterError.onError = (details) {
      FlutterError.presentError(details);
      // TODO: FirebaseCrashlytics.instance.recordFlutterFatalError(details);
    };

    PlatformDispatcher.instance.onError = (error, stack) {
      // TODO: FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };

    // Set immersive dark system UI
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Color(0xFF0A0A0B),
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );

    // Lock to portrait for premium experience
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);

    runApp(
      const ProviderScope(
        child: LyketApp(),
      ),
    );
  }, (error, stack) {
    // Catch-all for async errors
    // TODO: FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    debugPrint('Uncaught error: $error\n$stack');
  });
}

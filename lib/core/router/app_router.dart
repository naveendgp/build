import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/auth/auth_landing_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/forgot_password_screen.dart';
import '../../features/auth/user_signup_screen.dart';
import '../../features/auth/brand_signup_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/explore/explore_screen.dart';
import '../../features/explore/screens/explore_post_detail_screen.dart';
import '../../features/home/models/feed_models.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/brand_profile/brand_profile_screen.dart';
import '../../features/create_post/create_post_screen.dart';
import '../../features/user_profile/user_profile_screen.dart';
import '../../features/messaging/screens/messaging_home_screen.dart';
import '../../features/messaging/screens/chat_screen.dart';
import '../storage/secure_storage.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) async {
      final isGoingToAuth = state.matchedLocation == '/login' || 
                            state.matchedLocation == '/signup/user' || 
                            state.matchedLocation == '/signup/brand' || 
                            state.matchedLocation == '/auth' ||
                            state.matchedLocation == '/forgot-password' ||
                            state.matchedLocation == '/splash';
                            
      final hasSession = await SecureStorage.hasSession();

      if (!hasSession && !isGoingToAuth) {
        return '/auth';
      }
      
      if (hasSession && isGoingToAuth && state.matchedLocation != '/splash') {
        return '/home';
      }
      
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: SplashScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 500),
        ),
      ),
      GoRoute(
        path: '/auth',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const AuthLandingScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.05),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 600),
        ),
      ),
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const LoginScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.03, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      ),
      GoRoute(
        path: '/forgot-password',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const ForgotPasswordScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.03, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      ),
      GoRoute(
        path: '/signup/user',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const UserSignupScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.03, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      ),
      GoRoute(
        path: '/signup/brand',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const BrandSignupScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.03, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      ),
      GoRoute(
        path: '/home',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const HomeScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 500),
        ),
      ),
      GoRoute(
        path: '/explore',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const ExploreScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 300),
        ),
      ),
      GoRoute(
        path: '/explore/post',
        pageBuilder: (context, state) {
          final extra = state.extra;
          final FeedPost? post = extra is FeedPost ? extra : null;
          final String? postId = extra is String ? extra : null;

          return CustomTransitionPage(
            key: state.pageKey,
            child: ExplorePostDetailScreen(post: post, postId: postId),
            transitionsBuilder: (_, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.0, 0.05),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                ),
              );
            },
            transitionDuration: const Duration(milliseconds: 400),
          );
        },
      ),

      GoRoute(
        path: '/brand/:id',
        pageBuilder: (context, state) {
          final id = state.pathParameters['id']!;
          return CustomTransitionPage(
            key: state.pageKey,
            child: BrandProfileScreen(brandId: id),
            transitionsBuilder: (_, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
                child: child,
              );
            },
            transitionDuration: const Duration(milliseconds: 400),
          );
        },
      ),
      GoRoute(
        path: '/create',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const CreatePostScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 1),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      ),
      GoRoute(
        path: '/profile',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const UserProfileScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 300),
        ),
      ),
      GoRoute(
        path: '/messages',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const MessagingHomeScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      ),
      GoRoute(
        path: '/messages/:id',
        pageBuilder: (context, state) {
          final id = state.pathParameters['id']!;
          return CustomTransitionPage(
            key: state.pageKey,
            child: ChatScreen(conversationId: id),
            transitionsBuilder: (_, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                ),
              );
            },
            transitionDuration: const Duration(milliseconds: 400),
          );
        },
      ),
      GoRoute(
        path: '/notifications',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const NotificationsScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      ),
    ],
  );
}

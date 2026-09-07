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
import '../../features/user_profile/screens/reminders_screen.dart';
import '../../features/messaging/screens/messaging_home_screen.dart';
import '../../features/messaging/screens/chat_screen.dart';
import '../../features/settings/screens/settings_home_screen.dart';
import '../../features/settings/screens/privacy_safety_screen.dart';
import '../../features/settings/screens/preferences_screen.dart';
import '../../features/settings/screens/brand_profile_settings_screen.dart';
import '../../features/settings/screens/account_information_screen.dart';
import '../../features/settings/screens/blocked_brands_screen.dart';
import '../../features/settings/screens/archived_posts_screen.dart';
import '../../features/settings/screens/interests_screen.dart';
import '../../features/help_support/screens/help_support_home_screen.dart';
import '../../features/help_support/screens/faq_screen.dart';
import '../../features/help_support/screens/raise_ticket_screen.dart';
import '../../features/help_support/screens/ticket_detail_screen.dart';
import '../../features/help_support/screens/live_chat_screen.dart';
import '../../features/help_support/screens/support_chat_detail_screen.dart';
import '../storage/secure_storage.dart';
import '../../features/brand_dashboard/screens/brand_dashboard_screen.dart';
import '../../features/brand_profile/screens/brand_saved_posts_screen.dart';
import '../../features/lead_management/screens/lead_dashboard_screen.dart';
import '../../features/auth/screens/terms_screen.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) async {
      final isPublic = state.matchedLocation == '/terms';

      final isGoingToAuth = state.matchedLocation == '/login' ||
                            state.matchedLocation == '/signup/user' ||
                            state.matchedLocation == '/signup/brand' ||
                            state.matchedLocation == '/auth' ||
                            state.matchedLocation == '/forgot-password' ||
                            state.matchedLocation == '/splash';

      final hasSession = await SecureStorage.hasSession();

      if (!hasSession && !isGoingToAuth && !isPublic) {
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
        path: '/terms',
        pageBuilder: (context, state) {
          final type = state.extra == 'brand' ? TermsType.brand : TermsType.user;
          return CustomTransitionPage(
            key: state.pageKey,
            child: TermsScreen(type: type),
            transitionsBuilder: (_, animation, __, child) => SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 1),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
              child: child,
            ),
            transitionDuration: const Duration(milliseconds: 350),
          );
        },
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
          final prefilled = state.uri.queryParameters['prefilled'];
          return CustomTransitionPage(
            key: state.pageKey,
            child: ChatScreen(
              conversationId: id,
              prefilledMessage: prefilled,
            ),
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
      GoRoute(
        path: '/reminders',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const RemindersScreen(),
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
        path: '/settings',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const SettingsHomeScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 300),
        ),
        routes: [
          GoRoute(
            path: 'account',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const AccountInformationScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
          GoRoute(
            path: 'privacy',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const PrivacySafetyScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
          GoRoute(
            path: 'blocked-brands',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const BlockedBrandsScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
          GoRoute(
            path: 'preferences',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const PreferencesScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
          GoRoute(
            path: 'archived-posts',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const ArchivedPostsScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
          GoRoute(
            path: 'interests',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const InterestsScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
          GoRoute(
            path: 'brand-profile',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const BrandProfileSettingsScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/brand-dashboard',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const BrandDashboardScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1, 0),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
        ),
        routes: [
          GoRoute(
            path: 'leads',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const LeadDashboardScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/brand-saved',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const BrandSavedPostsScreen(),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1, 0),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
        ),
      ),
      GoRoute(
        path: '/help',
        pageBuilder: (context, state) {
          final tabStr = state.uri.queryParameters['tab'];
          final initialTab = tabStr == 'tickets' ? 2 : (tabStr == 'chats' ? 1 : 0);
          return CustomTransitionPage(
            key: state.pageKey,
            child: HelpSupportHomeScreen(initialTabIndex: initialTab),
          transitionsBuilder: (_, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
            transitionDuration: const Duration(milliseconds: 300),
          );
        },
        routes: [
          GoRoute(
            path: 'faq',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const FaqScreen(),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
          GoRoute(
            path: 'ticket',
            pageBuilder: (context, state) {
              final type = state.uri.queryParameters['type'] ?? 'BUG';
              return CustomTransitionPage(
                key: state.pageKey,
                child: RaiseTicketScreen(initialType: type),
                transitionsBuilder: (_, animation, secondaryAnimation, child) {
                  return SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(1, 0),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                    child: child,
                  );
                },
                transitionDuration: const Duration(milliseconds: 300),
              );
            },
          ),
          GoRoute(
            path: 'ticket/:id',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: TicketDetailScreen(ticketId: state.pathParameters['id']!),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
          GoRoute(
            path: 'live-chat',
            pageBuilder: (context, state) {
              final category = state.uri.queryParameters['category'];
              return CustomTransitionPage(
                key: state.pageKey,
                child: LiveChatScreen(initialCategory: category),
                transitionsBuilder: (_, animation, secondaryAnimation, child) {
                  return SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(1, 0),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                    child: child,
                  );
                },
                transitionDuration: const Duration(milliseconds: 300),
              );
            },
          ),
          GoRoute(
            path: 'chat/:id',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: SupportChatDetailScreen(chatId: state.pathParameters['id']!),
              transitionsBuilder: (_, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
                  child: child,
                );
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          ),
        ],
      ),
    ],
  );
}

import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../auth/providers/auth_provider.dart';
import '../user_profile/providers/user_profile_provider.dart';
import 'providers/feed_provider.dart';
import '../../core/network/socket_client.dart';
import 'widgets/feed_header.dart';
import 'widgets/feed_view_toggle.dart';
import 'widgets/feed_skeleton.dart';
import 'widgets/save_to_collection_sheet.dart';
import 'widgets/feed_card.dart';
import 'widgets/grid_feed_card.dart';
import 'widgets/bottom_nav_dock.dart';
import '../notifications/providers/notifications_provider.dart';
import '../sharing/widgets/share_sheet.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scrollCtrl = ScrollController();
  double _scrollOffset = 0;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(() {
      if (mounted) {
        setState(() => _scrollOffset = _scrollCtrl.offset);
        
        // Infinite scrolling trigger
        if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 500) {
          ref.read(feedProvider.notifier).loadMore();
        }
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initSocket();
    });
  }

  void _initSocket() {
    final socketClient = ref.read(socketClientProvider);
    socketClient.connect().then((_) {
      socketClient.socket?.on('reminder_triggered', (data) {
        if (!mounted) return;
        final title = data['title'] ?? 'Reminder';
        final catchword = data['catchword'] ?? 'It is time!';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(catchword, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(title),
              ],
            ),
            backgroundColor: context.colors.primaryAccent,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 5),
            margin: const EdgeInsets.only(bottom: 80, left: 16, right: 16),
            action: SnackBarAction(
              label: 'View',
              textColor: Colors.white,
              onPressed: () {
                // Future enhancement: navigate to post
              },
            ),
          ),
        );
      });

      // Also listen for general notifications to refresh the Notifications Tab inbox
      socketClient.socket?.on('notification', (data) {
        if (!mounted) return;
        ref.read(notificationsProvider.notifier).loadNotifications();
      });
    });
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    ref.read(socketClientProvider).disconnect();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await ref.read(feedProvider.notifier).refreshFeed();
  }

  void _showReminderSheet(String postId, FeedNotifier notifier) {
    final parentContext = context; // capture the HomeScreen context
    showModalBottomSheet(
      context: parentContext,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Container(
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: context.colors.border, borderRadius: BorderRadius.circular(10))),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text('Set Reminder', style: AppTypography.titleLarge),
            ),
            _buildReminderOption(sheetContext, '3 days', postId, notifier, 3),
            _buildReminderOption(sheetContext, '7 days', postId, notifier, 7),
            _buildReminderOption(sheetContext, '14 days', postId, notifier, 14),
            _buildReminderOption(sheetContext, '30 days', postId, notifier, 30),
            ListTile(
              title: Text('Custom date & time', style: AppTypography.bodyLarge),
              trailing: Icon(Icons.calendar_today_rounded, color: context.colors.textSecondary),
              onTap: () async {
                Navigator.pop(sheetContext);
                final date = await showDatePicker(
                  context: parentContext,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null && parentContext.mounted) {
                  final time = await showTimePicker(
                    context: parentContext,
                    initialTime: TimeOfDay.now(),
                  );
                  if (time != null && parentContext.mounted) {
                    final dateTime = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                    notifier.setReminder(postId, dateTime);
                    ScaffoldMessenger.of(parentContext).showSnackBar(
                      SnackBar(content: Text('Reminder set for ${dateTime.month}/${dateTime.day}/${dateTime.year} at ${time.format(parentContext)}')),
                    );
                  }
                }
              },
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildReminderOption(BuildContext context, String label, String postId, FeedNotifier notifier, int days) {
    return ListTile(
      title: Text(label, style: AppTypography.bodyLarge),
      trailing: Icon(Icons.notifications_active_outlined, color: context.colors.textSecondary),
      onTap: () {
        Navigator.pop(context);
        final dateTime = DateTime.now().add(Duration(days: days));
        notifier.setReminder(postId, dateTime);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Reminder set for $label')),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(feedProvider);
    final notifier = ref.read(feedProvider.notifier);

    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // Feed Content
          RefreshIndicator(
            onRefresh: _onRefresh,
            color: context.colors.primaryAccent,
            backgroundColor: context.colors.surface,
            child: _buildFeedContent(state, notifier),
          ),

          // Top Header
          Positioned(
            top: 0, left: 0, right: 0,
            child: FeedHeader(scrollOffset: _scrollOffset),
          ),

          // View Toggle
          Positioned(
            top: MediaQuery.of(context).padding.top + 70,
            left: 0, right: 0,
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: _scrollOffset > 50 ? 1.0 : 0.0),
              duration: const Duration(milliseconds: 300),
              builder: (_, value, child) {
                return Opacity(
                  opacity: 1.0 - value,
                  child: Transform.translate(
                    offset: Offset(0, -20 * value),
                    child: child,
                  ),
                );
              },
              child: FeedViewToggle(
                currentMode: state.viewMode,
                onChanged: notifier.setViewMode,
              ),
            ),
          ),

          // Bottom Nav Dock
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: _scrollOffset > 100 && _scrollCtrl.position.userScrollDirection.name == 'reverse' ? 1.0 : 0.0),
              duration: const Duration(milliseconds: 300),
              builder: (_, value, child) {
                return Transform.translate(
                  offset: Offset(0, 100 * value),
                  child: child,
                );
              },
              child: BottomNavDock(
                currentIndex: 0,
                onTap: (i) {
                  if (i == 1) context.go('/explore');
                  if (i == 2) context.push('/create');
                  if (i == 3) context.push('/messages');
                  if (i == 4) {
                    final role = ref.read(authProvider).loggedInRole;
                    if (role == UserRole.brand) {
                      context.push('/brand/me');
                    } else {
                      context.push('/profile');
                    }
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeedContent(FeedState state, FeedNotifier notifier) {
    if (state.loadState == FeedLoadState.loading) {
      return FeedSkeleton(isGrid: state.viewMode == FeedViewMode.grid);
    }

    if (state.loadState == FeedLoadState.empty || state.posts.isEmpty) {
      return _buildEmptyState();
    }

    if (state.viewMode == FeedViewMode.single) {
      return ListView.builder(
        controller: _scrollCtrl,
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + 130,
          bottom: 120,
        ),
        physics: const BouncingScrollPhysics(),
        cacheExtent: 2500,
        itemCount: state.posts.length,
        itemBuilder: (context, index) {
          final post = state.posts[index];
          return FeedCard(
            post: post,
            onLike: () => notifier.toggleLike(post.id),
            onBookmark: () {
              final isBookmarked = !post.isBookmarked;
              notifier.toggleBookmark(post.id);
              
              if (isBookmarked) {
                // Refresh profile so the saved tab shows the new post
                ref.read(userProfileProvider.notifier).loadProfile();
                
                // Show toast for saving to specific collection
                ScaffoldMessenger.of(context).clearSnackBars();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Saved', style: TextStyle(color: context.colors.textPrimary, fontWeight: FontWeight.w600)),
                    backgroundColor: context.colors.surface,
                    behavior: SnackBarBehavior.floating,
                    duration: const Duration(seconds: 4),
                    action: SnackBarAction(
                      label: 'Save to collection',
                      textColor: context.colors.primaryAccent,
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          backgroundColor: Colors.transparent,
                          isScrollControlled: true,
                          builder: (context) => SaveToCollectionSheet(post: post),
                        );
                      },
                    ),
                  ),
                );
              }
            },
            onFollow: () => notifier.toggleFollow(post.id),
            onShare: () => ShareSheet.show(context, post),
            onReminder: () => _showReminderSheet(post.id, notifier),
            onTap: () {},
          );
        },
      );
    }

    return MasonryGridView.count(
      controller: _scrollCtrl,
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 130,
        left: 16, right: 16, bottom: 120,
      ),
      physics: const BouncingScrollPhysics(),
      cacheExtent: 2500,
      itemCount: state.posts.length,
      itemBuilder: (context, index) {
        final post = state.posts[index];
        return GridFeedCard(
          post: post,
          onTap: () {
            context.push('/explore/post', extra: post);
          },
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 64, color: context.colors.textTertiary),
          const SizedBox(height: 16),
          Text('No posts found', style: AppTypography.titleLarge),
          const SizedBox(height: 8),
          Text('Try following more brands to populate your feed',
            style: AppTypography.bodyMedium, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

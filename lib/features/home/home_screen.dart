import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/adaptive/adaptive.dart';
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
import '../sharing/services/share_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/utils/app_messenger.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  // Separate controllers for the single (ListView) and grid (MasonryGridView)
  // layouts. Sharing one controller between two different scrollable widgets
  // caused "ScrollController attached to multiple scroll views" when toggling
  // between them, since both could briefly try to attach to it.
  final _listScrollCtrl = ScrollController();
  final _gridScrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _listScrollCtrl.addListener(() => _onScroll(_listScrollCtrl));
    _gridScrollCtrl.addListener(() => _onScroll(_gridScrollCtrl));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initSocket();
    });
  }

  void _onScroll(ScrollController ctrl) {
    // Infinite scrolling trigger — no setState here, the header/toggle/nav
    // listen to the active controller directly via AnimatedBuilder so
    // scrolling stays smooth.
    if (ctrl.position.pixels >= ctrl.position.maxScrollExtent - 500) {
      ref.read(feedProvider.notifier).loadMore();
    }
  }

  void _initSocket() {
    final socketClient = ref.read(socketClientProvider);
    socketClient.connect().then((_) {
      socketClient.socket?.on('reminder_triggered', (data) {
        if (!mounted) return;
        debugPrint('=== RECEIVED REMINDER TRIGGERED: $data ===');

        String title = 'Reminder';
        String catchword = 'It is time!';

        if (data is Map<String, dynamic>) {
          title = data['title'] ?? title;
          catchword = data['catchword'] ?? catchword;
        } else if (data is List && data.isNotEmpty && data.first is Map) {
          title = data.first['title'] ?? title;
          catchword = data.first['catchword'] ?? catchword;
        }

        NotificationService().showLocalNotification(
          id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
          title: catchword,
          body: title,
        );
      });

      // Also listen for general notifications to refresh the Notifications Tab inbox
      socketClient.socket?.on('notification', (data) {
        if (!mounted) return;
        debugPrint('=== RECEIVED NOTIFICATION EVENT: $data ===');
        ref.read(notificationsProvider.notifier).loadNotifications();
      });
    });
  }

  @override
  void dispose() {
    _listScrollCtrl.dispose();
    _gridScrollCtrl.dispose();
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
        constraints: BoxConstraints(maxHeight: MediaQuery.of(sheetContext).size.height * 0.85),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: context.colors.border,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Text('Set Reminder', style: AppTypography.titleLarge),
              ),
              ListTile(
                title: Text('Custom date & time', style: AppTypography.bodyLarge),
                trailing: Icon(Icons.calendar_today_rounded, color: context.colors.textSecondary),
                onTap: () async {
                  Navigator.pop(sheetContext);
                  final date = await showAdaptiveDatePicker(
                    parentContext,
                    initialDate: DateTime.now().add(const Duration(days: 1)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (date != null && parentContext.mounted) {
                    final time = await showAdaptiveTimePicker(
                      parentContext,
                      initialTime: TimeOfDay.now(),
                    );
                    if (time != null && parentContext.mounted) {
                      final dateTime = DateTime(
                        date.year,
                        date.month,
                        date.day,
                        time.hour,
                        time.minute,
                      );
                      notifier.setReminder(postId, dateTime);
                      AppMessenger.of(parentContext).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Reminder set for ${dateTime.month}/${dateTime.day}/${dateTime.year} at ${time.format(parentContext)}',
                          ),
                        ),
                      );
                    }
                  }
                },
              ),
              _buildReminderOption(
                sheetContext,
                'Tomorrow',
                postId,
                notifier,
                const Duration(days: 1),
              ),
              _buildReminderOption(
                sheetContext,
                '3 days after',
                postId,
                notifier,
                const Duration(days: 3),
              ),
              _buildReminderOption(
                sheetContext,
                '7 days after',
                postId,
                notifier,
                const Duration(days: 7),
              ),
              _buildReminderOption(
                sheetContext,
                '14 days after',
                postId,
                notifier,
                const Duration(days: 14),
              ),
              _buildReminderOption(
                sheetContext,
                '30 days after',
                postId,
                notifier,
                const Duration(days: 30),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReminderOption(
    BuildContext context,
    String label,
    String postId,
    FeedNotifier notifier,
    Duration duration,
  ) {
    return ListTile(
      title: Text(label, style: AppTypography.bodyLarge),
      trailing: Icon(Icons.notifications_active_outlined, color: context.colors.textSecondary),
      onTap: () {
        Navigator.pop(context);
        final dateTime = DateTime.now().add(duration);
        notifier.setReminder(postId, dateTime);
        AppMessenger.of(context).showSnackBar(SnackBar(content: Text('Reminder set for $label')));
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(feedProvider);
    final notifier = ref.read(feedProvider.notifier);

    final topPad = MediaQuery.of(context).padding.top;
    final activeCtrl = state.viewMode == FeedViewMode.grid ? _gridScrollCtrl : _listScrollCtrl;

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

          // Top Header — listens to the scroll controller directly so the
          // rest of the screen (heavy feed list) doesn't rebuild every frame.
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: AnimatedBuilder(
              animation: activeCtrl,
              builder: (ctx, child) => FeedHeader(
                scrollOffset: activeCtrl.hasClients ? activeCtrl.offset : 0,
                layoutSwitch: FeedViewToggle(
                  currentMode: state.viewMode,
                  onChanged: notifier.setViewMode,
                ),
              ),
            ),
          ),

          // View Toggle — hides while scrolling down, reappears as soon as you
          // scroll back up (same pattern as the bottom nav), instead of only
          // being reachable by scrolling all the way back to the top.
          // Bottom Nav Dock
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: AnimatedBuilder(
              animation: activeCtrl,
              builder: (_, child) {
                final offset = activeCtrl.hasClients ? activeCtrl.offset : 0.0;
                final scrollingDown =
                    activeCtrl.hasClients &&
                    activeCtrl.position.userScrollDirection.name == 'reverse';
                final hide = offset > 100 && scrollingDown;
                return AnimatedSlide(
                  duration: const Duration(milliseconds: 300),
                  offset: hide ? const Offset(0, 1) : Offset.zero,
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
        key: const PageStorageKey('feed_list_view'),
        controller: _listScrollCtrl,
        padding: EdgeInsets.only(
          // Clears the bar; the list/grid switch sits inside it now rather than
          // floating below it.
          top: MediaQuery.of(context).padding.top + 76,
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
                AppMessenger.of(context).clearSnackBars();
                AppMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Saved',
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
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
            onShare: () => ShareService.nativeShare(
              postId: post.id,
              title: post.title,
              brandName: post.brandName,
            ),
            onReminder: () => _showReminderSheet(post.id, notifier),
            onTap: () {},
          );
        },
      );
    }

    return MasonryGridView.count(
      key: const PageStorageKey('feed_grid_view'),
      controller: _gridScrollCtrl,
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      padding: EdgeInsets.only(
        // Clears the bar; the list/grid switch sits inside it now rather than
        // floating below it.
        top: MediaQuery.of(context).padding.top + 76,
        left: 16,
        right: 16,
        bottom: 120,
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
          Text(
            'Try following more brands to populate your feed',
            style: AppTypography.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

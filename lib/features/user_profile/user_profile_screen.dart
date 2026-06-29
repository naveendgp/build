import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/haptics.dart';
import 'providers/user_profile_provider.dart';
import 'models/user_profile_models.dart';
import 'widgets/profile_header.dart';
import 'widgets/profile_action_buttons.dart';
import 'widgets/profile_tab_bar.dart';
import 'widgets/tabs/saved_tab.dart';
import 'widgets/tabs/collections_tab.dart';
import '../home/widgets/bottom_nav_dock.dart';

class UserProfileScreen extends ConsumerWidget {
  const UserProfileScreen({super.key});

  void _navTo(BuildContext context, int index) {
    if (index == 0) context.go('/home');
    if (index == 1) context.go('/explore');
    if (index == 2) context.push('/create');
    if (index == 3) context.push('/messages');
    if (index == 4) return;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(userProfileProvider);
    final notifier = ref.read(userProfileProvider.notifier);

    if (state.error != null) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline_rounded, size: 48, color: context.colors.textTertiary),
                const SizedBox(height: 12),
                Text(
                  'Something went wrong',
                  style: AppTypography.bodyMedium.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  state.error!,
                  style: AppTypography.bodySmall.copyWith(color: context.colors.textTertiary),
                  textAlign: TextAlign.center,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (state.isLoading || state.profile == null) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: CircularProgressIndicator.adaptive(
            valueColor: AlwaysStoppedAnimation(context.colors.primaryAccent),
          ),
        ),
      );
    }

    final profile = state.profile!;

    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          SafeArea(
            child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) {
            return [
              // App Bar — minimal, just back + settings
              SliverAppBar(
                pinned: false,
                floating: true,
                snap: true,
                backgroundColor: context.colors.background,
                elevation: 0,
                scrolledUnderElevation: 0,
                leading: IconButton(
                  icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: context.colors.textPrimary),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                actions: [
                  IconButton(
                    icon: Icon(Icons.menu_rounded, size: 26, color: context.colors.textPrimary),
                    onPressed: () {
                      context.push('/settings');
                    },
                  ),
                ],
              ),

              // Profile Header — avatar, name, username, bio, stats
              SliverToBoxAdapter(
                child: ProfileHeader(
                  profile: profile,
                  savedCount: state.savedPosts.length,
                ),
              ),

              // Action Buttons — Edit Profile + Share Profile
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 16, bottom: 16),
                  child: ProfileActionButtons(profile: profile),
                ),
              ),

              // Sticky Tab Bar
              SliverPersistentHeader(
                pinned: true,
                delegate: _StickyTabBarDelegate(
                  child: ProfileTabBar(
                    currentTab: state.currentTab,
                    onTabChanged: (tab) {
                      Haptics.light();
                      notifier.setTab(tab);
                    },
                  ),
                ),
              ),
            ];
          },
          body: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: _buildTabContent(state.currentTab),
          ),
            ),
          ),
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: BottomNavDock(currentIndex: 4, onTap: (i) => _navTo(context, i)),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(ProfileTab tab) {
    switch (tab) {
      case ProfileTab.saved:
        return const SavedTab(key: ValueKey('saved'));
      case ProfileTab.collections:
        return const CollectionsTab(key: ValueKey('collections'));
    }
  }
}

class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  const _StickyTabBarDelegate({required this.child});

  @override
  double get minExtent => 48;

  @override
  double get maxExtent => 48;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      height: 48,
      color: Theme.of(context).scaffoldBackgroundColor,
      child: child,
    );
  }

  @override
  bool shouldRebuild(covariant _StickyTabBarDelegate oldDelegate) {
    return child != oldDelegate.child;
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/haptics.dart';
import 'providers/user_profile_provider.dart';
import 'models/user_profile_models.dart';
import 'widgets/profile_header.dart';
import 'widgets/profile_action_buttons.dart';
import 'widgets/profile_tab_bar.dart';
import 'widgets/tabs/saved_tab.dart';
import 'widgets/tabs/collections_tab.dart';

class UserProfileScreen extends ConsumerWidget {
  const UserProfileScreen({super.key});

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
            child: Text(
              state.error!,
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    if (state.isLoading || state.profile == null) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: CircularProgressIndicator(color: context.colors.primaryAccent),
        ),
      );
    }

    final profile = state.profile!;

    return Scaffold(
      backgroundColor: context.colors.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            ProfileHeader(profile: profile),
            SliverToBoxAdapter(
              child: Column(
                children: [
                  const SizedBox(height: AppSpacing.lg),
                  ProfileActionButtons(profile: profile),
                  const SizedBox(height: AppSpacing.xl),
                  ProfileTabBar(
                    currentTab: state.currentTab,
                    onTabChanged: (tab) {
                      Haptics.light();
                      notifier.setTab(tab);
                    },
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
              ),
            ),
          ];
        },
        body: _buildTabContent(state.currentTab),
      ),
    );
  }

  Widget _buildTabContent(ProfileTab tab) {
    switch (tab) {
      case ProfileTab.collections:
        return const CollectionsTab();
      case ProfileTab.saved:
        return const SavedTab();
    }
  }
}

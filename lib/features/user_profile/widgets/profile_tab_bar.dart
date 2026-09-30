import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/user_profile_models.dart';

class ProfileTabBar extends StatelessWidget {
  final ProfileTab currentTab;
  final ValueChanged<ProfileTab> onTabChanged;

  const ProfileTabBar({super.key, required this.currentTab, required this.onTabChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: context.colors.background,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final tabWidth = constraints.maxWidth / 2;

          return SizedBox(
            height: 48,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => onTabChanged(ProfileTab.saved),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              currentTab == ProfileTab.saved
                                  ? Icons.bookmark_rounded
                                  : Icons.bookmark_border_rounded,
                              size: 24,
                              color: currentTab == ProfileTab.saved
                                  ? context.colors.textPrimary
                                  : context.colors.textTertiary,
                            ),
                            const SizedBox(height: 4),
                          ],
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => onTabChanged(ProfileTab.collections),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.grid_view_rounded,
                              size: 24,
                              color: currentTab == ProfileTab.collections
                                  ? context.colors.textPrimary
                                  : context.colors.textTertiary,
                            ),
                            const SizedBox(height: 4),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(
                  height: 1.5,
                  child: Stack(
                    children: [
                      Container(
                        width: double.infinity,
                        height: 0.5,
                        color: context.colors.borderLight,
                      ),
                      AnimatedPositioned(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeInOut,
                        left: currentTab == ProfileTab.saved ? 0 : tabWidth,
                        top: 0,
                        child: Container(
                          width: tabWidth,
                          height: 1.5,
                          color: context.colors.primaryAccent,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

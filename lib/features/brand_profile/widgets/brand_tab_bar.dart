import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';

class BrandTabBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTabChanged;
  final List<String> tabs;

  const BrandTabBar({
    super.key,
    required this.selectedIndex,
    required this.onTabChanged,
    required this.tabs,
  });

  IconData _getIconForTab(String tab) {
    switch (tab) {
      case 'Posts':
        return Icons.grid_view_rounded;
      case 'Gallery':
        return Icons.photo_library_outlined;
      case 'Quicksite':
        return Icons.storefront_outlined;
      case 'Reviews':
        return Icons.star_outline_rounded;
      default:
        return Icons.circle_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final tabWidth = constraints.maxWidth / tabs.length;

        return SizedBox(
          height: 48,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Row(
                children: List.generate(tabs.length, (index) {
                  final isActive = index == selectedIndex;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => onTabChanged(index),
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Icon(
                            _getIconForTab(tabs[index]),
                            size: 24,
                            color: isActive
                                ? context.colors.textPrimary
                                : context.colors.textTertiary,
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  );
                }),
              ),
              SizedBox(
                height: 1.5,
                child: Stack(
                  children: [
                    // Base border
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(height: 0.5, color: context.colors.borderLight),
                    ),
                    // Active indicator
                    AnimatedPositioned(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeInOut,
                      left: selectedIndex * tabWidth,
                      bottom: 0,
                      child: Container(
                        width: tabWidth,
                        height: 1.5,
                        color: context.colors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';

class BrandTabBar extends StatefulWidget {
  final List<String> tabs;
  final int selectedIndex;
  final ValueChanged<int> onTabChanged;

  const BrandTabBar({
    super.key,
    this.tabs = const ['Posts', 'Gallery', 'Quicksite', 'Reviews'],
    required this.selectedIndex,
    required this.onTabChanged,
  });

  @override
  State<BrandTabBar> createState() => _BrandTabBarState();
}

class _BrandTabBarState extends State<BrandTabBar> {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      height: 52,
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: context.colors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final tabWidth = (constraints.maxWidth - 8) / widget.tabs.length;
          
          return Stack(
            children: [
              // Animated Indicator
              AnimatedPositioned(
                duration: const Duration(milliseconds: 300),
                curve: Curves.fastOutSlowIn,
                left: 4 + (tabWidth * widget.selectedIndex),
                top: 4,
                bottom: 4,
                width: tabWidth,
                child: Container(
                  decoration: BoxDecoration(
                    color: context.colors.primaryAccent,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: context.colors.primaryAccent.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ),
              // Tabs
              Row(
                children: widget.tabs.asMap().entries.map((entry) {
                  final index = entry.key;
                  final tab = entry.value;
                  final isSelected = widget.selectedIndex == index;

                  return Expanded(
                    child: GestureDetector(
                      onTap: () => widget.onTabChanged(index),
                      behavior: HitTestBehavior.opaque,
                      child: Center(
                        child: AnimatedDefaultTextStyle(
                          duration: const Duration(milliseconds: 300),
                          style: AppTypography.labelMedium.copyWith(
                            color: isSelected ? Colors.white : context.colors.textSecondary,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          ),
                          child: Text(
                            tab,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}

class BrandTabBarDelegate extends SliverPersistentHeaderDelegate {
  final List<String> tabs;
  final int selectedIndex;
  final ValueChanged<int> onTabChanged;
  final Color backgroundColor;
  
  BrandTabBarDelegate({
    this.tabs = const ['Posts', 'Gallery', 'Quicksite', 'Reviews'],
    required this.selectedIndex,
    required this.onTabChanged,
    this.backgroundColor = const Color(0xFF131418),
  });

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: backgroundColor,
      child: BrandTabBar(
        tabs: tabs,
        selectedIndex: selectedIndex,
        onTabChanged: onTabChanged,
      ),
    );
  }

  @override
  double get maxExtent => 52.0 + (AppSpacing.sm * 2);

  @override
  double get minExtent => 52.0 + (AppSpacing.sm * 2);

  @override
  bool shouldRebuild(covariant BrandTabBarDelegate oldDelegate) {
    return selectedIndex != oldDelegate.selectedIndex || 
           tabs != oldDelegate.tabs ||
           backgroundColor != oldDelegate.backgroundColor;
  }
}

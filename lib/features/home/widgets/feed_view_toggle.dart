import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../providers/feed_provider.dart';

/// Floating glassmorphism segmented control for feed view toggle
class FeedViewToggle extends StatelessWidget {
  final FeedViewMode currentMode;

  /// Tighter, for sitting inside the feed's top bar next to the title and the
  /// two action buttons.
  final bool compact;
  final ValueChanged<FeedViewMode> onChanged;

  const FeedViewToggle({
    super.key,
    required this.currentMode,
    required this.onChanged,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ClipRRect(
        borderRadius: AppSpacing.borderRadiusFull,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: context.colors.surface.withValues(alpha: 0.7),
              borderRadius: AppSpacing.borderRadiusFull,
              border: Border.all(color: context.colors.border, width: 0.5),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _ToggleTab(
                  icon: Icons.view_agenda_rounded,
                  label: 'Feed',
                  isActive: currentMode == FeedViewMode.single,
                  onTap: () {
                    Haptics.selection();
                    onChanged(FeedViewMode.single);
                  },
                ),
                _ToggleTab(
                  icon: Icons.grid_view_rounded,
                  label: 'Grid',
                  isActive: currentMode == FeedViewMode.grid,
                  onTap: () {
                    Haptics.selection();
                    onChanged(FeedViewMode.grid);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ToggleTab extends StatelessWidget {
  final bool compact;
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _ToggleTab({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: compact
            ? const EdgeInsets.symmetric(horizontal: 10, vertical: 6)
            : const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive
              ? context.colors.primaryAccent.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: AppSpacing.borderRadiusFull,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive ? context.colors.primaryAccent : context.colors.textTertiary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: AppTypography.labelMedium.copyWith(
                color: isActive ? context.colors.primaryAccent : context.colors.textTertiary,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

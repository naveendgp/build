import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/create_post_models.dart';

/// Floating glassmorphic segmented control for aspect ratio selection.
/// Provides Square (1:1) and Vertical (9:16) with an animated sliding
/// pill indicator behind the selected option.
class DimensionSelector extends StatelessWidget {
  final MediaDimension currentDimension;
  final ValueChanged<MediaDimension> onChanged;

  const DimensionSelector({super.key, required this.currentDimension, required this.onChanged});

  static const _options = MediaDimension.values;

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _options.indexOf(currentDimension);

    return ClipRRect(
      borderRadius: AppSpacing.borderRadiusFull,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
        child: Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.45),
            borderRadius: AppSpacing.borderRadiusFull,
            border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1),
          ),
          child: IntrinsicWidth(
            child: SizedBox(
              height: 38,
              child: Stack(
                children: [
                  // â”€â”€ Animated sliding pill â”€â”€
                  AnimatedAlign(
                    alignment: selectedIndex == 0 ? Alignment.centerLeft : Alignment.centerRight,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    child: FractionallySizedBox(
                      widthFactor: 0.5,
                      child: Container(
                        height: 38,
                        decoration: BoxDecoration(
                          color: context.colors.primaryAccent.withValues(alpha: 0.2),
                          borderRadius: AppSpacing.borderRadiusFull,
                          border: Border.all(
                            color: context.colors.primaryAccent.withValues(alpha: 0.4),
                            width: 1,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // â”€â”€ Option buttons â”€â”€
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: _options.map((dim) {
                      final isSelected = dim == currentDimension;
                      return _DimensionOption(
                        dimension: dim,
                        isSelected: isSelected,
                        onTap: () {
                          if (dim != currentDimension) {
                            Haptics.selection();
                            onChanged(dim);
                          }
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Individual dimension option â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _DimensionOption extends StatelessWidget {
  final MediaDimension dimension;
  final bool isSelected;
  final VoidCallback onTap;

  const _DimensionOption({required this.dimension, required this.isSelected, required this.onTap});

  String get _label {
    switch (dimension) {
      case MediaDimension.square:
        return 'Square 1:1';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm + 1),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Aspect-ratio icon preview
            _AspectRatioIcon(dimension: dimension, isSelected: isSelected),
            const SizedBox(width: AppSpacing.xs + 2),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 250),
              style: AppTypography.labelMedium.copyWith(
                color: isSelected ? context.colors.textPrimary : context.colors.textTertiary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
              child: Text(_label),
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€ Small aspect-ratio icon preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _AspectRatioIcon extends StatelessWidget {
  final MediaDimension dimension;
  final bool isSelected;

  const _AspectRatioIcon({required this.dimension, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    final double width;
    final double height;

    switch (dimension) {
      case MediaDimension.square:
        width = 12;
        height = 12;
        break;
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(2),
        border: Border.all(
          color: isSelected
              ? context.colors.primaryAccent
              : context.colors.textTertiary.withValues(alpha: 0.5),
          width: 1.5,
        ),
      ),
    );
  }
}

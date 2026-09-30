import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/app_spacing.dart';

/// Premium multi-step progress indicator with animated fill and glow
class LyketProgress extends StatelessWidget {
  final int totalSteps;
  final int currentStep;

  const LyketProgress({super.key, required this.totalSteps, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Row(
        children: List.generate(totalSteps, (index) {
          final isActive = index <= currentStep;
          final isCurrent = index == currentStep;

          return Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOut,
              height: 3,
              margin: EdgeInsets.only(right: index < totalSteps - 1 ? AppSpacing.sm : 0),
              decoration: BoxDecoration(
                borderRadius: AppSpacing.borderRadiusFull,
                color: isActive ? context.colors.primaryAccent : context.colors.border,
                boxShadow: isCurrent
                    ? [
                        BoxShadow(
                          color: context.colors.primaryAccent.withValues(alpha: 0.4),
                          blurRadius: 8,
                          spreadRadius: 0,
                        ),
                      ]
                    : null,
              ),
            ),
          );
        }),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/validators.dart';

/// Animated password strength indicator bar
class PasswordStrengthBar extends StatelessWidget {
  final String password;

  const PasswordStrengthBar({
    super.key,
    required this.password,
  });

  @override
  Widget build(BuildContext context) {
    final strength = Validators.passwordStrength(password);
    final label = Validators.passwordStrengthLabel(strength);

    if (password.isEmpty) return const SizedBox.shrink();

    final colors = [
      context.colors.error,
      const Color(0xFFF97316),
      const Color(0xFFEAB308),
      context.colors.success,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: List.generate(4, (index) {
            return Expanded(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
                height: 3,
                margin: EdgeInsets.only(
                  right: index < 3 ? AppSpacing.xs : 0,
                ),
                decoration: BoxDecoration(
                  borderRadius: AppSpacing.borderRadiusFull,
                  color: index < strength
                      ? colors[(strength - 1).clamp(0, 3)]
                      : context.colors.border,
                ),
              ),
            );
          }),
        ),
        if (label.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.xs),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: Text(
              label,
              key: ValueKey(label),
              style: AppTypography.labelSmall.copyWith(
                color: colors[(strength - 1).clamp(0, 3)],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

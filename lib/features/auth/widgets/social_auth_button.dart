import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

/// Premium social authentication button (Google, Apple)
class SocialAuthButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  const SocialAuthButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  /// Google sign-in button
  factory SocialAuthButton.google({required VoidCallback onPressed}) {
    return SocialAuthButton(
      label: 'Continue with Google',
      icon: Icons.g_mobiledata_rounded,
      onPressed: onPressed,
    );
  }

  /// Facebook sign-in button
  factory SocialAuthButton.facebook({required VoidCallback onPressed}) {
    return SocialAuthButton(
      label: 'Continue with Facebook',
      icon: Icons.facebook_rounded,
      onPressed: onPressed,
    );
  }

  @override
  State<SocialAuthButton> createState() => _SocialAuthButtonState();
}

class _SocialAuthButtonState extends State<SocialAuthButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: const Duration(milliseconds: 100), vsync: this);
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.97,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(scale: _scaleAnimation.value, child: child);
      },
      child: GestureDetector(
        onTapDown: (_) => _controller.forward(),
        onTapUp: (_) {
          _controller.reverse();
          Haptics.light();
          widget.onPressed();
        },
        onTapCancel: () => _controller.reverse(),
        child: Container(
          width: double.infinity,
          height: AppSpacing.buttonHeight,
          decoration: BoxDecoration(
            color: context.colors.surface,
            borderRadius: AppSpacing.borderRadiusMd,
            border: Border.all(color: context.colors.border, width: 1),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.icon, size: 24, color: context.colors.textPrimary),
              const SizedBox(width: AppSpacing.sm),
              Text(
                widget.label,
                style: AppTypography.labelLarge.copyWith(color: context.colors.textPrimary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

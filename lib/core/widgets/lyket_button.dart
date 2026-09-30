import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/haptics.dart';

/// Premium CTA button with animated gradient, press effects, and loading state
class LyketButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isOutlined;
  final IconData? icon;
  final double? width;

  const LyketButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.icon,
    this.width,
  });

  @override
  State<LyketButton> createState() => _LyketButtonState();
}

class _LyketButtonState extends State<LyketButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  bool get _isEnabled => widget.onPressed != null && !widget.isLoading;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: const Duration(milliseconds: 120), vsync: this);
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

  void _handleTapDown(TapDownDetails _) {
    if (!_isEnabled) return;
    setState(() => _isPressed = true);
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails _) {
    if (!_isEnabled) return;
    setState(() => _isPressed = false);
    _controller.reverse();
    Haptics.light();
    widget.onPressed?.call();
  }

  void _handleTapCancel() {
    if (!_isEnabled) return;
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final opacity = _isEnabled ? 1.0 : 0.4;

    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(scale: _scaleAnimation.value, child: child);
      },
      child: GestureDetector(
        onTapDown: _handleTapDown,
        onTapUp: _handleTapUp,
        onTapCancel: _handleTapCancel,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 200),
          opacity: opacity,
          child: Container(
            width: widget.width ?? double.infinity,
            height: AppSpacing.buttonHeight,
            decoration: widget.isOutlined
                ? BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: AppSpacing.borderRadiusMd,
                    border: Border.all(
                      color: _isPressed
                          ? context.colors.primaryAccent.withValues(alpha: 0.6)
                          : context.colors.border,
                      width: 1.5,
                    ),
                  )
                : BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        context.colors.primaryAccent,
                        context.colors.primaryAccent.withValues(alpha: 0.85),
                      ],
                    ),
                    borderRadius: AppSpacing.borderRadiusMd,
                    boxShadow: _isEnabled
                        ? [
                            BoxShadow(
                              color: context.colors.primaryAccent.withValues(
                                alpha: _isPressed ? 0.2 : 0.35,
                              ),
                              blurRadius: _isPressed ? 12 : 20,
                              offset: Offset(0, _isPressed ? 3 : 6),
                              spreadRadius: -4,
                            ),
                          ]
                        : null,
                  ),
            child: Center(
              child: widget.isLoading
                  ? SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator.adaptive(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          widget.isOutlined ? context.colors.primaryAccent : Colors.white,
                        ),
                      ),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (widget.icon != null) ...[
                          Icon(
                            widget.icon,
                            size: 20,
                            color: widget.isOutlined ? context.colors.textPrimary : Colors.white,
                          ),
                          const SizedBox(width: AppSpacing.sm),
                        ],
                        Text(
                          widget.label,
                          style: AppTypography.button.copyWith(
                            color: widget.isOutlined ? context.colors.textPrimary : Colors.white,
                          ),
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

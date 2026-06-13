import 'package:flutter/material.dart';
import '../theme/app_spacing.dart';
import '../theme/app_decorations.dart';
import '../utils/haptics.dart';

/// Premium floating glass card with tap animation and glassmorphism support
class LyketCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final bool isSelected;
  final bool useGlass;
  final EdgeInsets? padding;
  final double? width;
  final double? height;

  const LyketCard({
    super.key,
    required this.child,
    this.onTap,
    this.isSelected = false,
    this.useGlass = false,
    this.padding,
    this.width,
    this.height,
  });

  @override
  State<LyketCard> createState() => _LyketCardState();
}

class _LyketCardState extends State<LyketCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
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
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        );
      },
      child: GestureDetector(
        onTapDown: widget.onTap != null
            ? (_) => _controller.forward()
            : null,
        onTapUp: widget.onTap != null
            ? (_) {
                _controller.reverse();
                Haptics.selection();
                widget.onTap?.call();
              }
            : null,
        onTapCancel: widget.onTap != null
            ? () => _controller.reverse()
            : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
          width: widget.width,
          height: widget.height,
          decoration: widget.isSelected
              ? AppDecorations.selectedCard(context)
              : widget.useGlass
                  ? AppDecorations.glassCard(context)
                  : AppDecorations.floatingCard(context),
          child: widget.useGlass
              ? ClipRRect(
                  borderRadius: AppSpacing.borderRadiusXl,
                  child: BackdropFilter(
                    filter: AppDecorations.blurFilter,
                    child: Padding(
                      padding: widget.padding ?? AppSpacing.paddingCard,
                      child: widget.child,
                    ),
                  ),
                )
              : Padding(
                  padding: widget.padding ?? AppSpacing.paddingCard,
                  child: widget.child,
                ),
        ),
      ),
    );
  }
}

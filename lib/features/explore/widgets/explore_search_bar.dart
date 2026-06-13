// Lyket Explore â€” Floating Glassmorphism Search Bar
import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';

class ExploreSearchBar extends StatefulWidget {
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<bool>? onFocusChanged;
  final VoidCallback? onVoiceTap;
  final VoidCallback? onFilterTap;
  final String hintText;

  const ExploreSearchBar({
    super.key,
    this.controller,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
    this.onFocusChanged,
    this.onVoiceTap,
    this.onFilterTap,
    this.hintText = 'Search brands, styles, products...',
  });

  @override
  State<ExploreSearchBar> createState() => _ExploreSearchBarState();
}

class _ExploreSearchBarState extends State<ExploreSearchBar>
    with SingleTickerProviderStateMixin {
  late final FocusNode _focusNode;
  late final AnimationController _animController;
  late final Animation<double> _glowAnimation;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_handleFocusChange);
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _glowAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );
  }

  void _handleFocusChange() {
    final focused = _focusNode.hasFocus;
    if (focused == _isFocused) return;
    setState(() => _isFocused = focused);
    if (focused) {
      _animController.forward();
    } else {
      _animController.reverse();
    }
    widget.onFocusChanged?.call(focused);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    if (widget.focusNode == null) _focusNode.dispose();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _glowAnimation,
      builder: (context, child) {
        final glowValue = _glowAnimation.value;
        return ClipRRect(
          borderRadius: AppSpacing.borderRadiusFull,
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: GestureDetector(
              onTap: () => _focusNode.requestFocus(),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: context.colors.card.withValues(alpha: 0.7),
                  borderRadius: AppSpacing.borderRadiusFull,
                  border: Border.all(
                    color: _isFocused
                        ? context.colors.primaryAccent.withValues(alpha: 0.2)
                        : context.colors.borderLight,
                    width: _isFocused ? 1.5 : 1.0,
                  ),
                  boxShadow: glowValue > 0
                      ? [
                          BoxShadow(
                            color: context.colors.primaryAccent
                                .withValues(alpha: 0.08 * glowValue),
                            blurRadius: 20 * glowValue,
                            spreadRadius: 2 * glowValue,
                          ),
                        ]
                      : null,
                ),
                child: child,
              ),
            ),
          ),
        );
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          GestureDetector(
            onTap: () {
              if (_isFocused) {
                _focusNode.unfocus();
                widget.controller?.clear();
                widget.onChanged?.call('');
              } else {
                _focusNode.requestFocus();
              }
            },
            behavior: HitTestBehavior.opaque,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Icon(
                _isFocused ? Icons.arrow_back_rounded : Icons.search_rounded,
                key: ValueKey(_isFocused),
                size: 20,
                color: _isFocused ? context.colors.textPrimary : context.colors.textTertiary,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: _focusNode,
              onChanged: widget.onChanged,
              onSubmitted: widget.onSubmitted,
              style: AppTypography.bodyMedium.copyWith(
                color: context.colors.textPrimary,
              ),
              cursorColor: context.colors.primaryAccent,
              cursorWidth: 1.5,
              decoration: InputDecoration(
                border: InputBorder.none,
                focusedBorder: InputBorder.none,
                enabledBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                disabledBorder: InputBorder.none,
                hintText: widget.hintText,
                hintStyle: AppTypography.bodyMedium.copyWith(
                  color: context.colors.textTertiary,
                ),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


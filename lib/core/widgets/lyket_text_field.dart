import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// Premium custom text field with animated focus glow, floating labels
class LyketTextField extends StatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool autofocus;
  final int maxLines;
  final int? maxLength;
  final bool readOnly;
  final VoidCallback? onTap;

  const LyketTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.validator,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.suffixIcon,
    this.prefixIcon,
    this.onChanged,
    this.onSubmitted,
    this.autofocus = false,
    this.maxLines = 1,
    this.maxLength,
    this.readOnly = false,
    this.onTap,
  });

  @override
  State<LyketTextField> createState() => _LyketTextFieldState();
}

class _LyketTextFieldState extends State<LyketTextField>
    with SingleTickerProviderStateMixin {
  late AnimationController _glowController;
  late Animation<double> _glowAnimation;
  bool _isFocused = false;
  String? _errorText;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);

    _glowController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _glowAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeOut),
    );
  }

  void _onFocusChange() {
    setState(() => _isFocused = _focusNode.hasFocus);
    if (_focusNode.hasFocus) {
      _glowController.forward();
    } else {
      _glowController.reverse();
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _glowAnimation,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            borderRadius: AppSpacing.borderRadiusMd,
            boxShadow: _isFocused
                ? [
                    BoxShadow(
                      color: context.colors.primaryAccent
                          .withValues(alpha: 0.08 * _glowAnimation.value),
                      blurRadius: 16 * _glowAnimation.value,
                      spreadRadius: 0,
                    ),
                  ]
                : null,
          ),
          child: child,
        );
      },
      child: TextFormField(
        controller: widget.controller,
        focusNode: _focusNode,
        obscureText: widget.obscureText,
        keyboardType: widget.keyboardType,
        textInputAction: widget.textInputAction,
        autofocus: widget.autofocus,
        maxLines: widget.maxLines,
        maxLength: widget.maxLength,
        readOnly: widget.readOnly,
        onTap: widget.onTap,
        style: AppTypography.bodyLarge.copyWith(
          color: context.colors.textPrimary,
        ),
        cursorColor: context.colors.primaryAccent,
        cursorWidth: 2,
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          errorText: _errorText,
          suffixIcon: widget.suffixIcon,
          prefixIcon: widget.prefixIcon,
        ),
        validator: (value) {
          final error = widget.validator?.call(value);
          // Schedule error text update for next frame to avoid build issues
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() => _errorText = error);
            }
          });
          return error;
        },
        onChanged: widget.onChanged,
        onFieldSubmitted: widget.onSubmitted,
      ),
    );
  }
}

/// Password field variant with built-in visibility toggle
class LyketPasswordField extends StatefulWidget {
  final String label;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final TextInputAction textInputAction;
  final ValueChanged<String>? onChanged;

  const LyketPasswordField({
    super.key,
    this.label = 'Password',
    this.controller,
    this.validator,
    this.textInputAction = TextInputAction.done,
    this.onChanged,
  });

  @override
  State<LyketPasswordField> createState() => _LyketPasswordFieldState();
}

class _LyketPasswordFieldState extends State<LyketPasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return LyketTextField(
      label: widget.label,
      controller: widget.controller,
      validator: widget.validator,
      obscureText: _obscure,
      textInputAction: widget.textInputAction,
      onChanged: widget.onChanged,
      keyboardType: TextInputType.visiblePassword,
      suffixIcon: GestureDetector(
        onTap: () => setState(() => _obscure = !_obscure),
        child: Padding(
          padding: const EdgeInsets.only(right: AppSpacing.md),
          child: Icon(
            _obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded,
            size: 20,
            color: context.colors.textTertiary,
          ),
        ),
      ),
    );
  }
}

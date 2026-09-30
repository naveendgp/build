import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';

/// Character-by-character animated tagline that fades in sequentially
class TaglineAnimator extends StatefulWidget {
  final String text;
  final Duration delay;

  const TaglineAnimator({
    super.key,
    this.text = 'Discover Brands Intelligently',
    this.delay = const Duration(milliseconds: 1200),
  });

  @override
  State<TaglineAnimator> createState() => _TaglineAnimatorState();
}

class _TaglineAnimatorState extends State<TaglineAnimator> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: widget.text.length * 40 + 400),
      vsync: this,
    );

    Future.delayed(widget.delay, () {
      if (mounted) {
        setState(() => _started = true);
        _controller.forward();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_started) return const SizedBox(height: 24);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(widget.text.length, (index) {
            final charProgress = (((_controller.value * widget.text.length) - index)).clamp(
              0.0,
              1.0,
            );

            return Opacity(
              opacity: charProgress,
              child: Transform.translate(
                offset: Offset(0, 4 * (1 - charProgress)),
                child: Text(
                  widget.text[index],
                  style: AppTypography.bodyLarge.copyWith(
                    color: context.colors.textSecondary,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.w300,
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}

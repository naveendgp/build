import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

/// Premium CTA button for feed posts — objective-aware styling
class PostCtaButton extends StatefulWidget {
  final String label;
  final String? type;
  final VoidCallback? onTap;

  const PostCtaButton({super.key, required this.label, this.type, this.onTap});

  @override
  State<PostCtaButton> createState() => _PostCtaButtonState();
}

class _PostCtaButtonState extends State<PostCtaButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 100), vsync: this);
    _scale = Tween(begin: 1.0, end: 0.95).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  IconData get _icon {
    switch (widget.type) {
      case 'OPEN_URL': return Icons.arrow_outward_rounded;
      case 'OPEN_MAPS': return Icons.near_me_outlined;
      case 'OPEN_CHAT': return Icons.chat_outlined;
      case 'OPEN_LEAD_FORM': return Icons.assignment_outlined;
      case 'shop': return Icons.shopping_bag_outlined;
      case 'learn': return Icons.arrow_outward_rounded;
      case 'signup': return Icons.person_add_outlined;
      case 'book': return Icons.calendar_today_rounded;
      case 'directions': return Icons.near_me_outlined;
      case 'message': return Icons.chat_outlined;
      default: return Icons.arrow_forward_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) { _ctrl.reverse(); Haptics.light(); widget.onTap?.call(); },
      onTapCancel: () => _ctrl.reverse(),
      child: AnimatedBuilder(
        animation: _scale,
        builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: context.colors.primaryAccent,
            borderRadius: AppSpacing.borderRadiusFull,
            boxShadow: [
              BoxShadow(
                color: context.colors.primaryAccent.withValues(alpha: 0.3),
                blurRadius: 12, offset: const Offset(0, 4), spreadRadius: -2,
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(_icon, size: 15, color: Colors.white),
              const SizedBox(width: 6),
              Text(widget.label, style: AppTypography.labelMedium.copyWith(
                color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12,
              )),
            ],
          ),
        ),
      ),
    );
  }
}

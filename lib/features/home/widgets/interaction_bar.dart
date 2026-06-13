import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

/// Floating glassmorphism interaction bar with like, comment, bookmark, share, reminder
class InteractionBar extends StatelessWidget {
  final bool isLiked;
  final bool isBookmarked;
  final int likeCount;
  final int commentCount;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onBookmark;
  final VoidCallback onShare;
  final VoidCallback onReminder;

  const InteractionBar({
    super.key,
    required this.isLiked,
    required this.isBookmarked,
    required this.likeCount,
    required this.commentCount,
    required this.onLike,
    required this.onComment,
    required this.onBookmark,
    required this.onShare,
    required this.onReminder,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: AppSpacing.borderRadiusFull,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            color: context.colors.card.withValues(alpha: 0.75),
            borderRadius: AppSpacing.borderRadiusFull,
            border: Border.all(color: context.colors.borderLight, width: 0.5),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _ActionButton(
                icon: isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                color: isLiked ? context.colors.primaryAccent : context.colors.textSecondary,
                label: _formatCount(likeCount),
                onTap: onLike,
                animate: isLiked,
              ),
              _divider(context),
              _ActionButton(
                icon: Icons.chat_bubble_outline_rounded,
                color: context.colors.textSecondary,
                label: _formatCount(commentCount),
                onTap: onComment,
              ),
              _divider(context),
              _ActionButton(
                icon: isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                color: isBookmarked ? context.colors.secondaryAccent : context.colors.textSecondary,
                onTap: onBookmark,
                animate: isBookmarked,
              ),
              _divider(context),
              _ActionButton(
                icon: Icons.share_outlined,
                color: context.colors.textSecondary,
                onTap: onShare,
              ),
              _divider(context),
              _ActionButton(
                icon: Icons.notifications_active_outlined,
                color: context.colors.textSecondary,
                onTap: onReminder,
                size: 18,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _divider(BuildContext context) {
    return Container(
      width: 1, height: 18,
      margin: const EdgeInsets.symmetric(horizontal: 2),
      color: context.colors.border,
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    if (count == 0) return '0';
    return count.toString();
  }
}

class _ActionButton extends StatefulWidget {
  final IconData icon;
  final Color color;
  final String? label;
  final VoidCallback onTap;
  final bool animate;
  final double size;

  const _ActionButton({
    required this.icon,
    required this.color,
    this.label,
    required this.onTap,
    this.animate = false,
    this.size = 20,
  });

  @override
  State<_ActionButton> createState() => _ActionButtonState();
}

class _ActionButtonState extends State<_ActionButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 200), vsync: this);
    _scale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.3), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.3, end: 1.0), weight: 50),
    ]).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void didUpdateWidget(covariant _ActionButton old) {
    super.didUpdateWidget(old);
    if (widget.animate && !old.animate) _ctrl.forward(from: 0);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () { Haptics.light(); widget.onTap(); },
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedBuilder(
              animation: _scale,
              builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
              child: Icon(widget.icon, size: widget.size, color: widget.color),
            ),
            if (widget.label != null && widget.label!.isNotEmpty) ...[
              const SizedBox(width: 4),
              Text(
                widget.label!,
                style: AppTypography.labelSmall.copyWith(
                  color: widget.color,
                  fontWeight: FontWeight.w500,
                  fontSize: 11,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

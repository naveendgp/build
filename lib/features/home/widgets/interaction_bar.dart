import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

/// Flat Instagram-style interaction row — like, comment, share, reminder on
/// the left; bookmark pinned to the far right. No background pill/blur.
class InteractionBar extends StatelessWidget {
  final bool isLiked;
  final bool isBookmarked;
  final int likeCount;
  final int commentCount;
  final int shareCount;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onBookmark;
  final VoidCallback onShare;
  final VoidCallback onReminder;
  final bool showBookmark;

  const InteractionBar({
    super.key,
    required this.isLiked,
    required this.isBookmarked,
    required this.likeCount,
    required this.commentCount,
    this.shareCount = 0,
    required this.onLike,
    required this.onComment,
    required this.onBookmark,
    required this.onShare,
    required this.onReminder,
    this.showBookmark = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _ActionButton(
          icon: isLiked ? AppIcons.like : AppIcons.likeOutline,
          color: isLiked ? context.colors.primaryAccent : context.colors.textPrimary,
          label: _formatCount(likeCount),
          onTap: onLike,
          animate: isLiked,
        ),
        const SizedBox(width: 16),
        _ActionButton(
          icon: AppIcons.comment,
          color: context.colors.textPrimary,
          label: _formatCount(commentCount),
          onTap: onComment,
        ),
        const SizedBox(width: 16),
        _ActionButton(
          icon: AppIcons.share,
          color: context.colors.textPrimary,
          label: _formatCount(shareCount),
          onTap: onShare,
        ),
        const SizedBox(width: 16),
        _ActionButton(
          icon: AppIcons.reminder,
          color: context.colors.textPrimary,
          onTap: onReminder,
        ),
        const Spacer(),
        if (showBookmark)
          _ActionButton(
            icon: isBookmarked ? AppIcons.bookmark : AppIcons.bookmarkOutline,
            color: isBookmarked ? context.colors.secondaryAccent : context.colors.textPrimary,
            onTap: onBookmark,
            animate: isBookmarked,
          ),
      ],
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
    this.size = 24,
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
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _scale,
            builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
            child: Icon(widget.icon, size: widget.size, color: widget.color),
          ),
          if (widget.label != null && widget.label!.isNotEmpty) ...[
            const SizedBox(width: 6),
            Text(
              widget.label!,
              style: AppTypography.labelMedium.copyWith(
                color: widget.color,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

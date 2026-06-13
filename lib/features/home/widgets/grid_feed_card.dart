import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../models/feed_models.dart';
import 'video_player_widget.dart';

/// Compact grid card for Pinterest-style discovery mode
class GridFeedCard extends StatefulWidget {
  final FeedPost post;
  final VoidCallback onTap;

  const GridFeedCard({super.key, required this.post, required this.onTap});

  @override
  State<GridFeedCard> createState() => _GridFeedCardState();
}

class _GridFeedCardState extends State<GridFeedCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 100), vsync: this);
    _scale = Tween(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) { _ctrl.reverse(); widget.onTap(); },
      onTapCancel: () => _ctrl.reverse(),
      child: AnimatedBuilder(
        animation: _scale,
        builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
        child: Container(
          decoration: BoxDecoration(
            color: context.colors.card,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: context.colors.border, width: 0.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 12, offset: const Offset(0, 4), spreadRadius: -4,
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Media
              AspectRatio(
                aspectRatio: 1 / widget.post.aspectRatio,
                child: widget.post.videoUrl != null && widget.post.videoUrl!.isNotEmpty
                    ? VideoPlayerWidget(
                        videoUrl: widget.post.videoUrl!,
                        aspectRatio: 1 / widget.post.aspectRatio,
                        allowInteraction: false,
                      )
                    : CachedNetworkImage(
                        imageUrl: widget.post.mediaUrl,
                        fit: BoxFit.cover,
                        memCacheWidth: 600,
                        placeholder: (context, url) => Container(color: context.colors.surface),
                        errorWidget: (context, url, error) => Container(
                          color: context.colors.surface,
                          child: Icon(Icons.image_outlined, color: context.colors.textTertiary),
                        ),
                      ),
              ),
              // Info
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.post.title,
                      style: AppTypography.labelLarge.copyWith(fontSize: 12, fontWeight: FontWeight.w600),
                      maxLines: 2, overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => context.push('/brand/${widget.post.brandId}'),
                      child: Row(
                        children: [
                          // Avatar
                          Container(
                            width: 18, height: 18,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: context.colors.border, width: 0.5),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: CachedNetworkImage(
                              imageUrl: widget.post.brandAvatar, fit: BoxFit.cover,
                              memCacheWidth: 100,
                              errorWidget: (context, url, error) => Container(color: context.colors.surface),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              widget.post.brandName,
                              style: AppTypography.labelSmall.copyWith(fontSize: 10),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (widget.post.isVerified) ...[
                            const SizedBox(width: 3),
                            Icon(Icons.verified_rounded, size: 11, color: context.colors.primaryAccent),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    // Likes
                    Row(
                      children: [
                        Icon(
                          widget.post.isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          size: 12,
                          color: widget.post.isLiked ? context.colors.primaryAccent : context.colors.textTertiary,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          _fmt(widget.post.likeCount),
                          style: AppTypography.labelSmall.copyWith(fontSize: 10),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _fmt(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }
}

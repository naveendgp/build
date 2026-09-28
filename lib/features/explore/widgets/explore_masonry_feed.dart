import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../home/widgets/video_player_widget.dart';
import '../models/explore_models.dart';

/// Pinterest-inspired masonry feed grid
class ExploreMasonryFeed extends StatelessWidget {
  final List<FeedPost> posts;
  final ValueChanged<FeedPost> onTap;

  const ExploreMasonryFeed({super.key, required this.posts, required this.onTap});

  @override
  Widget build(BuildContext context) {
    if (posts.isEmpty) {
      return _EmptyFeedState();
    }

    // Split into two columns
    final leftPosts = <FeedPost>[];
    final rightPosts = <FeedPost>[];
    for (int i = 0; i < posts.length; i++) {
      if (i % 2 == 0) {
        leftPosts.add(posts[i]);
      } else {
        rightPosts.add(posts[i]);
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left column
          Expanded(
            child: Column(
              children: leftPosts
                  .map(
                    (p) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _MasonryCard(post: p, onTap: () => onTap(p)),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(width: 10),
          // Right column
          Expanded(
            child: Column(
              children: [
                const SizedBox(height: 32), // offset to create stagger
                ...rightPosts
                    .map(
                      (p) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _MasonryCard(post: p, onTap: () => onTap(p)),
                      ),
                    )
                    .toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MasonryCard extends StatefulWidget {
  final FeedPost post;
  final VoidCallback onTap;

  const _MasonryCard({required this.post, required this.onTap});

  @override
  State<_MasonryCard> createState() => _MasonryCardState();
}

class _MasonryCardState extends State<_MasonryCard> with SingleTickerProviderStateMixin {
  late final AnimationController _pressCtrl;

  @override
  void initState() {
    super.initState();
    _pressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      lowerBound: 0.96,
      upperBound: 1.0,
      value: 1.0,
    );
  }

  @override
  void dispose() {
    _pressCtrl.dispose();
    super.dispose();
  }

  String _formatCount(int count) {
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return count.toString();
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    // Dynamic height based on aspectRatio
    final double ratio = post.aspectRatio.clamp(0.6, 1.8);
    final double cardWidth = (MediaQuery.of(context).size.width - AppSpacing.md * 2 - 10) / 2;
    final double cardHeight = cardWidth / ratio;

    return GestureDetector(
      onTapDown: (_) => _pressCtrl.reverse(),
      onTapUp: (_) {
        _pressCtrl.forward();
        widget.onTap();
      },
      onTapCancel: () => _pressCtrl.forward(),
      child: AnimatedBuilder(
        animation: _pressCtrl,
        builder: (_, child) => Transform.scale(scale: _pressCtrl.value, child: child),
        child: Container(
          height: cardHeight,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Media
                if (post.videoUrl != null && post.videoUrl!.isNotEmpty)
                  VideoPlayerWidget(
                    videoUrl: post.videoUrl!,
                    aspectRatio: ratio,
                    placeholderUrl: post.mediaUrl,
                    allowInteraction: false,
                    showControls: false,
                  )
                else if (post.mediaUrl.isNotEmpty)
                  CachedNetworkImage(
                    imageUrl: post.mediaUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => _ShimmerBox(),
                    errorWidget: (_, __, ___) => Container(color: context.colors.surface),
                  )
                else
                  Container(color: context.colors.surface),

                // Gradient overlay at bottom
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: cardHeight * 0.45,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withOpacity(0.65)],
                      ),
                    ),
                  ),
                ),

                // AI/Trending badge — top left
                if (post.aiReason != null)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.45),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        post.aiReason!.contains('Trending') ? '🔥' : '⭐',
                        style: const TextStyle(fontSize: 10),
                      ),
                    ),
                  ),

                // Bottom content
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          post.title,
                          style: AppTypography.labelMedium.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                post.brandName,
                                style: AppTypography.labelSmall.copyWith(
                                  color: Colors.white.withOpacity(0.75),
                                  fontSize: 9,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (post.isVerified) ...[
                              const SizedBox(width: 3),
                              const Icon(Icons.verified_rounded, color: Colors.red, size: 9),
                            ],
                            const Spacer(),
                            const Icon(Icons.favorite_rounded, color: Colors.white60, size: 10),
                            const SizedBox(width: 3),
                            Text(
                              _formatCount(post.likeCount),
                              style: AppTypography.labelSmall.copyWith(
                                color: Colors.white70,
                                fontSize: 9,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ShimmerBox extends StatefulWidget {
  @override
  State<_ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<_ShimmerBox> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat(reverse: true);
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              context.colors.surface,
              context.colors.surface.withOpacity(0.6),
              context.colors.surface,
            ],
            stops: [0.0, _anim.value, 1.0],
          ),
        ),
      ),
    );
  }
}

class _EmptyFeedState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: AppSpacing.lg),
      child: Column(
        children: [
          Icon(Icons.explore_off_rounded, size: 56, color: context.colors.textTertiary),
          const SizedBox(height: 16),
          Text(
            'Nothing here yet',
            style: AppTypography.titleSmall.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try a different category or search for something specific.',
            style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

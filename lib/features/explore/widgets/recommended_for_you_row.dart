import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../home/widgets/video_player_widget.dart';
import '../models/explore_models.dart';

/// Recommended For You — AI-powered horizontal cards with reason labels
class RecommendedForYouRow extends StatelessWidget {
  final List<FeedPost> posts;
  final ValueChanged<FeedPost> onTap;

  const RecommendedForYouRow({
    super.key,
    required this.posts,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (posts.isEmpty) {
      return _EmptyRecommendations();
    }

    return SizedBox(
      height: 220,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        itemCount: posts.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) => _RecommendedCard(
          post: posts[i],
          onTap: () => onTap(posts[i]),
        ),
      ),
    );
  }
}

class _RecommendedCard extends StatelessWidget {
  final FeedPost post;
  final VoidCallback onTap;

  const _RecommendedCard({required this.post, required this.onTap});

  String _formatCount(int count) {
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return count.toString();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.18),
              blurRadius: 14,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Media
              if (post.videoUrl != null && post.videoUrl!.isNotEmpty)
                VideoPlayerWidget(
                  videoUrl: post.videoUrl!,
                  aspectRatio: 160 / 220, // using the card's width and height
                  placeholderUrl: post.mediaUrl,
                  allowInteraction: false,
                  showControls: false,
                )
              else if (post.mediaUrl.isNotEmpty)
                CachedNetworkImage(
                  imageUrl: post.mediaUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: context.colors.surface),
                  errorWidget: (_, __, ___) => Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          context.colors.primaryAccent.withOpacity(0.5),
                          context.colors.secondaryAccent.withOpacity(0.3),
                        ],
                      ),
                    ),
                  ),
                )
              else
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        context.colors.primaryAccent.withOpacity(0.5),
                        context.colors.secondaryAccent.withOpacity(0.3),
                      ],
                    ),
                  ),
                ),

              // Dark gradient overlay
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.35, 1.0],
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.78),
                      ],
                    ),
                  ),
                ),
              ),

              // AI Reason badge
              if (post.aiReason != null)
                Positioned(
                  top: 10,
                  left: 10,
                  right: 10,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(100),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.35),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text('🎯', style: TextStyle(fontSize: 9)),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                post.aiReason!,
                                style: AppTypography.labelSmall.copyWith(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

              // Bottom content
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        post.title,
                        style: AppTypography.labelMedium.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              post.brandName,
                              style: AppTypography.labelSmall.copyWith(
                                color: Colors.white70,
                                fontSize: 10,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (post.isVerified) ...[
                            const SizedBox(width: 3),
                            const Icon(Icons.verified_rounded, color: Colors.red, size: 10),
                          ],
                          const Spacer(),
                          const Icon(Icons.favorite_rounded, color: Colors.white54, size: 11),
                          const SizedBox(width: 3),
                          Text(
                            _formatCount(post.likeCount),
                            style: AppTypography.labelSmall.copyWith(
                              color: Colors.white60,
                              fontSize: 10,
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
    );
  }
}

class _EmptyRecommendations extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          border: Border.all(color: context.colors.borderLight),
        ),
        child: Row(
          children: [
            Icon(Icons.auto_awesome_rounded,
                color: context.colors.primaryAccent, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Personalizing for you',
                    style: AppTypography.labelLarge.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Follow brands and save posts to unlock AI recommendations.',
                    style: AppTypography.bodySmall.copyWith(
                      color: context.colors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

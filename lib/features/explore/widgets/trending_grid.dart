import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../home/widgets/video_player_widget.dart';
import '../../home/models/feed_models.dart';

// Lyket Explore â€” Trending Posts Masonry Grid
class TrendingGrid extends StatelessWidget {
  final List<FeedPost> posts;
  final VoidCallback? onSeeAll;
  final ValueChanged<FeedPost>? onTap;

  const TrendingGrid({
    super.key,
    required this.posts,
    this.onSeeAll,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeader(context, ),
        SizedBox(height: AppSpacing.md),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: MasonryGridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            itemCount: posts.length,
            itemBuilder: (context, index) => _TrendingCard(
              post: posts[index],
              onTap: () => onTap?.call(posts[index]),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(BuildContext context, ) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Text(
            'Trending Now',
            style: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.w600, color: context.colors.textPrimary),
          ),
        ],
      ),
    );
  }
}

class _TrendingCard extends StatelessWidget {
  final FeedPost post;
  final VoidCallback? onTap;

  const _TrendingCard({
    required this.post,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.colors.border, width: 0.5),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image or Video with optional AI badge
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: post.aspectRatio,
                  child: post.videoUrl != null && post.videoUrl!.isNotEmpty
                      ? VideoPlayerWidget(
                          videoUrl: post.videoUrl!,
                          aspectRatio: post.aspectRatio,
                          allowInteraction: false,
                        )
                      : CachedNetworkImage(
                          imageUrl: post.mediaUrl,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: context.colors.surface,
                            child: Center(
                              child: SizedBox(
                                width: 18, height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 1.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(context.colors.borderLight),
                                ),
                              ),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: context.colors.surface,
                            child: Icon(Icons.image_not_supported, color: context.colors.textTertiary),
                          ),
                        ),
                ),
                // Floating AI label badge
                if (post.aiReason != null)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: context.colors.primaryAccent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                      ),
                      child: Text(
                        post.aiReason!,
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.primaryAccent,
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            // Title + likes
            Padding(
              padding: EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: AppTypography.labelSmall.copyWith(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: context.colors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.favorite_rounded,
                        size: 12,
                        color: context.colors.textTertiary,
                      ),
                      SizedBox(width: 3),
                      Text(
                        _formatCount(post.likeCount),
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
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }
}

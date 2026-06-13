import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/network/api_client.dart';
import '../../home/widgets/video_player_widget.dart';
import '../../home/models/feed_models.dart';
import '../../explore/screens/explore_post_detail_screen.dart';
import '../models/brand_profile_models.dart';

class BrandPostsTab extends StatelessWidget {
  final List<BrandPost> posts;
  final BrandProfile profile;

  const BrandPostsTab({super.key, required this.posts, required this.profile});

  @override
  Widget build(BuildContext context) {
    if (posts.isEmpty) {
      return Center(
        child: Text(
          'No posts yet',
          style: AppTypography.bodyLarge.copyWith(color: context.colors.textSecondary),
        ),
      );
    }

    return MasonryGridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      crossAxisCount: 2,
      mainAxisSpacing: AppSpacing.md,
      crossAxisSpacing: AppSpacing.md,
      itemCount: posts.length,
      itemBuilder: (context, index) {
        final post = posts[index];
        return _BrandPostCard(post: post, profile: profile);
      },
    );
  }
}

class _BrandPostCard extends StatelessWidget {
  final BrandPost post;
  final BrandProfile profile;

  const _BrandPostCard({required this.post, required this.profile});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        final feedPost = FeedPost(
          id: post.id,
          brandId: profile.id,
          brandName: profile.name,
          brandAvatar: profile.logoUrl,
          isVerified: profile.isVerified,
          mediaUrl: post.imageUrl,
          videoUrl: post.mediaType == 'VIDEO' ? post.imageUrl : null,
          aspectRatio: post.aspectRatio,
          title: post.title,
          description: post.title,
          tags: const [],
          objective: post.objectiveLabel,
          ctaLabel: null,
          ctaType: null,
          ctaPayload: null,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          shareCount: 0,
          isLiked: false,
          isBookmarked: false,
          isFollowing: profile.isFollowing,
          timestamp: 'Just now',
          aiReason: null,
          carouselUrls: null,
        );

        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ExplorePostDetailScreen(post: feedPost),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: AppSpacing.borderRadiusMd,
          child: AspectRatio(
            aspectRatio: post.aspectRatio,
            child: Stack(
              fit: StackFit.expand,
              children: [
                post.mediaType == 'VIDEO' && post.imageUrl.isNotEmpty
                    ? VideoPlayerWidget(videoUrl: ApiClient.resolveMediaUrl(post.imageUrl), aspectRatio: post.aspectRatio)
                    : post.imageUrl.isNotEmpty
                        ? Image.network(
                            ApiClient.resolveMediaUrl(post.imageUrl),
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              color: context.colors.card,
                              child: Icon(Icons.broken_image, color: context.colors.textTertiary),
                            ),
                          )
                        : Container(
                            color: context.colors.card,
                            child: Icon(Icons.broken_image, color: context.colors.textTertiary),
                          ),
                if (post.objectiveLabel != null)
                  Positioned(
                    top: AppSpacing.sm,
                    right: AppSpacing.sm,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xxs),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: AppSpacing.borderRadiusSm,
                      ),
                      child: Text(
                        post.objectiveLabel!,
                        style: AppTypography.labelSmall.copyWith(color: context.colors.textPrimary),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          post.title,
          style: AppTypography.labelLarge,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: AppSpacing.xxs),
        Row(
          children: [
            Icon(Icons.favorite_rounded, size: AppSpacing.iconSm, color: context.colors.textSecondary),
            const SizedBox(width: AppSpacing.xs),
            Text(
              '${post.likeCount}',
              style: AppTypography.labelMedium,
            ),
          ],
        ),
      ],
    ));
  }
}

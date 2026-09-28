import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../models/explore_models.dart';

// Lyket Explore — AI-Suggested Posts Horizontal Carousel
class SuggestedCarousel extends StatelessWidget {
  final List<FeedPost> posts;
  final VoidCallback? onSeeAll;
  final ValueChanged<FeedPost>? onTap;

  const SuggestedCarousel({super.key, required this.posts, this.onSeeAll, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeader(context),
        SizedBox(height: AppSpacing.md),
        SizedBox(
          height: 280,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 20),
            itemCount: posts.length,
            separatorBuilder: (context, index) => SizedBox(width: 14),
            itemBuilder: (context, index) =>
                _SuggestedCard(post: posts[index], onTap: () => onTap?.call(posts[index])),
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Text(
            'Suggested For You',
            style: AppTypography.titleSmall.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colors.textPrimary,
            ),
          ),
          SizedBox(width: 6),
          Icon(Icons.auto_awesome, size: 16, color: context.colors.primaryAccent),
        ],
      ),
    );
  }
}

class _SuggestedCard extends StatelessWidget {
  final FeedPost post;
  final VoidCallback? onTap;

  const _SuggestedCard({required this.post, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 220,
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.colors.border, width: 0.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 16,
              offset: Offset(0, 6),
              spreadRadius: -4,
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              child: SizedBox(
                height: 160,
                width: double.infinity,
                child: CachedNetworkImage(
                  imageUrl: post.mediaUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(color: context.colors.surface),
                  errorWidget: (context, url, error) => Container(
                    color: context.colors.surface,
                    child: Icon(Icons.image_outlined, color: context.colors.textTertiary),
                  ),
                ),
              ),
            ),
            // Content
            Padding(
              padding: EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: AppTypography.labelLarge.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 6),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          post.brandName,
                          style: AppTypography.labelSmall.copyWith(fontSize: 10),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (post.aiReason != null) ...[
                        SizedBox(width: 6),
                        Text(
                          post.aiReason!,
                          style: AppTypography.labelSmall.copyWith(
                            fontSize: 10,
                            color: context.colors.primaryAccent,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
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
}

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../models/explore_models.dart';

// Lyket Explore â€” Brand Discovery Cards
class BrandSpotlight extends StatelessWidget {
  final List<ExploreBrand> brands;
  final ValueChanged<String> onFollow;
  final VoidCallback? onSeeAll;
  final ValueChanged<ExploreBrand>? onTap;

  const BrandSpotlight({
    super.key,
    required this.brands,
    required this.onFollow,
    this.onSeeAll,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeader(context),
        const SizedBox(height: AppSpacing.md),
        SizedBox(
          height: 240,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: brands.length,
            separatorBuilder: (context, index) => const SizedBox(width: 14),
            itemBuilder: (context, index) => _BrandCard(
              brand: brands[index],
              onFollow: () => onFollow(brands[index].id),
              onTap: () => onTap?.call(brands[index]),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Text(
            'Discover Brands',
            style: AppTypography.titleSmall.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _BrandCard extends StatelessWidget {
  final ExploreBrand brand;
  final VoidCallback onFollow;
  final VoidCallback? onTap;

  const _BrandCard({required this.brand, required this.onFollow, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: context.colors.border, width: 0.5),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            // Cover image
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
              child: SizedBox(
                height: 90,
                width: double.infinity,
                child: CachedNetworkImage(
                  imageUrl: brand.coverUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(color: context.colors.surface),
                  errorWidget: (context, url, error) => Container(
                    color: context.colors.surface,
                    child: Icon(Icons.image_outlined, size: 22, color: context.colors.textTertiary),
                  ),
                ),
              ),
            ),
            // Brand info
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Circular avatar
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: context.colors.borderLight, width: 1),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: ClipOval(
                        child: CachedNetworkImage(
                          imageUrl: brand.avatarUrl,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(color: context.colors.surface),
                          errorWidget: (context, url, error) => Container(
                            color: context.colors.surface,
                            child: Icon(
                              Icons.business,
                              size: 16,
                              color: context.colors.textTertiary,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Name + verified
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Flexible(
                          child: Text(
                            brand.name,
                            style: AppTypography.labelLarge.copyWith(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                        if (brand.isVerified) ...[
                          const SizedBox(width: 3),
                          Icon(Icons.verified_rounded, size: 12, color: Colors.red),
                        ],
                      ],
                    ),
                    // Follower count
                    Text(
                      _formatFollowers(brand.followerCount),
                      style: AppTypography.labelSmall.copyWith(fontSize: 10),
                    ),
                    const SizedBox(height: 8),
                    // Follow button
                    GestureDetector(
                      onTap: onFollow,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
                        decoration: BoxDecoration(
                          color: brand.isFollowing
                              ? Colors.transparent
                              : context.colors.primaryAccent,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                          border: brand.isFollowing
                              ? Border.all(color: context.colors.border, width: 0.5)
                              : null,
                        ),
                        child: Text(
                          brand.isFollowing ? 'Following' : 'Follow',
                          style: AppTypography.labelSmall.copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                            color: brand.isFollowing ? context.colors.textSecondary : Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatFollowers(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M followers';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K followers';
    return '$count followers';
  }
}

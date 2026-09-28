import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/explore_models.dart';

/// Trending Brands Carousel — Premium brand discovery strip
class TrendingBrandsCarousel extends StatefulWidget {
  final List<ExploreBrand> brands;
  final ValueChanged<ExploreBrand> onTap;
  final ValueChanged<ExploreBrand> onFollow;

  const TrendingBrandsCarousel({
    super.key,
    required this.brands,
    required this.onTap,
    required this.onFollow,
  });

  @override
  State<TrendingBrandsCarousel> createState() => _TrendingBrandsCarouselState();
}

class _TrendingBrandsCarouselState extends State<TrendingBrandsCarousel> {
  final Set<String> _followedIds = {};

  @override
  Widget build(BuildContext context) {
    if (widget.brands.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 210,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        itemCount: widget.brands.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final brand = widget.brands[index];
          final isFollowed = _followedIds.contains(brand.id) || brand.isFollowing;
          return _BrandCard(
            brand: brand,
            isFollowed: isFollowed,
            onTap: () => widget.onTap(brand),
            onFollow: () {
              setState(() {
                if (_followedIds.contains(brand.id)) {
                  _followedIds.remove(brand.id);
                } else {
                  _followedIds.add(brand.id);
                }
              });
              widget.onFollow(brand);
            },
          );
        },
      ),
    );
  }
}

class _BrandCard extends StatelessWidget {
  final ExploreBrand brand;
  final bool isFollowed;
  final VoidCallback onTap;
  final VoidCallback onFollow;

  const _BrandCard({
    required this.brand,
    required this.isFollowed,
    required this.onTap,
    required this.onFollow,
  });

  String _formatFollowers(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(0)}k';
    return count.toString();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 150,
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          border: Border.all(color: context.colors.borderLight),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Cover image
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: brand.coverUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: context.colors.surface),
                      errorWidget: (_, __, ___) => Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              context.colors.primaryAccent.withOpacity(0.6),
                              context.colors.secondaryAccent.withOpacity(0.4),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Gradient scrim
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black.withOpacity(0.5)],
                          ),
                        ),
                      ),
                    ),
                    // Category badge
                    Positioned(
                      top: 8,
                      left: 8,
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
                            child: Text(
                              brand.category,
                              style: AppTypography.labelSmall.copyWith(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    // Avatar
                    Positioned(
                      bottom: 8,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: ClipOval(
                            child: CachedNetworkImage(
                              imageUrl: brand.avatarUrl,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Container(color: context.colors.surface),
                              errorWidget: (_, __, ___) => Container(color: context.colors.surface),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Info section
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Flexible(
                          child: Text(
                            brand.name,
                            style: AppTypography.labelMedium.copyWith(
                              color: context.colors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        if (brand.isVerified) ...[
                          const SizedBox(width: 3),
                          const Icon(Icons.verified_rounded, color: Colors.red, size: 12),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_formatFollowers(brand.followerCount)} followers',
                      style: AppTypography.labelSmall.copyWith(
                        color: context.colors.textSecondary,
                        fontSize: 10,
                      ),
                    ),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: onFollow,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: isFollowed ? context.colors.surface : context.colors.primaryAccent,
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(
                            color: isFollowed
                                ? context.colors.border
                                : context.colors.primaryAccent,
                          ),
                        ),
                        child: Text(
                          isFollowed ? 'Following' : 'Follow',
                          style: AppTypography.labelSmall.copyWith(
                            color: isFollowed ? context.colors.textSecondary : Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
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
}

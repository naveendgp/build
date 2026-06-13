import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/brand_profile_models.dart';

class BrandHeroHeader extends StatelessWidget {
  final BrandProfile profile;

  const BrandHeroHeader({
    super.key,
    required this.profile,
  });

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cover Image
              Container(
                height: 240,
                width: double.infinity,
                decoration: BoxDecoration(
                  image: profile.coverUrl.isNotEmpty 
                      ? DecorationImage(
                          image: NetworkImage(profile.coverUrl),
                          fit: BoxFit.cover,
                        )
                      : null,
                  color: profile.coverUrl.isEmpty ? context.colors.surface : null,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.3),
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.4),
                      ],
                    ),
                  ),
                ),
              ),
              
              // Profile Details
              Padding(
                padding: const EdgeInsets.only(
                  left: AppSpacing.md,
                  right: AppSpacing.md,
                  top: 60, // Space for the overlapping avatar
                  bottom: AppSpacing.lg,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                profile.name,
                                style: AppTypography.headlineLarge.copyWith(
                                  color: context.colors.textPrimary,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.5,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (profile.username.isNotEmpty)
                                Text(
                                  profile.username.startsWith('@') ? profile.username : '@${profile.username}',
                                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                                ),
                            ],
                          ),
                        ),
                        if (profile.isVerified) ...[
                          const SizedBox(width: AppSpacing.xs),
                          Icon(
                            Icons.verified,
                            color: context.colors.secondaryAccent,
                            size: 24,
                          ),
                        ],
                      ],
                    ),
                    if (profile.tagline != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        profile.tagline!,
                        style: AppTypography.bodyMedium.copyWith(
                          color: context.colors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.lg),
                    _buildStatsRow(context),
                    const SizedBox(height: AppSpacing.lg),
                    if (profile.bio != null)
                      Text(
                        profile.bio!,
                        style: AppTypography.bodyMedium.copyWith(
                          color: context.colors.textPrimary,
                          height: 1.5,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          
          // Overlapping Avatar
          Positioned(
            top: 240 - 56, // 240 is cover height, 56 is half of avatar radius
            left: AppSpacing.md,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: context.colors.background,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  color: context.colors.card,
                  shape: BoxShape.circle,
                ),
                clipBehavior: Clip.antiAlias,
                child: profile.logoUrl.isNotEmpty 
                    ? Image.network(
                        profile.logoUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: context.colors.primaryAccent.withValues(alpha: 0.1),
                            child: Center(
                              child: Text(
                                profile.name.isNotEmpty ? profile.name[0].toUpperCase() : 'B',
                                style: AppTypography.headlineMedium.copyWith(color: context.colors.primaryAccent, fontWeight: FontWeight.bold),
                              ),
                            ),
                          );
                        },
                      )
                    : Container(
                        color: context.colors.primaryAccent.withValues(alpha: 0.1),
                        child: Center(
                          child: Text(
                            profile.name.isNotEmpty ? profile.name[0].toUpperCase() : 'B',
                            style: AppTypography.headlineMedium.copyWith(color: context.colors.primaryAccent, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.borderLight),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildStatItem(context, 'Followers', _formatCount(profile.followerCount)),
          _buildVerticalDivider(context),
          _buildStatItem(context, 'Posts', _formatCount(profile.postCount)),
        ],
      ),
    );
  }

  Widget _buildStatItem(BuildContext context, String label, String value) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTypography.labelMedium.copyWith(
            color: context.colors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildVerticalDivider(BuildContext context) {
    return Container(
      height: 32,
      width: 1,
      color: context.colors.border,
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}

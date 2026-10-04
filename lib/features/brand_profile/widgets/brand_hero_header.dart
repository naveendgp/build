import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/brand_profile_models.dart';
import 'followers_bottom_sheet.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/haptics.dart';
import '../../auth/providers/auth_provider.dart';
import '../../settings/providers/settings_provider.dart';
import '../../../core/utils/app_messenger.dart';

class BrandHeroHeader extends ConsumerWidget {
  final BrandProfile profile;

  const BrandHeroHeader({super.key, required this.profile});

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isUser = ref.watch(authProvider).loggedInRole == UserRole.user;

    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 240 + 52,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Cover Image
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 240,
                  child: Image.network(
                    profile.coverUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        Container(color: context.colors.surface),
                  ),
                ),
                // Subtle gradient for text legibility if needed later, omitted to keep clean unless specified
                // Avatar
                Positioned(
                  bottom: 0,
                  left: 16,
                  child: Container(
                    width: 104,
                    height: 104,
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: context.colors.background,
                      shape: BoxShape.circle,
                    ),
                    child: ClipOval(
                      child: Image.network(
                        profile.logoUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: context.colors.surface,
                          alignment: Alignment.center,
                          child: Text(
                            profile.name.isNotEmpty ? profile.name[0].toUpperCase() : '?',
                            style: AppTypography.titleLarge.copyWith(
                              color: context.colors.textPrimary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Settings Button (brand owner viewing their own profile)
                if (profile.isOwner)
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 8,
                    right: 16,
                    child: GestureDetector(
                      onTap: () {
                        Haptics.selection();
                        context.push('/settings');
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.3),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.menu_rounded, color: Colors.white, size: 24),
                      ),
                    ),
                  ),
                // More Options Button
                if (isUser)
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 8,
                    right: 16,
                    child: GestureDetector(
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          backgroundColor: context.colors.card,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                          ),
                          builder: (context) {
                            return SafeArea(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const SizedBox(height: 12),
                                  Container(
                                    width: 40,
                                    height: 4,
                                    decoration: BoxDecoration(
                                      color: context.colors.border,
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  ListTile(
                                    leading: Icon(
                                      Icons.visibility_off_outlined,
                                      color: context.colors.textPrimary,
                                    ),
                                    title: Text(
                                      'Not Interested',
                                      style: AppTypography.bodyLarge.copyWith(
                                        color: context.colors.textPrimary,
                                      ),
                                    ),
                                    onTap: () {
                                      Navigator.pop(context);
                                      AppMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'We will show fewer posts from this brand.',
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                  ListTile(
                                    leading: Icon(Icons.flag_outlined, color: context.colors.error),
                                    title: Text(
                                      'Report',
                                      style: AppTypography.bodyLarge.copyWith(
                                        color: context.colors.error,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    onTap: () {
                                      Navigator.pop(context);
                                      context.push('/help/live-chat?category=SPAM');
                                    },
                                  ),
                                  ListTile(
                                    leading: Icon(
                                      Icons.block_outlined,
                                      color: context.colors.error,
                                    ),
                                    title: Text(
                                      'Block Brand',
                                      style: AppTypography.bodyLarge.copyWith(
                                        color: context.colors.error,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    onTap: () {
                                      final messenger = AppMessenger.of(context);
                                      Navigator.pop(context);
                                      ref
                                          .read(blockedBrandsProvider.notifier)
                                          .blockBrand(profile.id);
                                      messenger.showSnackBar(
                                        const SnackBar(
                                          content: Text('Brand blocked successfully.'),
                                        ),
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 8),
                                ],
                              ),
                            );
                          },
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.3),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.more_vert_rounded, color: Colors.white, size: 24),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 12, left: 16, right: 16, bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      profile.name,
                      style: AppTypography.titleLarge.copyWith(
                        fontWeight: FontWeight.bold,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    if (profile.isVerified) ...[
                      const SizedBox(width: AppSpacing.xs),
                      Icon(Icons.verified, size: 20, color: Colors.red),
                    ],
                  ],
                ),
                Text(
                  '@${profile.username}',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                ),
                // What the brand does. It was stored and never shown, so a
                // visitor had no idea what kind of business this is.
                if (profile.category.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.storefront_outlined,
                        size: 14,
                        color: context.colors.textTertiary,
                      ),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          profile.subCategory == null || profile.subCategory!.trim().isEmpty
                              ? profile.category
                              : '${profile.category} · ${profile.subCategory}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.labelSmall.copyWith(
                            color: context.colors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    _buildStatItem(context, count: _formatCount(profile.postCount), label: 'Posts'),
                    const SizedBox(width: 24),
                    GestureDetector(
                      onTap: () => showFollowersBottomSheet(context, profile.id),
                      behavior: HitTestBehavior.opaque,
                      child: _buildStatItem(
                        context,
                        count: _formatCount(profile.followerCount),
                        label: 'Followers',
                      ),
                    ),
                    // Only the brand owner has their own saved posts to
                    // show — visiting another brand's profile shouldn't
                    // surface someone else's private saved list. No count
                    // is shown (unlike Posts/Followers) since that data
                    // isn't loaded on this screen — an icon + label reads
                    // more honestly than a fake/blank number would.
                    if (profile.isOwner) ...[
                      const SizedBox(width: 24),
                      GestureDetector(
                        onTap: () {
                          Haptics.selection();
                          context.push('/brand-saved');
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Row(
                          children: [
                            Icon(
                              Icons.bookmark_border_rounded,
                              size: 18,
                              color: context.colors.textPrimary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Saved',
                              style: AppTypography.bodyMedium.copyWith(
                                color: context.colors.textPrimary,
                              ),
                            ),
                          ],
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
    );
  }

  Widget _buildStatItem(BuildContext context, {required String count, required String label}) {
    return Row(
      children: [
        Text(
          count,
          style: AppTypography.bodyMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/brand_profile_models.dart';

class BrandActionButtons extends StatelessWidget {
  final BrandProfile profile;
  final VoidCallback onFollowToggled;
  final VoidCallback onMessageTap;
  final VoidCallback onWebsiteTap;
  final bool isBrand;
  final bool isOwner;
  final VoidCallback? onEditProfileTap;
  final VoidCallback? onLeadCenterTap;

  const BrandActionButtons({
    super.key,
    required this.profile,
    required this.onFollowToggled,
    required this.onMessageTap,
    required this.onWebsiteTap,
    this.isBrand = false,
    this.isOwner = false,
    this.onEditProfileTap,
    this.onLeadCenterTap,
  });

  @override
  Widget build(BuildContext context) {
    if (isOwner) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () {
                  Haptics.light();
                  onEditProfileTap?.call();
                },
                behavior: HitTestBehavior.opaque,
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: context.colors.primaryAccent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'Edit Profile',
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: GestureDetector(
                onTap: () {
                  Haptics.light();
                  onLeadCenterTap?.call();
                },
                behavior: HitTestBehavior.opaque,
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: context.colors.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: context.colors.borderLight),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'Dashboard',
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: context.colors.textPrimary,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          if (!isBrand)
            Expanded(
            child: GestureDetector(
              onTap: () {
                Haptics.light();
                onFollowToggled();
              },
              behavior: HitTestBehavior.opaque,
              child: Container(
                height: 40,
                decoration: BoxDecoration(
                  color: context.colors.primaryAccent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  profile.isFollowing ? 'Following' : 'Follow',
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
          if (!isBrand)
            const SizedBox(width: 8),
          Expanded(
            child: GestureDetector(
              onTap: () {
                Haptics.light();
                onMessageTap();
              },
              behavior: HitTestBehavior.opaque,
              child: Container(
                height: 40,
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: context.colors.borderLight),
                ),
                alignment: Alignment.center,
                child: Text(
                  'Message',
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: context.colors.textPrimary,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          if (isBrand)
            Expanded(
              child: GestureDetector(
                onTap: () async {
                  Haptics.light();
                  await Clipboard.setData(ClipboardData(text: '@${profile.username}'));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Profile link copied!')),
                    );
                  }
                },
                behavior: HitTestBehavior.opaque,
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: context.colors.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: context.colors.borderLight),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'Share Profile',
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: context.colors.textPrimary,
                    ),
                  ),
                ),
              ),
            )
          else
            GestureDetector(
              onTap: () async {
                Haptics.light();
                await Clipboard.setData(ClipboardData(text: '@${profile.username}'));
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Profile link copied!')),
                  );
                }
              },
              behavior: HitTestBehavior.opaque,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: context.colors.borderLight),
                ),
                alignment: Alignment.center,
                child: Icon(
                  Icons.share_outlined,
                  size: 20,
                  color: context.colors.textPrimary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

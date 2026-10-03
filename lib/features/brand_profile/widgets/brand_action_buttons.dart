import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/brand_profile_models.dart';
import '../../../core/utils/app_messenger.dart';

class BrandActionButtons extends StatelessWidget {
  final BrandProfile profile;
  final VoidCallback onFollowToggled;
  final VoidCallback onMessageTap;
  final VoidCallback onWebsiteTap;
  final bool isOwner;
  final VoidCallback? onEditProfileTap;
  final VoidCallback? onLeadCenterTap;

  /// The bell. Shown to anyone who follows this brand - personal accounts and
  /// brands alike - so a brand's posts can be muted without unfollowing.
  final VoidCallback? onNotificationsToggled;

  const BrandActionButtons({
    super.key,
    required this.profile,
    required this.onFollowToggled,
    required this.onMessageTap,
    required this.onWebsiteTap,
    this.isOwner = false,
    this.onEditProfileTap,
    this.onLeadCenterTap,
    this.onNotificationsToggled,
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
          // Whoever is looking at someone else's brand sees the same row:
          // Follow, Message, the bell once following, and share. A brand got
          // a different, lesser version of this screen — no way to follow at
          // all — though the server has always allowed it.
          if (profile.isFollowing && onNotificationsToggled != null) ...[
              GestureDetector(
                onTap: () {
                  Haptics.light();
                  onNotificationsToggled!();
                },
                behavior: HitTestBehavior.opaque,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: profile.notifyOnPosts
                        ? context.colors.surface
                        : context.colors.primaryAccent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: profile.notifyOnPosts
                          ? context.colors.borderLight
                          : context.colors.primaryAccent.withValues(alpha: 0.4),
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    profile.notifyOnPosts
                        ? Icons.notifications_none_rounded
                        : Icons.notifications_off_rounded,
                    size: 20,
                    color: profile.notifyOnPosts
                        ? context.colors.textPrimary
                        : context.colors.primaryAccent,
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
          GestureDetector(
            onTap: () async {
              Haptics.light();
              await Clipboard.setData(ClipboardData(text: '@${profile.username}'));
              if (context.mounted) {
                AppMessenger.of(
                  context,
                ).showSnackBar(const SnackBar(content: Text('Profile link copied!')));
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
              child: Icon(Icons.share_outlined, size: 20, color: context.colors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

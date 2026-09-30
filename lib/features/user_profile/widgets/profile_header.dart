import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/user_profile_models.dart';
import 'following_bottom_sheet.dart';
import '../../settings/providers/settings_provider.dart';

class ProfileHeader extends ConsumerWidget {
  final UserProfileData profile;
  final int savedCount;
  final int collectionsCount;
  final int remindersCount;
  final VoidCallback? onSavedTap;
  final VoidCallback? onCollectionsTap;
  final VoidCallback? onRemindersTap;

  const ProfileHeader({
    super.key,
    required this.profile,
    required this.savedCount,
    this.collectionsCount = 0,
    this.remindersCount = 0,
    this.onSavedTap,
    this.onCollectionsTap,
    this.onRemindersTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch the local settings to show interests instantly without waiting for backend sync
    final settingsState = ref.watch(userSettingsProvider);
    final List<String> displayInterests =
        settingsState.value?.categoryInterests ?? profile.aiIdentityTags;
    return Column(
      children: [
        const SizedBox(height: 8),
        _buildAvatar(context),
        const SizedBox(height: 12),
        Text(
          profile.name,
          style: AppTypography.titleLarge.copyWith(
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 2),
        Text(
          '@${profile.username}',
          style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
          textAlign: TextAlign.center,
        ),
        if (displayInterests.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildIdentityTags(context, displayInterests),
        ],
        const SizedBox(height: 16),
        _buildStatsRow(context),
      ],
    );
  }

  Widget _buildAvatar(BuildContext context) {
    const double size = 96;
    const double ringWidth = 2.5;
    const double padding = 3;

    return Container(
      width: size + (ringWidth + padding) * 2,
      height: size + (ringWidth + padding) * 2,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [context.colors.textSecondary.withOpacity(0.5), context.colors.borderLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Container(
        margin: const EdgeInsets.all(ringWidth),
        decoration: BoxDecoration(shape: BoxShape.circle, color: context.colors.background),
        padding: const EdgeInsets.all(padding),
        child: ClipOval(
          child: profile.avatarUrl.isNotEmpty
              ? Image.network(
                  profile.avatarUrl,
                  width: size,
                  height: size,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _buildFallbackAvatar(context, size),
                )
              : _buildFallbackAvatar(context, size),
        ),
      ),
    );
  }

  Widget _buildFallbackAvatar(BuildContext context, double size) {
    return Container(
      width: size,
      height: size,
      color: context.colors.primaryAccent,
      alignment: Alignment.center,
      child: Text(
        profile.name.isNotEmpty ? profile.name[0].toUpperCase() : '?',
        style: AppTypography.displaySmall.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildStatsRow(BuildContext context) {
    // Wrapped in a horizontally-scrollable, centered container: 4 stat items
    // (up from 2) with word-length labels like "Collections" can overflow
    // narrower phone widths if simply centered in a plain Row.
    return Center(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: () => showFollowingBottomSheet(context),
              behavior: HitTestBehavior.opaque,
              child: _buildStatItem(context, profile.followingCount, 'Following'),
            ),
            _buildDotSeparator(context),
            GestureDetector(
              onTap: onSavedTap,
              behavior: HitTestBehavior.opaque,
              child: _buildStatItem(context, savedCount, 'Saved'),
            ),
            _buildDotSeparator(context),
            GestureDetector(
              onTap: onCollectionsTap,
              behavior: HitTestBehavior.opaque,
              child: _buildStatItem(context, collectionsCount, 'Collections'),
            ),
            _buildDotSeparator(context),
            GestureDetector(
              onTap: onRemindersTap,
              behavior: HitTestBehavior.opaque,
              child: _buildStatItem(context, remindersCount, 'Reminders'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(BuildContext context, int count, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          count.toString(),
          style: AppTypography.titleMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
        Text(label, style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary)),
      ],
    );
  }

  Widget _buildDotSeparator(BuildContext context) {
    return Padding(
      // Tightened from AppSpacing.md now that the row holds 4 stat items
      // (Following/Saved/Collections/Reminders) instead of 2 — the wider
      // gap would overflow on narrow phone widths.
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      child: Text(
        '·',
        style: AppTypography.titleMedium.copyWith(color: context.colors.textTertiary),
      ),
    );
  }

  Widget _buildIdentityTags(BuildContext context, List<String> interests) {
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 6,
      runSpacing: 6,
      children: interests.map((tag) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: context.colors.surface,
            border: Border.all(color: context.colors.borderLight),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            tag,
            style: AppTypography.labelSmall.copyWith(
              color: context.colors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
        );
      }).toList(),
    );
  }
}

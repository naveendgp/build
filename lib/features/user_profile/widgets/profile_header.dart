import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/user_profile_models.dart';
import '../../command_center/screens/command_center_screen.dart';

class ProfileHeader extends StatelessWidget {
  final UserProfileData profile;

  const ProfileHeader({super.key, required this.profile});

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 380,
      pinned: true,
      backgroundColor: context.colors.background,
      elevation: 0,
      leading: IconButton(
        icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary),
        onPressed: () => Navigator.of(context).pop(),
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.settings_rounded, color: context.colors.textPrimary),
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CommandCenterScreen()),
            );
          },
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            // Background
            Container(color: context.colors.background),
            // Profile Content
            Positioned(
              left: AppSpacing.lg,
              right: AppSpacing.lg,
              bottom: AppSpacing.lg,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: context.colors.borderLight, width: 2),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: profile.avatarUrl.isNotEmpty 
                            ? Image.network(
                                profile.avatarUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    color: context.colors.primaryAccent.withValues(alpha: 0.1),
                                    child: Center(
                                      child: Text(
                                        profile.name.isNotEmpty ? profile.name[0].toUpperCase() : 'U',
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
                                    profile.name.isNotEmpty ? profile.name[0].toUpperCase() : 'U',
                                    style: AppTypography.headlineMedium.copyWith(color: context.colors.primaryAccent, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              profile.name,
                              style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              profile.username,
                              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    profile.bio,
                    style: AppTypography.bodyLarge.copyWith(color: context.colors.textPrimary),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  if (profile.aiIdentityTags.isNotEmpty) ...[
                    Row(
                      children: profile.aiIdentityTags.map((tag) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: Text(
                            '• $tag',
                            style: AppTypography.labelMedium.copyWith(color: context.colors.primaryAccent),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

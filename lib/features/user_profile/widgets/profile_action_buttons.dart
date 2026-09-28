import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/user_profile_models.dart';
import '../../../core/utils/app_messenger.dart';

class ProfileActionButtons extends StatelessWidget {
  final UserProfileData profile;

  const ProfileActionButtons({
    super.key,
    required this.profile,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 48),
      child: Row(
        children: [
          Expanded(
            child: _buildButton(
              context,
              label: 'Edit Profile',
              onTap: () {
                Haptics.light();
                context.push('/settings/account');
              },
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildButton(
              context,
              label: 'Share Profile',
              onTap: () {
                Haptics.light();
                Clipboard.setData(
                  ClipboardData(text: '@${profile.username}'),
                );
                AppMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Profile link copied!')),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildButton(
    BuildContext context, {
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: AppSpacing.borderRadiusSm,
          border: Border.all(
            color: context.colors.borderLight,
            width: 0.5,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: context.colors.textPrimary,
          ),
        ),
      ),
    );
  }
}

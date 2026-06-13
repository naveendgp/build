import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/user_profile_models.dart';
import '../../command_center/screens/command_center_screen.dart';

class ProfileActionButtons extends StatelessWidget {
  final UserProfileData profile;

  const ProfileActionButtons({super.key, required this.profile});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _GlassButton(
            label: 'Edit Profile',
            onTap: () {
              Haptics.light();
              Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CommandCenterScreen()));
            },
          ),
        ],
      ),
    );
  }
}

class _GlassButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _GlassButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 32),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: AppSpacing.borderRadiusMd,
          border: Border.all(color: context.colors.borderLight, width: 0.5),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppTypography.button.copyWith(color: context.colors.textPrimary),
        ),
      ),
    );
  }
}


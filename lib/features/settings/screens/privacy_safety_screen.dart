import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';
import '../widgets/change_password_sheet.dart';
import '../widgets/delete_account_sheet.dart';

class PrivacySafetyScreen extends ConsumerWidget {
  const PrivacySafetyScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Privacy & Safety',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.only(top: 16, bottom: 48),
        children: [
          SettingsGroup(
            title: 'Security',
            children: [
              SettingsItem(
                title: 'Change Password',
                icon: Icons.lock_outline_rounded,
                onTap: () => ChangePasswordSheet.show(context),
              ),
              // Brands have their own blocked list — the people they blocked
              // from messaging them — and it used to be hidden from them.
              SettingsItem(
                title: 'Blocked Accounts',
                icon: Icons.block_flipped,
                onTap: () => context.push('/settings/blocked-brands'),
              ),
            ],
          ),
          SettingsGroup(
            title: 'Danger Zone',
            children: [
              SettingsItem(
                title: 'Delete Account',
                icon: Icons.delete_outline_rounded,
                iconColor: context.colors.error,
                textColor: context.colors.error,
                onTap: () => DeleteAccountSheet.show(context),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

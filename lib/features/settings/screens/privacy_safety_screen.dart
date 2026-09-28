import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';
import '../widgets/change_password_sheet.dart';
import '../widgets/delete_account_sheet.dart';

class PrivacySafetyScreen extends ConsumerWidget {
  const PrivacySafetyScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isBrand = authState.loggedInRole == UserRole.brand;
    final userSettingsState = ref.watch(userSettingsProvider);

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
          if (!isBrand) ...[
            userSettingsState.when(
              data: (settings) => SettingsGroup(
                title: 'Messaging',
                children: [
                  SettingsItem(
                    title: 'Everyone Can Message Me',
                    icon: Icons.chat_bubble_outline_rounded,
                    trailing: Switch.adaptive(
                      value: settings.everyoneCanMessageMe,
                      activeColor: context.colors.primaryAccent,
                      onChanged: (val) {
                        ref.read(userSettingsProvider.notifier).updateSettings(
                              settings.copyWith(everyoneCanMessageMe: val),
                            );
                      },
                    ),
                  ),
                ],
              ),
              loading: () => const Center(child: CircularProgressIndicator.adaptive()),
              error: (e, st) => const Center(child: Text('Error loading settings')),
            ),
          ],
          SettingsGroup(
            title: 'Security',
            children: [
              SettingsItem(
                title: 'Change Password',
                icon: Icons.lock_outline_rounded,
                onTap: () => ChangePasswordSheet.show(context),
              ),
              if (!isBrand)
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

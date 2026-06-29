import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/storage/secure_storage.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';

class SettingsHomeScreen extends ConsumerWidget {
  const SettingsHomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isBrand = authState.loggedInRole == UserRole.brand;

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
          'Settings',
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
            SettingsGroup(
              title: 'Account',
              children: [
                SettingsItem(
                  title: 'Account Information',
                  icon: Icons.person_outline_rounded,
                  onTap: () => context.push('/settings/account'),
                ),
                SettingsItem(
                  title: 'Privacy & Safety',
                  icon: Icons.shield_outlined,
                  onTap: () => context.push('/settings/privacy'),
                ),
                SettingsItem(
                  title: 'Preferences',
                  icon: Icons.tune_rounded,
                  onTap: () => context.push('/settings/preferences'),
                ),
              ],
            ),
          ] else ...[
            SettingsGroup(
              title: 'Business Account',
              children: [
                SettingsItem(
                  title: 'Brand Profile & Documents',
                  icon: Icons.storefront_outlined,
                  onTap: () => context.push('/settings/brand-profile'),
                ),
                SettingsItem(
                  title: 'Privacy & Safety',
                  icon: Icons.shield_outlined,
                  onTap: () => context.push('/settings/privacy'),
                ),
                SettingsItem(
                  title: 'Preferences',
                  icon: Icons.tune_rounded,
                  onTap: () => context.push('/settings/preferences'),
                ),
                SettingsItem(
                  title: 'Archived Posts',
                  icon: Icons.archive_outlined,
                  onTap: () => context.push('/settings/archived-posts'),
                ),
              ],
            ),
          ],
          SettingsGroup(
            title: 'Support & About',
            children: [
              SettingsItem(
                title: 'Help Center',
                icon: Icons.help_outline_rounded,
                onTap: () => context.push('/help'),
              ),

              SettingsItem(
                title: 'FAQ',
                icon: Icons.question_answer_outlined,
                onTap: () => context.push('/help/faq'),
              ),
              SettingsItem(
                title: 'Privacy Policy',
                icon: Icons.privacy_tip_outlined,
                onTap: () {},
              ),
            ],
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SettingsItem(
              title: 'Log Out',
              icon: Icons.logout_rounded,
              iconColor: context.colors.error,
              textColor: context.colors.error,
              onTap: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) {
                  context.go('/auth');
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';
import '../../../core/storage/secure_storage.dart';

class PrivacySafetyScreen extends ConsumerWidget {
  const PrivacySafetyScreen({Key? key}) : super(key: key);

  void _showChangePasswordSheet(BuildContext context, WidgetRef ref) {
    String currentPassword = '';
    String newPassword = '';
    String confirmPassword = '';
    bool isLoading = false;
    String? errorMsg;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Change Password',
                    style: AppTypography.titleLarge.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Current Password',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (val) => currentPassword = val,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'New Password',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (val) => newPassword = val,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Confirm New Password',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (val) => confirmPassword = val,
                  ),
                  if (errorMsg != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      errorMsg!,
                      style: AppTypography.bodySmall.copyWith(color: context.colors.error),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.colors.primaryAccent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: isLoading
                          ? null
                          : () async {
                              if (newPassword != confirmPassword) {
                                setState(() => errorMsg = 'New passwords do not match');
                                return;
                              }
                              if (currentPassword.isEmpty || newPassword.isEmpty) {
                                setState(() => errorMsg = 'Please fill all fields');
                                return;
                              }
                              
                              setState(() {
                                isLoading = true;
                                errorMsg = null;
                              });

                              final success = await ref
                                  .read(authProvider.notifier)
                                  .changePassword(currentPassword, newPassword);

                              if (context.mounted) {
                                if (success) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Password updated successfully')),
                                  );
                                } else {
                                  setState(() {
                                    isLoading = false;
                                    errorMsg = ref.read(authProvider).errorMessage ?? 'Failed to update password';
                                  });
                                }
                              }
                            },
                      child: isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : Text(
                              'Update Password',
                              style: AppTypography.bodyMedium.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showDeleteAccountDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.colors.background,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Delete Account',
          style: AppTypography.titleLarge.copyWith(color: context.colors.error, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
          style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: context.colors.error,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref.read(authProvider.notifier).deleteAccount();
              if (success && context.mounted) {
                SecureStorage.clearSession();
                context.go('/auth');
              } else if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(ref.read(authProvider).errorMessage ?? 'Failed to delete account')),
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

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
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => const Center(child: Text('Error loading settings')),
            ),
          ],
          SettingsGroup(
            title: 'Security',
            children: [
              SettingsItem(
                title: 'Change Password',
                icon: Icons.lock_outline_rounded,
                onTap: () => _showChangePasswordSheet(context, ref),
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
                onTap: () => _showDeleteAccountDialog(context, ref),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

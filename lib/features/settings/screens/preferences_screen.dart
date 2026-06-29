import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';
import '../../../core/utils/haptics.dart';
import '../../user_profile/providers/user_profile_provider.dart';

class PreferencesScreen extends ConsumerWidget {
  const PreferencesScreen({Key? key}) : super(key: key);

  void _showCategorySheet(BuildContext context, WidgetRef ref, dynamic settings) {
    // We'll reuse the categories list locally to avoid tight coupling to auth widgets
    const List<Map<String, dynamic>> categories = [
      {'label': 'Fashion & Apparel', 'icon': Icons.checkroom_rounded},
      {'label': 'Technology', 'icon': Icons.devices_rounded},
      {'label': 'Food & Beverage', 'icon': Icons.restaurant_rounded},
      {'label': 'Health & Wellness', 'icon': Icons.favorite_rounded},
      {'label': 'Education', 'icon': Icons.school_rounded},
      {'label': 'Entertainment', 'icon': Icons.movie_rounded},
      {'label': 'Real Estate', 'icon': Icons.apartment_rounded},
      {'label': 'Automotive', 'icon': Icons.directions_car_rounded},
      {'label': 'Finance', 'icon': Icons.account_balance_rounded},
      {'label': 'Retail', 'icon': Icons.storefront_rounded},
    ];

    List<String> selected = List<String>.from(settings.categoryInterests);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(ctx).size.height * 0.75,
            ),
            decoration: BoxDecoration(
              color: context.colors.card,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Container(
                    width: 40, 
                    height: 4,
                    decoration: BoxDecoration(
                      color: context.colors.border, 
                      borderRadius: BorderRadius.circular(100)
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('Category Interests', style: AppTypography.titleMedium),
                ),
                Flexible(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: categories.length,
                    shrinkWrap: true,
                    itemBuilder: (_, i) {
                      final cat = categories[i];
                      final label = cat['label'] as String;
                      final isSelected = selected.contains(label);
                      
                      return ListTile(
                        onTap: () { 
                          Haptics.selection(); 
                          setState(() {
                            if (isSelected) {
                              selected.remove(label);
                            } else {
                              selected.add(label);
                            }
                          });
                          ref.read(userSettingsProvider.notifier).updateSettings(
                            settings.copyWith(categoryInterests: selected)
                          );
                        },
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        leading: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: isSelected ? context.colors.primaryAccent.withOpacity(0.15) : context.colors.surface,
                            borderRadius: BorderRadius.circular(8)
                          ),
                          child: Icon(
                            cat['icon'] as IconData, 
                            size: 20, 
                            color: isSelected ? context.colors.primaryAccent : context.colors.textSecondary
                          )
                        ),
                        title: Text(
                          label, 
                          style: AppTypography.labelLarge.copyWith(
                            color: isSelected ? context.colors.primaryAccent : context.colors.textPrimary
                          )
                        ),
                        trailing: isSelected 
                          ? Icon(Icons.check_circle_rounded, color: context.colors.primaryAccent) 
                          : null,
                      );
                    },
                  ),
                ),
                SizedBox(height: MediaQuery.of(ctx).padding.bottom + 12),
              ],
            ),
          );
        }
      ),
    ).then((_) {
      // Refresh the profile so the updated categories show up
      ref.read(userProfileProvider.notifier).loadProfile();
    });
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isBrand = authState.loggedInRole == UserRole.brand;
    final userSettingsState = ref.watch(userSettingsProvider);
    final brandSettingsState = ref.watch(brandSettingsProvider);

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
          'Preferences',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.only(top: 16, bottom: 48),
        children: [
          if (!isBrand)
            userSettingsState.when(
              data: (settings) => Column(
                children: [
                  SettingsGroup(
                    title: 'Content',
                    children: [
                      SettingsItem(
                        title: 'Category Interests',
                        icon: Icons.category_outlined,
                        onTap: () => _showCategorySheet(context, ref, settings),
                      ),
                    ],
                  ),
                  SettingsGroup(
                    title: 'Notifications',
                    children: [
                      SettingsItem(
                        title: 'Reminders',
                        icon: Icons.notifications_active_outlined,
                        trailing: Switch.adaptive(
                          value: settings.appReminders,
                          activeColor: context.colors.primaryAccent,
                          onChanged: (val) {
                            ref.read(userSettingsProvider.notifier).updateSettings(
                                  settings.copyWith(appReminders: val),
                                );
                          },
                        ),
                      ),
                      SettingsItem(
                        title: 'Messages',
                        icon: Icons.message_outlined,
                        trailing: Switch.adaptive(
                          value: settings.pushNotifications,
                          activeColor: context.colors.primaryAccent,
                          onChanged: (val) {
                            ref.read(userSettingsProvider.notifier).updateSettings(
                                  settings.copyWith(pushNotifications: val),
                                );
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => const Center(child: Text('Error loading settings')),
            )
          else
            brandSettingsState.when(
              data: (settings) => SettingsGroup(
                title: 'Notifications',
                children: [
                  SettingsItem(
                    title: 'New Followers',
                    icon: Icons.person_add_outlined,
                    trailing: Switch.adaptive(
                      value: settings.newFollowerNotification,
                      activeColor: context.colors.primaryAccent,
                      onChanged: (val) => ref
                          .read(brandSettingsProvider.notifier)
                          .updateSettings(settings.copyWith(newFollowerNotification: val)),
                    ),
                  ),
                  SettingsItem(
                    title: 'New Messages',
                    icon: Icons.mail_outline_rounded,
                    trailing: Switch.adaptive(
                      value: settings.newMessageNotification,
                      activeColor: context.colors.primaryAccent,
                      onChanged: (val) => ref
                          .read(brandSettingsProvider.notifier)
                          .updateSettings(settings.copyWith(newMessageNotification: val)),
                    ),
                  ),
                  SettingsItem(
                    title: 'New Leads',
                    icon: Icons.leaderboard_outlined,
                    trailing: Switch.adaptive(
                      value: settings.newLeadNotification,
                      activeColor: context.colors.primaryAccent,
                      onChanged: (val) => ref
                          .read(brandSettingsProvider.notifier)
                          .updateSettings(settings.copyWith(newLeadNotification: val)),
                    ),
                  ),
                ],
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => const Center(child: Text('Error loading settings')),
            ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/interests.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/app_messenger.dart';
import '../../../core/utils/haptics.dart';
import '../providers/settings_provider.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';

/// Settings → Preferences, the same two lists the web shows: interests, up to
/// five and shown on the profile, and business categories, as many as you
/// like. Both are saved in one list and both tune the feed.
class PreferencesScreen extends ConsumerStatefulWidget {
  const PreferencesScreen({super.key});

  @override
  ConsumerState<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends ConsumerState<PreferencesScreen> {
  List<String>? _tags;
  bool _saving = false;

  List<String> get _selected => _tags ?? const [];
  int get _interestCount => _selected.where(personalTags.contains).length;

  Future<void> _toggle(String tag, dynamic settings) async {
    final isInterest = personalTags.contains(tag);
    final next = List<String>.from(_selected);

    if (next.contains(tag)) {
      next.remove(tag);
    } else {
      // Only interests are capped; categories are as many as you like.
      if (isInterest && _interestCount >= maxInterests) {
        AppMessenger.of(context).showSnackBar(
          SnackBar(content: Text('You can pick up to $maxInterests. Remove one to add another.')),
        );
        return;
      }
      next.add(tag);
    }

    Haptics.selection();
    setState(() {
      _tags = next;
      _saving = true;
    });

    await ref
        .read(userSettingsProvider.notifier)
        .updateSettings(settings.copyWith(categoryInterests: next));
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final settingsState = ref.watch(userSettingsProvider);

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
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: context.colors.surfaceSecondary,
                  borderRadius: AppSpacing.borderRadiusFull,
                ),
                child: Text(
                  _saving ? 'Saving…' : '$_interestCount/$maxInterests interests',
                  style: AppTypography.labelSmall.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: settingsState.when(
        loading: () => Center(
          child: CircularProgressIndicator.adaptive(
            valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
          ),
        ),
        error: (_, _) => Center(
          child: Text(
            'Could not load your preferences',
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
          ),
        ),
        data: (settings) {
          _tags ??= List<String>.from(settings.categoryInterests);
          return ListView(
            padding: const EdgeInsets.only(top: 16, bottom: 48),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  'Pick up to $maxInterests interests, and any business categories. '
                  'Both tune your feed; interests show on your profile.',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              _buildSection(
                context,
                title: 'Interests',
                subtitle: 'Topics you want to see more of.',
                tags: personalTags,
                settings: settings,
              ),
              _buildSection(
                context,
                title: 'Categories',
                subtitle: 'Business categories you want to follow.',
                tags: brandCategories,
                settings: settings,
              ),
              // The switches that were already here, kept as they were.
              SettingsGroup(
                title: 'Notifications',
                children: [
                  SettingsItem(
                    title: 'Reminders',
                    icon: Icons.alarm_rounded,
                    trailing: Switch.adaptive(
                      value: settings.appReminders,
                      activeThumbColor: context.colors.primaryAccent,
                      onChanged: (val) => ref
                          .read(userSettingsProvider.notifier)
                          .updateSettings(settings.copyWith(appReminders: val)),
                    ),
                  ),
                  SettingsItem(
                    title: 'Messages',
                    icon: Icons.chat_bubble_outline_rounded,
                    trailing: Switch.adaptive(
                      value: settings.pushNotifications,
                      activeThumbColor: context.colors.primaryAccent,
                      onChanged: (val) => ref
                          .read(userSettingsProvider.notifier)
                          .updateSettings(settings.copyWith(pushNotifications: val)),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required String subtitle,
    required List<String> tags,
    required dynamic settings,
  }) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusLg,
        border: Border.all(color: context.colors.borderLight, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.titleSmall.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: context.colors.borderLight),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: tags.map((tag) {
                final isSelected = _selected.contains(tag);
                return GestureDetector(
                  onTap: () => _toggle(tag, settings),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? context.colors.primaryAccent.withValues(alpha: 0.12)
                          : Colors.transparent,
                      borderRadius: AppSpacing.borderRadiusFull,
                      border: Border.all(
                        color: isSelected
                            ? context.colors.primaryAccent.withValues(alpha: 0.5)
                            : context.colors.border,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isSelected) ...[
                          Icon(Icons.check_rounded, size: 14, color: context.colors.primaryAccent),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          tag,
                          style: AppTypography.labelLarge.copyWith(
                            color: isSelected
                                ? context.colors.primaryAccent
                                : context.colors.textSecondary,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

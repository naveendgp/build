import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/interests.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/settings_group.dart';
import '../widgets/settings_item.dart';

/// Settings → Preferences, the same two lists the web shows: interests, up to
/// five and shown on the profile, and business categories, as many as you
/// like. Both are saved in one list and both tune the feed.
///
/// The lists start read-only and are changed through Edit, so a stray tap on
/// the way down the page cannot quietly rewrite them. A brand's choices are
/// saved on the brand settings; a person's on their own.
class PreferencesScreen extends ConsumerStatefulWidget {
  const PreferencesScreen({super.key});

  @override
  ConsumerState<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends ConsumerState<PreferencesScreen> {
  /// The list being edited. Null until Edit is pressed.
  List<String>? _draft;
  bool _saving = false;
  String? _error;

  bool get _editing => _draft != null;

  int _interestCount(List<String> tags) => tags.where(personalTags.contains).length;

  void _startEditing(List<String> saved) {
    setState(() {
      _draft = List<String>.from(saved);
      _error = null;
    });
  }

  void _cancel() => setState(() {
    _draft = null;
    _error = null;
  });

  void _toggle(String tag) {
    final next = List<String>.from(_draft!);
    if (next.contains(tag)) {
      next.remove(tag);
    } else {
      // Only interests are capped; categories are as many as you like.
      if (personalTags.contains(tag) && _interestCount(next) >= maxInterests) {
        setState(() => _error = 'You can pick up to $maxInterests interests. Remove one to add another.');
        return;
      }
      next.add(tag);
    }
    Haptics.selection();
    setState(() {
      _draft = next;
      _error = null;
    });
  }

  /// Saves through whichever settings the account actually owns — the brand
  /// endpoint rejects a person's token and the other way round, which is why
  /// a brand's picks used to say "Saving…" and then come straight back.
  Future<void> _save({required bool isBrand}) async {
    final next = List<String>.from(_draft!);
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      if (isBrand) {
        final settings = ref.read(brandSettingsProvider).value;
        if (settings == null) throw Exception('settings not loaded');
        await ref
            .read(brandSettingsProvider.notifier)
            .updateSettings(settings.copyWith(categoryInterests: next));
      } else {
        final settings = ref.read(userSettingsProvider).value;
        if (settings == null) throw Exception('settings not loaded');
        await ref
            .read(userSettingsProvider.notifier)
            .updateSettings(settings.copyWith(categoryInterests: next));
      }
      if (!mounted) return;
      setState(() {
        _saving = false;
        _draft = null;
      });
    } catch (_) {
      if (!mounted) return;
      // Shown on the page rather than as a snackbar: a swallowed red toast is
      // what made this look like it had saved.
      setState(() {
        _saving = false;
        _error = 'Could not save your preferences. Check your connection and try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBrand = ref.watch(authProvider).loggedInRole == UserRole.brand;
    final AsyncValue<dynamic> settingsState = isBrand
        ? ref.watch(brandSettingsProvider)
        : ref.watch(userSettingsProvider);

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
          if (settingsState.hasValue)
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.sm),
              child: _editing
                  ? Row(
                      children: [
                        TextButton(
                          onPressed: _saving ? null : _cancel,
                          child: Text(
                            'Cancel',
                            style: AppTypography.labelLarge.copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: _saving ? null : () => _save(isBrand: isBrand),
                          child: Text(
                            _saving ? 'Saving…' : 'Save',
                            style: AppTypography.labelLarge.copyWith(
                              color: context.colors.primaryAccent,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    )
                  : TextButton.icon(
                      onPressed: () => _startEditing(
                        List<String>.from(settingsState.value!.categoryInterests as List),
                      ),
                      icon: Icon(Icons.edit_outlined, size: 16, color: context.colors.primaryAccent),
                      label: Text(
                        'Edit',
                        style: AppTypography.labelLarge.copyWith(
                          color: context.colors.primaryAccent,
                          fontWeight: FontWeight.w700,
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
          final saved = List<String>.from(settings.categoryInterests as List);
          final shown = _draft ?? saved;
          return ListView(
            padding: const EdgeInsets.only(top: 16, bottom: 48),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  _editing
                      ? 'Tap to add or remove. ${_interestCount(shown)}/$maxInterests interests picked.'
                      : 'Pick up to $maxInterests interests, and any business categories. '
                            'Both tune your feed; interests show on your profile.',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: context.colors.error.withValues(alpha: 0.08),
                    borderRadius: AppSpacing.borderRadiusMd,
                    border: Border.all(color: context.colors.error.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline_rounded, size: 18, color: context.colors.error),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _error!,
                          style: AppTypography.bodySmall.copyWith(color: context.colors.error),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              _buildSection(
                context,
                title: 'Interests',
                subtitle: 'Topics you want to see more of.',
                tags: personalTags,
                selected: shown,
              ),
              _buildSection(
                context,
                title: 'Categories',
                subtitle: 'Business categories you want to follow.',
                tags: brandCategories,
                selected: shown,
              ),
              // The switches that were already here, kept as they were.
              SettingsGroup(
                title: 'Notifications',
                children: [
                  SettingsItem(
                    title: 'Reminders',
                    icon: Icons.alarm_rounded,
                    trailing: Switch.adaptive(
                      value: settings.appReminders as bool,
                      activeThumbColor: context.colors.primaryAccent,
                      onChanged: (val) => _setSwitch(isBrand: isBrand, reminders: val),
                    ),
                  ),
                  SettingsItem(
                    title: 'Messages',
                    icon: Icons.chat_bubble_outline_rounded,
                    trailing: Switch.adaptive(
                      value: settings.pushNotifications as bool,
                      activeThumbColor: context.colors.primaryAccent,
                      onChanged: (val) => _setSwitch(isBrand: isBrand, push: val),
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

  void _setSwitch({required bool isBrand, bool? reminders, bool? push}) {
    if (isBrand) {
      final settings = ref.read(brandSettingsProvider).value;
      if (settings == null) return;
      ref
          .read(brandSettingsProvider.notifier)
          .updateSettings(
            settings.copyWith(appReminders: reminders, pushNotifications: push),
          )
          .catchError((_) {});
    } else {
      final settings = ref.read(userSettingsProvider).value;
      if (settings == null) return;
      ref
          .read(userSettingsProvider.notifier)
          .updateSettings(
            settings.copyWith(appReminders: reminders, pushNotifications: push),
          )
          .catchError((_) {});
    }
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required String subtitle,
    required List<String> tags,
    required List<String> selected,
  }) {
    // Read-only, the page shows what was picked; editing shows everything to
    // choose from.
    final visible = _editing ? tags : tags.where(selected.contains).toList();

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
            child: visible.isEmpty
                ? Text(
                    'Nothing picked yet — tap Edit to choose.',
                    style: AppTypography.bodySmall.copyWith(color: context.colors.textTertiary),
                  )
                : Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: visible.map((tag) {
                      final isSelected = selected.contains(tag);
                      return GestureDetector(
                        onTap: _editing && !_saving ? () => _toggle(tag) : null,
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
                                Icon(
                                  _editing ? Icons.check_rounded : Icons.check_circle_rounded,
                                  size: 14,
                                  color: context.colors.primaryAccent,
                                ),
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

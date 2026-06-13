import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/glass_scaffold.dart';
import '../widgets/setting_toggle.dart';
import '../../../core/utils/haptics.dart';
import '../../home/widgets/hamburger_menu_sheet.dart' show userProfileProvider;
import '../providers/command_center_provider.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final Map<String, dynamic> _updates = {};

  void _onFieldChanged(String key, dynamic value) {
    setState(() {
      _updates[key] = value;
    });
  }

  Future<void> _saveChanges(bool isBrand) async {
    if (_updates.isEmpty) return;
    Haptics.selection();
    final success = await ref.read(commandCenterProvider.notifier).updateProfile(
      _updates,
      isBrand: isBrand,
    );
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Notification settings updated', style: TextStyle(color: Colors.white)),
          backgroundColor: const Color(0xFF22C55E),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      setState(() {
        _updates.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final isSaving = ref.watch(commandCenterProvider);

    return profileAsync.when(
      data: (profile) {
        final isBrand = profile['role'] == 'BRAND';
        final allowNotifications = _updates['allowNotifications'] ?? profile['allowNotifications'] ?? true;
        final allowEmailNotifications = _updates['allowEmailNotifications'] ?? profile['allowEmailNotifications'] ?? true;

        return GlassScaffold(
          title: 'Notifications',
          floatingActionButton: _updates.isNotEmpty
              ? FloatingActionButton.extended(
                  onPressed: isSaving ? null : () => _saveChanges(isBrand),
                  backgroundColor: const Color(0xFF7C5CFF),
                  icon: isSaving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.check, color: Colors.white),
                  label: Text(
                    isSaving ? 'Saving...' : 'Save Changes',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                )
              : null,
          body: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'App Alerts',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                SettingToggle(
                  title: 'Push Notifications',
                  subtitle: 'Receive alerts for new interactions',
                  icon: Icons.notifications_active_outlined,
                  value: allowNotifications,
                  onChanged: (v) => _onFieldChanged('allowNotifications', v),
                ),
                const SizedBox(height: 32),

                const Text(
                  'Email Alerts',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                SettingToggle(
                  title: 'Email Notifications',
                  subtitle: 'Receive important updates via email',
                  icon: Icons.email_outlined,
                  value: allowEmailNotifications,
                  onChanged: (v) => _onFieldChanged('allowEmailNotifications', v),
                ),
                
                if (!isBrand) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7C5CFF).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF7C5CFF).withValues(alpha: 0.2)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: Color(0xFF7C5CFF), size: 20),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Notification preferences are managed locally for user accounts.',
                            style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                
                const SizedBox(height: 100),
              ],
            ),
          ),
        );
      },
      loading: () => const GlassScaffold(
        title: 'Notifications',
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      ),
      error: (err, stack) => const GlassScaffold(
        title: 'Notifications',
        body: Center(child: Text('Failed to load settings', style: TextStyle(color: Colors.white))),
      ),
    );
  }
}

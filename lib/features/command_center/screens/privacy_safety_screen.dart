import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/glass_scaffold.dart';
import '../widgets/setting_toggle.dart';
import '../../../core/utils/haptics.dart';
import '../../home/widgets/hamburger_menu_sheet.dart' show userProfileProvider;
import '../providers/command_center_provider.dart';

class PrivacySafetyScreen extends ConsumerStatefulWidget {
  const PrivacySafetyScreen({super.key});

  @override
  ConsumerState<PrivacySafetyScreen> createState() => _PrivacySafetyScreenState();
}

class _PrivacySafetyScreenState extends ConsumerState<PrivacySafetyScreen> {
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
          content: const Text('Privacy settings updated', style: TextStyle(color: Colors.white)),
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
        final isBrandPublic = _updates['isBrandPublic'] ?? profile['isBrandPublic'] ?? true;
        final showContactInfo = _updates['showContactInfo'] ?? profile['showContactInfo'] ?? false;
        final allowDMs = _updates['allowDMs'] ?? profile['allowDMs'] ?? true;

        return GlassScaffold(
          title: 'Privacy & Safety',
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
                if (isBrand) ...[
                  const Text(
                    'Public Visibility',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  SettingToggle(
                    title: 'Public Brand Profile',
                    subtitle: 'Allow anyone to find your brand on Lyket',
                    icon: Icons.public,
                    value: isBrandPublic,
                    onChanged: (v) => _onFieldChanged('isBrandPublic', v),
                  ),
                  const SizedBox(height: 16),
                  SettingToggle(
                    title: 'Show Contact Info',
                    subtitle: 'Display your email and phone number publicly',
                    icon: Icons.contact_mail_outlined,
                    value: showContactInfo,
                    onChanged: (v) => _onFieldChanged('showContactInfo', v),
                  ),
                  const SizedBox(height: 32),
                ],

                const Text(
                  'Messaging Controls',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                SettingToggle(
                  title: 'Allow Direct Messages',
                  subtitle: 'Let users send you direct messages',
                  icon: Icons.chat_bubble_outline_rounded,
                  value: allowDMs,
                  onChanged: (v) => _onFieldChanged('allowDMs', v),
                ),
                const SizedBox(height: 100),
              ],
            ),
          ),
        );
      },
      loading: () => const GlassScaffold(
        title: 'Privacy & Safety',
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      ),
      error: (err, stack) => const GlassScaffold(
        title: 'Privacy & Safety',
        body: Center(child: Text('Failed to load settings', style: TextStyle(color: Colors.white))),
      ),
    );
  }
}

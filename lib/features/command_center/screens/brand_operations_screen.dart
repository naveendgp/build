import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/glass_scaffold.dart';
import '../widgets/setting_input.dart';
import '../../../core/utils/haptics.dart';
import '../../home/widgets/hamburger_menu_sheet.dart' show userProfileProvider;
import '../providers/command_center_provider.dart';

class BrandOperationsScreen extends ConsumerStatefulWidget {
  const BrandOperationsScreen({super.key});

  @override
  ConsumerState<BrandOperationsScreen> createState() => _BrandOperationsScreenState();
}

class _BrandOperationsScreenState extends ConsumerState<BrandOperationsScreen> {
  final Map<String, dynamic> _updates = {};

  void _onFieldChanged(String key, dynamic value) {
    setState(() {
      _updates[key] = value;
    });
  }

  Future<void> _saveChanges() async {
    if (_updates.isEmpty) return;
    Haptics.selection();
    final success = await ref.read(commandCenterProvider.notifier).updateProfile(
      _updates,
      isBrand: true,
    );
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Operations updated successfully', style: TextStyle(color: Colors.white)),
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
        return GlassScaffold(
          title: 'Brand Operations',
          floatingActionButton: _updates.isNotEmpty
              ? FloatingActionButton.extended(
                  onPressed: isSaving ? null : _saveChanges,
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
                // ── Business Identity ──
                const Text(
                  'Business Identity',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'Business Type',
                  hintText: 'e.g., B2B, B2C, Agency',
                  initialValue: profile['businessType'],
                  onChanged: (v) => _onFieldChanged('businessType', v),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'Industry',
                  hintText: 'e.g., Real Estate, Fashion',
                  initialValue: profile['industry'],
                  onChanged: (v) => _onFieldChanged('industry', v),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'Sub-Category',
                  hintText: 'e.g., Luxury, Streetwear',
                  initialValue: profile['subCategory'],
                  onChanged: (v) => _onFieldChanged('subCategory', v),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'Currency',
                  hintText: 'e.g., INR, USD, EUR',
                  initialValue: profile['currency'] ?? 'INR',
                  onChanged: (v) => _onFieldChanged('currency', v),
                ),
                const SizedBox(height: 32),

                // ── Legal & Tax ──
                const Text(
                  'Legal & Tax',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                SettingInput(
                  label: 'GST Number',
                  hintText: 'Enter GST/Tax ID',
                  initialValue: profile['gstNumber'],
                  onChanged: (v) => _onFieldChanged('gstNumber', v),
                ),
                const SizedBox(height: 32),

                const SizedBox(height: 100),
              ],
            ),
          ),
        );
      },
      loading: () => const GlassScaffold(
        title: 'Brand Operations',
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      ),
      error: (err, stack) => const GlassScaffold(
        title: 'Brand Operations',
        body: Center(child: Text('Failed to load settings', style: TextStyle(color: Colors.white))),
      ),
    );
  }
}

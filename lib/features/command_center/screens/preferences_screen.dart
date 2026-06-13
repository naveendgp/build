import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/glass_scaffold.dart';
import '../widgets/setting_toggle.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/utils/haptics.dart';

class PreferencesScreen extends ConsumerStatefulWidget {
  const PreferencesScreen({super.key});

  @override
  ConsumerState<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends ConsumerState<PreferencesScreen> {
  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark;

    return GlassScaffold(
      title: 'Preferences',
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Appearance',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SettingToggle(
              title: 'Dark Theme',
              subtitle: 'Use dark mode across the app',
              icon: Icons.dark_mode_outlined,
              value: isDark,
              onChanged: (val) {
                Haptics.selection();
                ref.read(themeProvider.notifier).setTheme(
                  val ? ThemeMode.dark : ThemeMode.light,
                );
              },
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }
}

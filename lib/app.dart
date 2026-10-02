import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/services/code_push_service.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';

class LyketApp extends ConsumerWidget {
  const LyketApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'Lyket',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: AppRouter.router,
      builder: (context, child) => _CodePushPrompt(child: child ?? const SizedBox.shrink()),
    );
  }
}

/// Asks for a restart once an over-the-air patch has been downloaded.
///
/// Shorebird applies a patch on the next launch, so without this the fix sits
/// on the phone unused until the person happens to close the app.
class _CodePushPrompt extends StatefulWidget {
  final Widget child;

  const _CodePushPrompt({required this.child});

  @override
  State<_CodePushPrompt> createState() => _CodePushPromptState();
}

class _CodePushPromptState extends State<_CodePushPrompt> {
  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    if (!CodePushService.isAvailable) return;
    // Let the first screen settle before spending bandwidth on a patch.
    await Future<void>.delayed(const Duration(seconds: 4));
    final ready = await CodePushService.check();
    if (!ready || !mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Update downloaded. Close and reopen Lyket to apply it.'),
        duration: const Duration(seconds: 8),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Got it',
          onPressed: () => ScaffoldMessenger.of(context).hideCurrentSnackBar(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../auth/providers/auth_provider.dart';
import 'widgets/animated_logo.dart';
import 'widgets/particle_field.dart';
import 'widgets/tagline_animator.dart';

/// Screen 1 — Premium cinematic splash screen
/// Communicates: "premium AI-powered discovery platform"
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initApp();
  }

  Future<void> _initApp() async {
    // Start restoring the session immediately
    await ref.read(authProvider.notifier).restoreSession();

    // Wait for the remaining splash duration
    await Future.delayed(const Duration(milliseconds: 3500));

    if (mounted) {
      final auth = ref.read(authProvider);
      if (auth.status == AuthStatus.success) {
        context.go('/home');
      } else {
        context.go('/login');
      }
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Set immersive system UI
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: context.colors.background,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // Particle field background
          Positioned.fill(child: ParticleField(particleCount: 35)),

          // Centered content
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Animated logo with glow
                AnimatedLogo(),

                SizedBox(height: 32),

                // Animated tagline
                TaglineAnimator(),

                SizedBox(height: 64),

                // Minimal loading indicator
                _buildLoadingIndicator(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 2500),
      curve: Curves.easeInOut,
      builder: (context, value, _) {
        return Opacity(
          opacity: value.clamp(0.0, 0.5),
          child: SizedBox(
            width: 32,
            height: 32,
            child: CircularProgressIndicator.adaptive(
              strokeWidth: 1.5,
              valueColor: AlwaysStoppedAnimation<Color>(
                context.colors.primaryAccent.withValues(alpha: 0.4),
              ),
            ),
          ),
        );
      },
    );
  }
}

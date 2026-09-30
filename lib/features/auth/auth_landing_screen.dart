import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/animated_gradient_bg.dart';
import '../../core/widgets/lyket_button.dart';
import 'providers/auth_provider.dart';
import 'widgets/role_card.dart';

class AuthLandingScreen extends ConsumerWidget {
  const AuthLandingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: context.colors.background,
      body: AnimatedGradientBg(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: IntrinsicHeight(
                      child: Column(
                        children: [
                          const SizedBox(height: AppSpacing.xxxl),
                          // Heading
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0, end: 1),
                            duration: const Duration(milliseconds: 800),
                            curve: Curves.easeOut,
                            builder: (_, v, child) => Opacity(
                              opacity: v,
                              child: Transform.translate(
                                offset: Offset(0, 20 * (1 - v)),
                                child: child,
                              ),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  'Discover.',
                                  style: AppTypography.displayLarge.copyWith(
                                    color: context.colors.textPrimary,
                                    height: 1.1,
                                  ),
                                ),
                                Text(
                                  'Connect.',
                                  style: AppTypography.displayLarge.copyWith(
                                    color: context.colors.primaryAccent,
                                    height: 1.1,
                                  ),
                                ),
                                Text(
                                  'Grow.',
                                  style: AppTypography.displayLarge.copyWith(
                                    color: context.colors.textPrimary,
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0, end: 1),
                            duration: const Duration(milliseconds: 800),
                            curve: Curves.easeOut,
                            builder: (_, v, child) => Opacity(opacity: v, child: child),
                            child: Text(
                              'Choose how you want to experience Lyket',
                              style: AppTypography.bodyMedium,
                              textAlign: TextAlign.center,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xxl),
                          // Role cards
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0, end: 1),
                            duration: const Duration(milliseconds: 900),
                            curve: Curves.easeOut,
                            builder: (_, v, child) => Opacity(
                              opacity: v,
                              child: Transform.translate(
                                offset: Offset(0, 30 * (1 - v)),
                                child: child,
                              ),
                            ),
                            child: Column(
                              children: [
                                RoleCard(
                                  icon: Icons.person_rounded,
                                  title: 'Personal User',
                                  description: 'Discover brands, explore content, and connect',
                                  isSelected: auth.selectedRole == UserRole.user,
                                  onTap: () =>
                                      ref.read(authProvider.notifier).selectRole(UserRole.user),
                                ),
                                const SizedBox(height: AppSpacing.md),
                                RoleCard(
                                  icon: Icons.business_rounded,
                                  title: 'Brand / Business',
                                  description: 'Grow your brand, reach new audiences, and analyze',
                                  isSelected: auth.selectedRole == UserRole.brand,
                                  onTap: () =>
                                      ref.read(authProvider.notifier).selectRole(UserRole.brand),
                                ),
                              ],
                            ),
                          ),
                          const Spacer(),
                          // CTA
                          AnimatedOpacity(
                            duration: const Duration(milliseconds: 300),
                            opacity: auth.selectedRole != null ? 1.0 : 0.4,
                            child: LyketButton(
                              label: 'Continue',
                              onPressed: auth.selectedRole != null
                                  ? () {
                                      final path = auth.selectedRole == UserRole.user
                                          ? '/signup/user'
                                          : '/signup/brand';
                                      context.push(path);
                                    }
                                  : null,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          // Login link
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Already have an account? ', style: AppTypography.bodyMedium),
                              GestureDetector(
                                onTap: () => context.push('/login'),
                                child: Text(
                                  'Log In',
                                  style: AppTypography.labelLarge.copyWith(
                                    color: context.colors.primaryAccent,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: bottomPad + AppSpacing.lg),
                        ], // Column children
                      ), // Column
                    ), // IntrinsicHeight
                  ), // ConstrainedBox
                ); // SingleChildScrollView
              }, // LayoutBuilder builder
            ), // LayoutBuilder
          ), // Padding
        ), // SafeArea
      ), // AnimatedGradientBg
    ); // Scaffold
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/lyket_button.dart';
import '../../core/widgets/lyket_text_field.dart';
import '../../core/utils/validators.dart';
import 'providers/auth_provider.dart';
import 'widgets/social_auth_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final success = await ref.read(authProvider.notifier).login(
      _emailCtrl.text.trim(),
      _passwordCtrl.text,
    );
    if (success && mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 22),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.lg),
              // Header
              Text('Welcome Back', style: AppTypography.displaySmall.copyWith(color: context.colors.textPrimary)),
              const SizedBox(height: AppSpacing.sm),
              Text('Sign in to continue your journey',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
              const SizedBox(height: AppSpacing.xxl),

              // Email
              LyketTextField(
                label: 'Email',
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                validator: Validators.email,
              ),
              const SizedBox(height: AppSpacing.md),

              // Password
              LyketPasswordField(
                controller: _passwordCtrl,
                validator: Validators.password,
                textInputAction: TextInputAction.done,
              ),
              const SizedBox(height: AppSpacing.md),

              // Remember + Forgot
              Row(
                children: [
                  GestureDetector(
                    onTap: () => ref.read(authProvider.notifier).toggleRememberMe(),
                    child: Row(
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 20, height: 20,
                          decoration: BoxDecoration(
                            color: auth.rememberMe
                                ? context.colors.primaryAccent
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: auth.rememberMe
                                  ? context.colors.primaryAccent
                                  : context.colors.textTertiary,
                              width: 1.5,
                            ),
                          ),
                          child: auth.rememberMe
                              ? const Icon(Icons.check_rounded,
                                  size: 14, color: Colors.white)
                              : null,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Text('Remember me', style: AppTypography.bodySmall.copyWith(color: context.colors.textPrimary)),
                      ],
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => context.push('/forgot-password'),
                    child: Text('Forgot Password?',
                      style: AppTypography.labelMedium.copyWith(color: context.colors.primaryAccent)),
                  ),
                ],
              ),

              // Error
              if (auth.errorMessage != null) ...[
                const SizedBox(height: AppSpacing.md),
                AnimatedOpacity(
                  duration: const Duration(milliseconds: 300),
                  opacity: 1,
                  child: Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: context.colors.error.withValues(alpha: 0.08),
                      borderRadius: AppSpacing.borderRadiusMd,
                      border: Border.all(color: context.colors.error.withValues(alpha: 0.2)),
                    ),
                    child: Row(children: [
                      Icon(Icons.error_outline_rounded, size: 18, color: context.colors.error),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          auth.errorMessage!,
                          style: AppTypography.bodySmall.copyWith(color: context.colors.error),
                        ),
                      ),
                    ]),
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.xl),
              // Login button
              LyketButton(
                label: 'Sign In',
                isLoading: auth.status == AuthStatus.loading,
                onPressed: auth.status == AuthStatus.loading ? null : _handleLogin,
              ),

              const SizedBox(height: AppSpacing.xl),
              // Divider
              Row(children: [
                Expanded(child: Container(height: 1, color: context.colors.border)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: Text('or', style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary)),
                ),
                Expanded(child: Container(height: 1, color: context.colors.border)),
              ]),
              const SizedBox(height: AppSpacing.xl),

              // Social
              SocialAuthButton.google(
                onPressed: () async {
                  final success = await ref.read(authProvider.notifier).continueWithGoogle();
                  if (success && mounted) {
                    context.go('/home');
                  }
                },
              ),

              const SizedBox(height: AppSpacing.xl),
              // Sign up link
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text("Don't have an account? ", style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
                    GestureDetector(
                      onTap: () => context.go('/auth'),
                      child: Text('Sign Up',
                        style: AppTypography.labelLarge.copyWith(color: context.colors.primaryAccent)),
                    ),
                  ],
                ),
              ),
              SizedBox(height: bottomPad + AppSpacing.lg),
            ],
          ),
        ),
      ),
    );
  }
}

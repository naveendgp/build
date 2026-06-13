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

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _pageController = PageController();
  
  final _emailFormKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();

  final _codeFormKey = GlobalKey<FormState>();
  final _codeCtrl = TextEditingController();

  final _passwordFormKey = GlobalKey<FormState>();
  final _passwordCtrl = TextEditingController();

  int _currentStep = 0;

  @override
  void dispose() {
    _pageController.dispose();
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleSendCode() async {
    if (!(_emailFormKey.currentState?.validate() ?? false)) return;
    final success = await ref.read(authProvider.notifier).forgotPassword(_emailCtrl.text.trim());
    if (success && mounted) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      setState(() => _currentStep = 1);
    }
  }

  Future<void> _handleVerifyCode() async {
    if (!(_codeFormKey.currentState?.validate() ?? false)) return;
    final success = await ref.read(authProvider.notifier).verifyResetCode(
      _emailCtrl.text.trim(),
      _codeCtrl.text.trim(),
    );
    if (success && mounted) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      setState(() => _currentStep = 2);
    }
  }

  Future<void> _handleResetPassword() async {
    if (!(_passwordFormKey.currentState?.validate() ?? false)) return;
    final success = await ref.read(authProvider.notifier).resetPassword(
      _emailCtrl.text.trim(),
      _codeCtrl.text.trim(),
      _passwordCtrl.text,
    );
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset successful! Please login.'),
          backgroundColor: Color(0xFF22C55E),
        ),
      );
      context.pop(); // Go back to login
    }
  }

  Widget _buildErrorBanner() {
    final auth = ref.watch(authProvider);
    if (auth.errorMessage == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.md),
      child: AnimatedOpacity(
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
              child: Text(auth.errorMessage!,
                style: AppTypography.bodySmall.copyWith(color: context.colors.error)),
            ),
          ]),
        ),
      ),
    );
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
          onPressed: () {
            if (_currentStep > 0) {
              _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
              setState(() => _currentStep--);
              ref.read(authProvider.notifier).resetError();
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          // Step 1: Email
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Form(
              key: _emailFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.lg),
                  Text('Reset Password', style: AppTypography.displaySmall.copyWith(color: context.colors.textPrimary)),
                  const SizedBox(height: AppSpacing.sm),
                  Text('Enter your email address to receive a 6-digit reset code.',
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
                  const SizedBox(height: AppSpacing.xxl),
                  LyketTextField(
                    label: 'Email',
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    validator: Validators.email,
                  ),
                  _buildErrorBanner(),
                  const SizedBox(height: AppSpacing.xl),
                  LyketButton(
                    label: 'Send Code',
                    isLoading: auth.status == AuthStatus.loading,
                    onPressed: auth.status == AuthStatus.loading ? null : _handleSendCode,
                  ),
                ],
              ),
            ),
          ),

          // Step 2: Code
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Form(
              key: _codeFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.lg),
                  Text('Check your email', style: AppTypography.displaySmall.copyWith(color: context.colors.textPrimary)),
                  const SizedBox(height: AppSpacing.sm),
                  Text('We sent a 6-digit code to ${_emailCtrl.text}',
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
                  const SizedBox(height: AppSpacing.xxl),
                  LyketTextField(
                    label: '6-Digit Code',
                    controller: _codeCtrl,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    validator: (val) {
                      if (val == null || val.trim().length != 6) return 'Enter the 6-digit code';
                      return null;
                    },
                  ),
                  _buildErrorBanner(),
                  const SizedBox(height: AppSpacing.xl),
                  LyketButton(
                    label: 'Verify Code',
                    isLoading: auth.status == AuthStatus.loading,
                    onPressed: auth.status == AuthStatus.loading ? null : _handleVerifyCode,
                  ),
                ],
              ),
            ),
          ),

          // Step 3: New Password
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Form(
              key: _passwordFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.lg),
                  Text('New Password', style: AppTypography.displaySmall.copyWith(color: context.colors.textPrimary)),
                  const SizedBox(height: AppSpacing.sm),
                  Text('Create a new secure password for your account.',
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
                  const SizedBox(height: AppSpacing.xxl),
                  LyketPasswordField(
                    controller: _passwordCtrl,
                    validator: Validators.password,
                    textInputAction: TextInputAction.done,
                  ),
                  _buildErrorBanner(),
                  const SizedBox(height: AppSpacing.xl),
                  LyketButton(
                    label: 'Update Password',
                    isLoading: auth.status == AuthStatus.loading,
                    onPressed: auth.status == AuthStatus.loading ? null : _handleResetPassword,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

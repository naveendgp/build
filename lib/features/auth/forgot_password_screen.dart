import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/lyket_button.dart';
import '../../core/widgets/lyket_text_field.dart';
import '../../core/utils/validators.dart';
import 'providers/auth_provider.dart';
import '../../core/utils/app_messenger.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailFormKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();
  
  final _pageController = PageController();
  int _currentPage = 0;
  
  final _emailController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());

  Timer? _resendTimer;
  int _cooldownSeconds = 0;
  int _resendCount = 0;

  @override
  void dispose() {
    _pageController.dispose();
    _emailController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _resendTimer?.cancel();
    for (var node in _otpFocusNodes) {
      node.dispose();
    }
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _startResendTimer() {
    setState(() {
      _cooldownSeconds = 60;
    });
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds > 0) {
        setState(() {
          _cooldownSeconds--;
        });
      } else {
        timer.cancel();
      }
    });
  }

  void _resendCode() async {
    if (_resendCount >= 3) return;
    
    // Clear previous errors before calling API
    ref.read(authProvider.notifier).resetError();
    
    await ref.read(authProvider.notifier).forgotPassword(_emailController.text.trim());
    final authState = ref.read(authProvider);
    
    if (authState.status != AuthStatus.error) {
      setState(() {
        _resendCount++;
      });
      _startResendTimer();
    }
  }

  void _nextPage() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() {
        _currentPage++;
      });
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() {
        _currentPage--;
      });
      ref.read(authProvider.notifier).resetError();
    } else {
      context.pop();
    }
  }

  void _handleEmailSubmit() async {
    if (!_emailFormKey.currentState!.validate()) return;
    
    ref.read(authProvider.notifier).resetError();
    await ref.read(authProvider.notifier).forgotPassword(_emailController.text.trim());
    
    final authState = ref.read(authProvider);
    if (authState.status != AuthStatus.error) {
      _startResendTimer();
      _nextPage();
    }
  }

  String _getOtpString() {
    return _otpControllers.map((c) => c.text).join('');
  }

  void _onOtpChanged(String value, int index) {
    if (value.isNotEmpty) {
      if (index < 5) {
        _otpFocusNodes[index + 1].requestFocus();
      } else {
        _otpFocusNodes[index].unfocus();
        _verifyOtp();
      }
    }
  }

  void _onOtpKeyEvent(KeyEvent event, int index) {
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_otpControllers[index].text.isEmpty && index > 0) {
        _otpFocusNodes[index - 1].requestFocus();
      }
    }
  }

  void _verifyOtp() {
    final code = _getOtpString();
    if (code.length != 6) return;

    // NOTE: We deliberately do not call a separate "verify code" API here.
    // The backend's /auth/verify-otp endpoint confirms the user's Cognito
    // signup registration (ConfirmSignUp) rather than just checking an OTP —
    // for any account that has already completed signup (i.e. everyone
    // using forgot-password), Cognito rejects that with "User cannot be
    // confirmed. Current status is CONFIRMED", regardless of whether the
    // code is actually correct. The code is genuinely verified in one step
    // together with the new password via /auth/reset-password-with-otp
    // (Cognito's ConfirmForgotPassword) in _handleResetPassword below.
    ref.read(authProvider.notifier).resetError();
    _nextPage();
  }

  void _handleResetPassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;
    
    ref.read(authProvider.notifier).resetError();
    await ref.read(authProvider.notifier).resetPassword(
      _emailController.text.trim(),
      _getOtpString(),
      _newPasswordController.text,
    );
    
    final authState = ref.read(authProvider);
    if (authState.status != AuthStatus.error) {
      if (mounted) {
        // Capture the messenger before navigating — ScaffoldMessenger is
        // shared/global in this app's MaterialApp setup, but grabbing the
        // reference up front means the snackbar doesn't depend on `context`
        // still resolving to a live Scaffold after the route changes.
        final messenger = AppMessenger.of(context);
        // go() instead of pop(): pop() only lands on login if this screen
        // was reached by pushing directly on top of it, which isn't
        // guaranteed for every path into forgot-password. Navigate first,
        // immediately — no artificial delay, since that just adds a window
        // where a stale `mounted` check could silently skip navigating.
        context.go('/login');
        messenger.showSnackBar(
          const SnackBar(content: Text('Password reset successfully. Please log in.')),
        );
      }
    }
  }

  Widget _buildErrorBanner(String? error) {
    if (error == null || error.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),
      margin: EdgeInsets.only(bottom: AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.error),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: context.colors.error),
          SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              error,
              style: AppTypography.bodyMedium.copyWith(color: context.colors.error),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmailStep() {
    return SingleChildScrollView(
      child: Form(
        key: _emailFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Forgot Password',
              style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary),
            ),
            SizedBox(height: AppSpacing.sm),
            Text(
              'Enter your email address to receive a password reset code.',
              style: AppTypography.bodyLarge.copyWith(
                color: context.colors.textSecondary,
              ),
            ),
            SizedBox(height: AppSpacing.xl),
            LyketTextField(
              controller: _emailController,
              label: 'Email',
              keyboardType: TextInputType.emailAddress,
              validator: Validators.email,
            ),
            SizedBox(height: AppSpacing.xxl),
            Consumer(
              builder: (context, ref, _) {
                final authState = ref.watch(authProvider);
                return LyketButton(
                  label: 'Send Code',
                  isLoading: authState.status == AuthStatus.loading,
                  onPressed: _handleEmailSubmit,
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOtpStep() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Enter Reset Code',
            style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary),
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            'We sent a 6-digit code to ${_emailController.text}',
            style: AppTypography.bodyLarge.copyWith(
              color: context.colors.textSecondary,
            ),
          ),
          SizedBox(height: AppSpacing.xl),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(6, (index) {
              return Padding(
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.xs / 2),
                child: KeyboardListener(
                  focusNode: FocusNode(), // Wrap logic, maybe better in raw keyboard
                  onKeyEvent: (event) => _onOtpKeyEvent(event, index),
                  child: Container(
                    width: 48,
                    decoration: BoxDecoration(
                      color: context.colors.surface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _otpControllers[index],
                      focusNode: _otpFocusNodes[index],
                      textAlign: TextAlign.center,
                      textAlignVertical: TextAlignVertical.center,
                      keyboardType: TextInputType.number,
                      maxLength: 1,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      style: AppTypography.titleLarge.copyWith(color: context.colors.textPrimary),
                      decoration: InputDecoration(
                        counterText: '',
                        contentPadding: EdgeInsets.symmetric(vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: context.colors.borderLight),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: context.colors.borderLight),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: context.colors.primaryAccent),
                        ),
                      ),
                      onChanged: (value) => _onOtpChanged(value, index),
                    ),
                  ),
                ),
              );
            }),
          ),
          SizedBox(height: AppSpacing.xl),
          Consumer(
            builder: (context, ref, _) {
              final authState = ref.watch(authProvider);
              return Column(
                children: [
                  LyketButton(
                    label: 'Verify',
                    isLoading: authState.status == AuthStatus.loading,
                    onPressed: _verifyOtp,
                  ),
                  SizedBox(height: AppSpacing.lg),
                  if (_resendCount >= 3)
                    Text(
                      'Maximum attempts reached',
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.error),
                    )
                  else if (_cooldownSeconds > 0)
                    Text(
                      'Resend code in 0:${_cooldownSeconds.toString().padLeft(2, '0')}',
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                    )
                  else
                    TextButton(
                      onPressed: _resendCode,
                      child: Text(
                        'Resend Code',
                        style: AppTypography.bodyLarge.copyWith(color: context.colors.primaryAccent),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNewPasswordStep() {
    return SingleChildScrollView(
      child: Form(
        key: _passwordFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'New Password',
              style: AppTypography.headlineMedium.copyWith(color: context.colors.textPrimary),
            ),
            SizedBox(height: AppSpacing.sm),
            Text(
              'Create a new password for your account.',
              style: AppTypography.bodyLarge.copyWith(
                color: context.colors.textSecondary,
              ),
            ),
            SizedBox(height: AppSpacing.xl),
            LyketPasswordField(
              controller: _newPasswordController,
              label: 'New Password',
              validator: Validators.password,
            ),
            SizedBox(height: AppSpacing.md),
            LyketPasswordField(
              controller: _confirmPasswordController,
              label: 'Confirm Password',
              validator: (val) {
                if (val == null || val.isEmpty) {
                  return 'Please confirm your password';
                }
                if (val != _newPasswordController.text) {
                  return 'Passwords do not match';
                }
                return null;
              },
            ),
            SizedBox(height: AppSpacing.xxl),
            Consumer(
              builder: (context, ref, _) {
                final authState = ref.watch(authProvider);
                return LyketButton(
                  label: 'Reset Password',
                  isLoading: authState.status == AuthStatus.loading,
                  onPressed: _handleResetPassword,
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: _previousPage,
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(
            children: [
              _buildErrorBanner(authState.errorMessage),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _buildEmailStep(),
                    _buildOtpStep(),
                    _buildNewPasswordStep(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

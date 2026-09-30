import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/utils/app_messenger.dart';

/// Two-step "Change Password" flow: send a 6-digit code to the user's own
/// registered email (derived server-side from the auth token, never from
/// client input), then verify that code together with the new password in
/// one call. Replaces the old current-password-only flow.
class ChangePasswordSheet extends ConsumerStatefulWidget {
  const ChangePasswordSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const ChangePasswordSheet(),
    );
  }

  @override
  ConsumerState<ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends ConsumerState<ChangePasswordSheet> {
  int _step = 0; // 0 = intro/send code, 1 = enter code + new password
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  String? _errorMsg;
  String? _maskedEmail;

  Timer? _resendTimer;
  int _cooldownSeconds = 0;

  @override
  void dispose() {
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  void _startCooldown() {
    setState(() => _cooldownSeconds = 60);
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_cooldownSeconds > 0) {
        setState(() => _cooldownSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _sendCode() async {
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });
    final masked = await ref.read(authProvider.notifier).sendChangePasswordOtp();
    if (!mounted) return;
    if (masked != null) {
      setState(() {
        _isLoading = false;
        _maskedEmail = masked;
        _step = 1;
      });
      _startCooldown();
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = ref.read(authProvider).errorMessage ?? 'Failed to send verification code';
      });
    }
  }

  Future<void> _submit() async {
    final code = _otpController.text.trim();
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (code.length != 6) {
      setState(() => _errorMsg = 'Enter the 6-digit code sent to your email');
      return;
    }
    if (newPassword.length < 8) {
      setState(() => _errorMsg = 'Password must be at least 8 characters');
      return;
    }
    if (newPassword != confirmPassword) {
      setState(() => _errorMsg = 'New passwords do not match');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    final success = await ref.read(authProvider.notifier).changePasswordWithOtp(code, newPassword);
    if (!mounted) return;

    if (success) {
      Navigator.pop(context);
      AppMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Password updated successfully')));
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = ref.read(authProvider).errorMessage ?? 'Failed to update password';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: _step == 0 ? _buildIntroStep(context) : _buildVerifyStep(context),
      ),
    );
  }

  List<Widget> _buildIntroStep(BuildContext context) {
    return [
      Icon(Icons.mark_email_read_outlined, size: 40, color: context.colors.primaryAccent),
      const SizedBox(height: 16),
      Text(
        'Change Password',
        style: AppTypography.titleLarge.copyWith(
          color: context.colors.textPrimary,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 8),
      Text(
        'For your security, we’ll send a 6-digit verification code to your registered email before you can set a new password.',
        style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
        textAlign: TextAlign.center,
      ),
      if (_errorMsg != null) ...[
        const SizedBox(height: 16),
        Text(
          _errorMsg!,
          style: AppTypography.bodySmall.copyWith(color: context.colors.error),
          textAlign: TextAlign.center,
        ),
      ],
      const SizedBox(height: 24),
      SizedBox(
        height: 48,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: context.colors.primaryAccent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          onPressed: _isLoading ? null : _sendCode,
          child: _isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator.adaptive(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  'Send Verification Code',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    ];
  }

  List<Widget> _buildVerifyStep(BuildContext context) {
    return [
      Text(
        'Enter Code & New Password',
        style: AppTypography.titleLarge.copyWith(
          color: context.colors.textPrimary,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 8),
      Text(
        _maskedEmail != null ? 'We sent a code to $_maskedEmail' : 'We sent a code to your email',
        style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 24),
      TextField(
        controller: _otpController,
        keyboardType: TextInputType.number,
        maxLength: 6,
        textAlign: TextAlign.center,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: AppTypography.titleMedium.copyWith(
          color: context.colors.textPrimary,
          letterSpacing: 6,
        ),
        decoration: InputDecoration(
          counterText: '',
          labelText: 'Verification Code',
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      const SizedBox(height: 16),
      TextField(
        controller: _newPasswordController,
        obscureText: true,
        decoration: InputDecoration(
          labelText: 'New Password',
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      const SizedBox(height: 16),
      TextField(
        controller: _confirmPasswordController,
        obscureText: true,
        decoration: InputDecoration(
          labelText: 'Confirm New Password',
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      const SizedBox(height: 8),
      Align(
        alignment: Alignment.centerRight,
        child: _cooldownSeconds > 0
            ? Text(
                'Resend code in 0:${_cooldownSeconds.toString().padLeft(2, '0')}',
                style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
              )
            : TextButton(
                onPressed: _isLoading ? null : _sendCode,
                child: Text(
                  'Resend Code',
                  style: AppTypography.labelSmall.copyWith(color: context.colors.primaryAccent),
                ),
              ),
      ),
      if (_errorMsg != null) ...[
        const SizedBox(height: 4),
        Text(
          _errorMsg!,
          style: AppTypography.bodySmall.copyWith(color: context.colors.error),
          textAlign: TextAlign.center,
        ),
      ],
      const SizedBox(height: 16),
      SizedBox(
        height: 48,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: context.colors.primaryAccent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          onPressed: _isLoading ? null : _submit,
          child: _isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator.adaptive(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  'Update Password',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    ];
  }
}

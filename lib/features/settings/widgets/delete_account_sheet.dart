import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/storage/secure_storage.dart';
import '../../auth/providers/auth_provider.dart';

/// Two-step, OTP-verified "Delete Account" flow — the most irreversible
/// action in the app previously deleted immediately on a single tap with
/// no re-authentication at all. Mirrors ChangePasswordSheet's pattern:
/// send a code to the account's own email, then verify it before acting.
class DeleteAccountSheet extends ConsumerStatefulWidget {
  const DeleteAccountSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const DeleteAccountSheet(),
    );
  }

  @override
  ConsumerState<DeleteAccountSheet> createState() => _DeleteAccountSheetState();
}

class _DeleteAccountSheetState extends ConsumerState<DeleteAccountSheet> {
  int _step = 0; // 0 = warning/send code, 1 = enter code to confirm
  final _otpController = TextEditingController();

  bool _isLoading = false;
  String? _errorMsg;
  String? _maskedEmail;

  Timer? _resendTimer;
  int _cooldownSeconds = 0;

  @override
  void dispose() {
    _otpController.dispose();
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
    final masked = await ref.read(authProvider.notifier).sendDeleteAccountOtp();
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

  Future<void> _confirmDelete() async {
    final code = _otpController.text.trim();
    if (code.length != 6) {
      setState(() => _errorMsg = 'Enter the 6-digit code sent to your email');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    final success = await ref.read(authProvider.notifier).deleteAccount(code);
    if (!mounted) return;

    if (success) {
      Navigator.pop(context);
      await SecureStorage.clearSession();
      if (context.mounted) context.go('/auth');
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = ref.read(authProvider).errorMessage ?? 'Failed to delete account';
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
        children: _step == 0 ? _buildWarningStep(context) : _buildVerifyStep(context),
      ),
    );
  }

  List<Widget> _buildWarningStep(BuildContext context) {
    return [
      Icon(Icons.warning_amber_rounded, size: 40, color: context.colors.error),
      const SizedBox(height: 16),
      Text(
        'Delete Account',
        style: AppTypography.titleLarge.copyWith(color: context.colors.error, fontWeight: FontWeight.bold),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 8),
      Text(
        'This permanently deletes your account and all your data. This cannot be undone. '
        'We’ll send a 6-digit verification code to your registered email to confirm.',
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
      Row(
        children: [
          Expanded(
            child: TextButton(
              onPressed: _isLoading ? null : () => Navigator.pop(context),
              child: Text('Cancel', style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: SizedBox(
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.colors.error,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: _isLoading ? null : _sendCode,
                child: _isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Send Code', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
    ];
  }

  List<Widget> _buildVerifyStep(BuildContext context) {
    return [
      Icon(Icons.warning_amber_rounded, size: 40, color: context.colors.error),
      const SizedBox(height: 16),
      Text(
        'Confirm Deletion',
        style: AppTypography.titleLarge.copyWith(color: context.colors.error, fontWeight: FontWeight.bold),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 8),
      Text(
        _maskedEmail != null ? 'Enter the code sent to $_maskedEmail' : 'Enter the code sent to your email',
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
        style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, letterSpacing: 6),
        decoration: InputDecoration(
          counterText: '',
          labelText: 'Verification Code',
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      Align(
        alignment: Alignment.centerRight,
        child: _cooldownSeconds > 0
            ? Text(
                'Resend code in 0:${_cooldownSeconds.toString().padLeft(2, '0')}',
                style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
              )
            : TextButton(
                onPressed: _isLoading ? null : _sendCode,
                child: Text('Resend Code', style: AppTypography.labelSmall.copyWith(color: context.colors.primaryAccent)),
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
            backgroundColor: context.colors.error,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          onPressed: _isLoading ? null : _confirmDelete,
          child: _isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : const Text('Delete My Account', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
      ),
    ];
  }
}

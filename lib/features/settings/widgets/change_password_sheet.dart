import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/app_messenger.dart';
import '../../auth/providers/auth_provider.dart';

/// Change Password: the current password, the new one, and the new one again.
///
/// This used to mail a 6-digit code first, which meant waiting on an email to
/// change a password you already knew. Knowing the current password is the
/// proof, the same way the web settings do it (`POST /auth/change-password`).
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
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _isLoading = false;
  bool _showCurrent = false;
  bool _showNew = false;
  String? _errorMsg;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final current = _currentController.text;
    final next = _newController.text;
    final confirm = _confirmController.text;

    if (current.isEmpty) {
      setState(() => _errorMsg = 'Enter your current password');
      return;
    }
    if (next.length < 8) {
      setState(() => _errorMsg = 'Use at least 8 characters for the new password');
      return;
    }
    if (next != confirm) {
      setState(() => _errorMsg = 'New passwords do not match');
      return;
    }
    if (next == current) {
      setState(() => _errorMsg = 'The new password is the same as the current one');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    final success = await ref.read(authProvider.notifier).changePassword(current, next);
    if (!mounted) return;

    if (success) {
      Navigator.pop(context);
      AppMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Password updated successfully')));
    } else {
      setState(() {
        _isLoading = false;
        // Usually "Incorrect current password." from the API.
        _errorMsg = ref.read(authProvider).errorMessage ?? 'Could not change your password';
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
        children: [
          Icon(Icons.lock_outline_rounded, size: 36, color: context.colors.primaryAccent),
          const SizedBox(height: 12),
          Text(
            'Change Password',
            textAlign: TextAlign.center,
            style: AppTypography.titleLarge.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Enter your current password, then the new one twice.',
            textAlign: TextAlign.center,
            style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
          ),
          const SizedBox(height: 24),
          _field(
            controller: _currentController,
            label: 'Current Password',
            obscure: !_showCurrent,
            onToggle: () => setState(() => _showCurrent = !_showCurrent),
          ),
          const SizedBox(height: 14),
          _field(
            controller: _newController,
            label: 'New Password',
            obscure: !_showNew,
            onToggle: () => setState(() => _showNew = !_showNew),
          ),
          const SizedBox(height: 14),
          _field(
            controller: _confirmController,
            label: 'Retype New Password',
            obscure: !_showNew,
          ),
          if (_errorMsg != null) ...[
            const SizedBox(height: 12),
            Text(
              _errorMsg!,
              textAlign: TextAlign.center,
              style: AppTypography.bodySmall.copyWith(color: context.colors.error),
            ),
          ],
          const SizedBox(height: 20),
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
        ],
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    required bool obscure,
    VoidCallback? onToggle,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      enabled: !_isLoading,
      textInputAction: TextInputAction.next,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        suffixIcon: onToggle == null
            ? null
            : IconButton(
                onPressed: onToggle,
                icon: Icon(
                  obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  size: 20,
                  color: context.colors.textSecondary,
                ),
              ),
      ),
    );
  }
}

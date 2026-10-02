import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/storage/secure_storage.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/providers/auth_provider.dart';

/// Delete Account: the warning, then typing DELETE to confirm.
///
/// This used to mail a 6-digit code first. Typing the word is the
/// confirmation now, the same as the web settings page.
class DeleteAccountSheet extends ConsumerStatefulWidget {
  const DeleteAccountSheet({super.key});

  /// What has to be typed before the button works.
  static const confirmWord = 'DELETE';

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
  final _confirmController = TextEditingController();

  bool _isLoading = false;
  String? _errorMsg;

  bool get _canDelete =>
      _confirmController.text.trim().toUpperCase() == DeleteAccountSheet.confirmWord;

  @override
  void dispose() {
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _confirmDelete() async {
    if (!_canDelete) {
      setState(() => _errorMsg = 'Type ${DeleteAccountSheet.confirmWord} to confirm');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    final success = await ref.read(authProvider.notifier).deleteAccount();
    if (!mounted) return;

    if (success) {
      Navigator.pop(context);
      await SecureStorage.clearSession();
      if (context.mounted) context.go('/auth');
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = ref.read(authProvider).errorMessage ?? 'Could not delete your account';
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
          Icon(Icons.warning_amber_rounded, size: 40, color: context.colors.error),
          const SizedBox(height: 16),
          Text(
            'Delete Account',
            textAlign: TextAlign.center,
            style: AppTypography.titleLarge.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your posts, messages, saved items and followers are removed for good. '
            'This cannot be undone.',
            textAlign: TextAlign.center,
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
          ),
          const SizedBox(height: 24),
          Text(
            'Type ${DeleteAccountSheet.confirmWord} to confirm',
            style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _confirmController,
            enabled: !_isLoading,
            autocorrect: false,
            enableSuggestions: false,
            textCapitalization: TextCapitalization.characters,
            onChanged: (_) => setState(() => _errorMsg = null),
            decoration: InputDecoration(
              hintText: DeleteAccountSheet.confirmWord,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
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
                backgroundColor: context.colors.error,
                disabledBackgroundColor: context.colors.error.withValues(alpha: 0.4),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: _isLoading || !_canDelete ? null : _confirmDelete,
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
                      'Delete my account',
                      style: AppTypography.bodyMedium.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _isLoading ? null : () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

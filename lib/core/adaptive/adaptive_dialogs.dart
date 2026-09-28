import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/app_typography.dart';
import '../utils/haptics.dart';

bool get _ios => defaultTargetPlatform == TargetPlatform.iOS;

/// Shows a platform-native alert dialog.
///
/// iOS → [CupertinoAlertDialog]; Android → the existing Material
/// [AlertDialog], styled with the Lyket palette.
///
/// Returns `true` when [confirmLabel] is tapped, `false`/`null` otherwise.
Future<bool?> showAdaptiveConfirmDialog(
  BuildContext context, {
  required String title,
  String? message,
  String confirmLabel = 'OK',
  String cancelLabel = 'Cancel',
  bool isDestructive = false,
}) {
  if (_ios) {
    Haptics.light();
    return showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text(title),
        content: message != null ? Text(message) : null,
        actions: [
          CupertinoDialogAction(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(cancelLabel),
          ),
          CupertinoDialogAction(
            isDestructiveAction: isDestructive,
            isDefaultAction: !isDestructive,
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
  }

  return showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: ctx.colors.card,
      title: Text(
        title,
        style: AppTypography.titleMedium.copyWith(
          color: isDestructive ? ctx.colors.error : ctx.colors.textPrimary,
        ),
      ),
      content: message != null
          ? Text(
              message,
              style: AppTypography.bodyMedium.copyWith(color: ctx.colors.textSecondary),
            )
          : null,
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: Text(
            cancelLabel,
            style: AppTypography.labelLarge.copyWith(color: ctx.colors.textSecondary),
          ),
        ),
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          child: Text(
            confirmLabel,
            style: TextStyle(
              color: isDestructive ? ctx.colors.error : ctx.colors.primaryAccent,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    ),
  );
}

/// A single entry in an adaptive action sheet.
class AdaptiveSheetAction {
  final String label;
  final IconData? icon;
  final bool isDestructive;
  final VoidCallback onPressed;

  const AdaptiveSheetAction({
    required this.label,
    required this.onPressed,
    this.icon,
    this.isDestructive = false,
  });
}

/// Shows a platform-native action sheet.
///
/// iOS → [CupertinoActionSheet] (blurred, capsule cancel button);
/// Android → a Material bottom sheet.
Future<void> showAdaptiveActionSheet(
  BuildContext context, {
  String? title,
  String? message,
  required List<AdaptiveSheetAction> actions,
  String cancelLabel = 'Cancel',
}) {
  if (_ios) {
    Haptics.light();
    return showCupertinoModalPopup<void>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: title != null ? Text(title) : null,
        message: message != null ? Text(message) : null,
        actions: actions
            .map(
              (a) => CupertinoActionSheetAction(
                isDestructiveAction: a.isDestructive,
                onPressed: () {
                  Navigator.of(ctx).pop();
                  a.onPressed();
                },
                child: Text(a.label),
              ),
            )
            .toList(),
        cancelButton: CupertinoActionSheetAction(
          isDefaultAction: true,
          onPressed: () => Navigator.of(ctx).pop(),
          child: Text(cancelLabel),
        ),
      ),
    );
  }

  return showModalBottomSheet<void>(
    context: context,
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(title, style: Theme.of(ctx).textTheme.titleMedium),
            ),
          ...actions.map(
            (a) => ListTile(
              leading: a.icon != null
                  ? Icon(a.icon, color: a.isDestructive ? ctx.colors.error : null)
                  : null,
              title: Text(
                a.label,
                style: a.isDestructive ? TextStyle(color: ctx.colors.error) : null,
              ),
              onTap: () {
                Navigator.of(ctx).pop();
                a.onPressed();
              },
            ),
          ),
        ],
      ),
    ),
  );
}

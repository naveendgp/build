import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Drop-in stand-in for [ScaffoldMessenger] that shows successes and the few
/// informational messages, and swallows failures to the console.
///
/// Every failed request used to raise a red snackbar — often a bare
/// "Failed to …" from the API client — so an ordinary hiccup read like the app
/// breaking. Routing the call sites through here rather than deleting them
/// keeps each failure's recovery code running (a hidden post comes back, a
/// button re-enables); only the red message is gone.
///
/// Mirrors the web app's `@/lib/toast` (commit 8baf719).
class AppMessenger {
  const AppMessenger._(this._context);

  final BuildContext _context;

  static AppMessenger of(BuildContext context) => AppMessenger._(context);

  /// Words that mark a message as a failure rather than something the person
  /// asked to see. Matched case-insensitively against the snackbar's text.
  static const _failureMarkers = [
    'failed',
    'error',
    'could not',
    'couldn\'t',
    'unable',
    'invalid',
    'went wrong',
    'try again',
    'not found',
    'unauthorized',
    'unauthorised',
    'no internet',
    'connection',
    'timeout',
    'timed out',
  ];

  static String? _textOf(Widget? content) {
    if (content is Text) return content.data ?? content.textSpan?.toPlainText();
    return null;
  }

  static bool _isFailure(SnackBar bar, BuildContext context) {
    final text = _textOf(bar.content)?.toLowerCase();
    if (text != null) {
      for (final marker in _failureMarkers) {
        if (text.contains(marker)) return true;
      }
    }
    final background = bar.backgroundColor;
    if (background != null && background == context.colors.error) return true;
    return false;
  }

  ScaffoldFeatureController<SnackBar, SnackBarClosedReason>? showSnackBar(SnackBar snackBar) {
    if (_isFailure(snackBar, _context)) {
      debugPrint('[suppressed] ${_textOf(snackBar.content) ?? 'request failed'}');
      return null;
    }
    return ScaffoldMessenger.of(_context).showSnackBar(snackBar);
  }

  void clearSnackBars() => ScaffoldMessenger.of(_context).clearSnackBars();

  void hideCurrentSnackBar({SnackBarClosedReason reason = SnackBarClosedReason.hide}) =>
      ScaffoldMessenger.of(_context).hideCurrentSnackBar(reason: reason);

  void removeCurrentSnackBar({SnackBarClosedReason reason = SnackBarClosedReason.remove}) =>
      ScaffoldMessenger.of(_context).removeCurrentSnackBar(reason: reason);
}

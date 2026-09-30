import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

bool get _ios => defaultTargetPlatform == TargetPlatform.iOS;

/// Platform-native date picker.
///
/// iOS → bottom-sheet wheel picker ([CupertinoDatePicker]);
/// Android → the existing Material [showDatePicker] calendar.
Future<DateTime?> showAdaptiveDatePicker(
  BuildContext context, {
  required DateTime initialDate,
  required DateTime firstDate,
  required DateTime lastDate,

  /// Material-only theming hook (ignored on iOS — the Cupertino wheel is
  /// styled natively).
  Widget Function(BuildContext, Widget?)? builder,
}) async {
  if (!_ios) {
    return showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      builder: builder,
    );
  }

  DateTime selected = initialDate;
  // The wheel resolves its colours from the nearest CupertinoTheme, and
  // without one it follows the operating system instead of the app. Switching
  // the app to dark while the phone stayed light left the picker white.
  final brightness = Theme.of(context).brightness;
  final confirmed = await showCupertinoModalPopup<bool>(
    context: context,
    builder: (ctx) => CupertinoTheme(
      data: CupertinoThemeData(brightness: brightness),
      child: Container(
        height: 300,
        padding: const EdgeInsets.only(top: 6),
        color: CupertinoColors.systemBackground.resolveFrom(ctx),
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CupertinoButton(
                    onPressed: () => Navigator.of(ctx).pop(false),
                    child: const Text('Cancel'),
                  ),
                  CupertinoButton(
                    onPressed: () => Navigator.of(ctx).pop(true),
                    child: const Text('Done', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              Expanded(
                child: CupertinoDatePicker(
                  mode: CupertinoDatePickerMode.date,
                  initialDateTime: initialDate,
                  minimumDate: firstDate,
                  maximumDate: lastDate,
                  onDateTimeChanged: (d) => selected = d,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  return confirmed == true ? selected : null;
}

/// Platform-native time picker.
///
/// iOS → bottom-sheet wheel picker; Android → Material [showTimePicker].
Future<TimeOfDay?> showAdaptiveTimePicker(
  BuildContext context, {
  required TimeOfDay initialTime,
}) async {
  if (!_ios) {
    return showTimePicker(context: context, initialTime: initialTime);
  }

  final now = DateTime.now();
  DateTime selected = DateTime(now.year, now.month, now.day, initialTime.hour, initialTime.minute);
  // The wheel resolves its colours from the nearest CupertinoTheme, and
  // without one it follows the operating system instead of the app. Switching
  // the app to dark while the phone stayed light left the picker white.
  final brightness = Theme.of(context).brightness;
  final confirmed = await showCupertinoModalPopup<bool>(
    context: context,
    builder: (ctx) => CupertinoTheme(
      data: CupertinoThemeData(brightness: brightness),
      child: Container(
        height: 300,
        padding: const EdgeInsets.only(top: 6),
        color: CupertinoColors.systemBackground.resolveFrom(ctx),
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CupertinoButton(
                    onPressed: () => Navigator.of(ctx).pop(false),
                    child: const Text('Cancel'),
                  ),
                  CupertinoButton(
                    onPressed: () => Navigator.of(ctx).pop(true),
                    child: const Text('Done', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              Expanded(
                child: CupertinoDatePicker(
                  mode: CupertinoDatePickerMode.time,
                  initialDateTime: selected,
                  onDateTimeChanged: (d) => selected = d,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  return confirmed == true ? TimeOfDay(hour: selected.hour, minute: selected.minute) : null;
}

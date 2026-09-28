import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

bool get _ios => defaultTargetPlatform == TargetPlatform.iOS;

/// Platform-native switch: [CupertinoSwitch] on iOS, Material [Switch]
/// elsewhere. Keeps the brand accent as the active color on both.
class AdaptiveSwitch extends StatelessWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;
  final Color? activeColor;

  const AdaptiveSwitch({
    super.key,
    required this.value,
    required this.onChanged,
    this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    if (_ios) {
      return CupertinoSwitch(
        value: value,
        onChanged: onChanged,
        activeTrackColor: activeColor,
      );
    }
    return Switch(value: value, onChanged: onChanged, activeThumbColor: activeColor);
  }
}

/// Platform-native loading indicator: [CupertinoActivityIndicator] on iOS,
/// [CircularProgressIndicator] elsewhere.
class AdaptiveLoadingIndicator extends StatelessWidget {
  /// Diameter of the indicator.
  final double size;

  /// Only applied to the Material spinner; the Cupertino indicator uses its
  /// native grey to stay true to iOS.
  final Color? color;
  final double strokeWidth;

  const AdaptiveLoadingIndicator({
    super.key,
    this.size = 24,
    this.color,
    this.strokeWidth = 2.5,
  });

  @override
  Widget build(BuildContext context) {
    if (_ios) {
      return CupertinoActivityIndicator(radius: size / 2);
    }
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(strokeWidth: strokeWidth, color: color),
    );
  }
}

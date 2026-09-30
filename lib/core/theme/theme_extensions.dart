import 'package:flutter/material.dart';

class AppThemeColors extends ThemeExtension<AppThemeColors> {
  final Color background;
  final Color surface;
  final Color surfaceSecondary;
  final Color card;
  final Color border;
  final Color borderLight;
  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color textDisabled;
  final Color primaryAccent;
  final Color secondaryAccent;
  final Color success;
  final Color warning;
  final Color error;
  final LinearGradient cinematicGradient;

  const AppThemeColors({
    required this.background,
    required this.surface,
    required this.surfaceSecondary,
    required this.card,
    required this.border,
    required this.borderLight,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.textDisabled,
    required this.primaryAccent,
    required this.secondaryAccent,
    required this.success,
    required this.warning,
    required this.error,
    required this.cinematicGradient,
  });

  @override
  AppThemeColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceSecondary,
    Color? card,
    Color? border,
    Color? borderLight,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? textDisabled,
    Color? primaryAccent,
    Color? secondaryAccent,
    Color? success,
    Color? warning,
    Color? error,
    LinearGradient? cinematicGradient,
  }) {
    return AppThemeColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceSecondary: surfaceSecondary ?? this.surfaceSecondary,
      card: card ?? this.card,
      border: border ?? this.border,
      borderLight: borderLight ?? this.borderLight,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      textDisabled: textDisabled ?? this.textDisabled,
      primaryAccent: primaryAccent ?? this.primaryAccent,
      secondaryAccent: secondaryAccent ?? this.secondaryAccent,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      error: error ?? this.error,
      cinematicGradient: cinematicGradient ?? this.cinematicGradient,
    );
  }

  @override
  AppThemeColors lerp(ThemeExtension<AppThemeColors>? other, double t) {
    if (other is! AppThemeColors) return this;
    return AppThemeColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceSecondary: Color.lerp(surfaceSecondary, other.surfaceSecondary, t)!,
      card: Color.lerp(card, other.card, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderLight: Color.lerp(borderLight, other.borderLight, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      textDisabled: Color.lerp(textDisabled, other.textDisabled, t)!,
      primaryAccent: Color.lerp(primaryAccent, other.primaryAccent, t)!,
      secondaryAccent: Color.lerp(secondaryAccent, other.secondaryAccent, t)!,
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      error: Color.lerp(error, other.error, t)!,
      cinematicGradient: LinearGradient.lerp(cinematicGradient, other.cinematicGradient, t)!,
    );
  }
}

class AppThemeShadows extends ThemeExtension<AppThemeShadows> {
  final List<BoxShadow> layer1;
  final List<BoxShadow> layer2;
  final List<BoxShadow> layer3;

  const AppThemeShadows({required this.layer1, required this.layer2, required this.layer3});

  @override
  AppThemeShadows copyWith({
    List<BoxShadow>? layer1,
    List<BoxShadow>? layer2,
    List<BoxShadow>? layer3,
  }) {
    return AppThemeShadows(
      layer1: layer1 ?? this.layer1,
      layer2: layer2 ?? this.layer2,
      layer3: layer3 ?? this.layer3,
    );
  }

  @override
  AppThemeShadows lerp(ThemeExtension<AppThemeShadows>? other, double t) {
    if (other is! AppThemeShadows) return this;
    return AppThemeShadows(
      layer1: BoxShadow.lerpList(layer1, other.layer1, t) ?? layer1,
      layer2: BoxShadow.lerpList(layer2, other.layer2, t) ?? layer2,
      layer3: BoxShadow.lerpList(layer3, other.layer3, t) ?? layer3,
    );
  }
}

class AppThemeGlass extends ThemeExtension<AppThemeGlass> {
  final Color background;
  final Color border;
  final double blur;

  const AppThemeGlass({required this.background, required this.border, required this.blur});

  @override
  AppThemeGlass copyWith({Color? background, Color? border, double? blur}) {
    return AppThemeGlass(
      background: background ?? this.background,
      border: border ?? this.border,
      blur: blur ?? this.blur,
    );
  }

  @override
  AppThemeGlass lerp(ThemeExtension<AppThemeGlass>? other, double t) {
    if (other is! AppThemeGlass) return this;
    return AppThemeGlass(
      background: Color.lerp(background, other.background, t)!,
      border: Color.lerp(border, other.border, t)!,
      blur: (blur + (other.blur - blur) * t),
    );
  }
}

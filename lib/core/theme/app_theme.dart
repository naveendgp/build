import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_spacing.dart';
import 'app_typography.dart';
import 'theme_tokens.dart';
import 'theme_extensions.dart';

export 'theme_tokens.dart';
export 'theme_extensions.dart';
export 'build_context_extensions.dart';

/// Lyket Design System — Complete Theme Configuration
class AppTheme {
  AppTheme._();

  // ─── EXTENSIONS ──────────────────────────────────────────
  static const _darkColors = AppThemeColors(
    background: ThemeTokens.darkBackground,
    surface: ThemeTokens.darkSurface,
    surfaceSecondary: ThemeTokens.darkCard,
    card: ThemeTokens.darkCard,
    border: ThemeTokens.darkBorderPrimary,
    borderLight: ThemeTokens.darkBorderSecondary,
    textPrimary: ThemeTokens.darkTextPrimary,
    textSecondary: ThemeTokens.darkTextSecondary,
    textTertiary: ThemeTokens.darkTextTertiary,
    textDisabled: ThemeTokens.darkTextDisabled,
    primaryAccent: ThemeTokens.primaryAccent,
    secondaryAccent: ThemeTokens.secondaryAccent,
    success: ThemeTokens.success,
    warning: ThemeTokens.warning,
    error: ThemeTokens.error,
    cinematicGradient: ThemeTokens.darkCinematicGradient,
  );

  static const _lightColors = AppThemeColors(
    background: ThemeTokens.lightBackground,
    surface: ThemeTokens.lightSurface,
    surfaceSecondary: ThemeTokens.lightSurfaceSecondary,
    card: ThemeTokens.lightCard,
    border: ThemeTokens.lightBorderPrimary,
    borderLight: ThemeTokens.lightBorderSecondary,
    textPrimary: ThemeTokens.lightTextPrimary,
    textSecondary: ThemeTokens.lightTextSecondary,
    textTertiary: ThemeTokens.lightTextTertiary,
    textDisabled: ThemeTokens.lightTextDisabled,
    primaryAccent: ThemeTokens.primaryAccent,
    secondaryAccent: ThemeTokens.secondaryAccent,
    success: ThemeTokens.success,
    warning: ThemeTokens.warning,
    error: ThemeTokens.error,
    cinematicGradient: ThemeTokens.lightCinematicGradient,
  );

  static const _darkShadows = AppThemeShadows(
    layer1: ThemeTokens.darkShadow1,
    layer2: ThemeTokens.darkShadow2,
    layer3: ThemeTokens.darkShadow3,
  );

  static const _lightShadows = AppThemeShadows(
    layer1: ThemeTokens.lightShadow1,
    layer2: ThemeTokens.lightShadow2,
    layer3: ThemeTokens.lightShadow3,
  );

  static const _darkGlass = AppThemeGlass(
    background: Color(0xB3121316), // 70% dark surface
    border: Color(0x1AFFFFFF), // 10% white
    blur: 20.0,
  );

  static const _lightGlass = AppThemeGlass(
    background: Color(0xB3FFFFFF), // 70% white
    border: Color(0x99FFFFFF), // 60% white
    blur: 20.0,
  );

  /// Native page transitions per platform: Cupertino slide + interactive
  /// swipe-back on iOS; Android keeps the default Material transition.
  static const _pageTransitions = PageTransitionsTheme(
    builders: <TargetPlatform, PageTransitionsBuilder>{
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
      TargetPlatform.android: ZoomPageTransitionsBuilder(),
    },
  );

  // ─── DARK THEME ──────────────────────────────────────────
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: AppTypography.fontFamily,
      pageTransitionsTheme: _pageTransitions,
      extensions: <ThemeExtension<dynamic>>[
        _darkColors,
        _darkShadows,
        _darkGlass,
      ],

      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: ThemeTokens.primaryAccent,
        onPrimary: Colors.white,
        secondary: ThemeTokens.secondaryAccent,
        onSecondary: Colors.white,
        surface: ThemeTokens.darkSurface,
        onSurface: ThemeTokens.darkTextPrimary,
        error: ThemeTokens.error,
        onError: Colors.white,
      ),

      // Scaffold
      scaffoldBackgroundColor: ThemeTokens.darkBackground,

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        iconTheme: const IconThemeData(
          color: ThemeTokens.darkTextPrimary,
          size: 22,
        ),
        titleTextStyle: AppTypography.titleMedium,
        centerTitle: true,
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ThemeTokens.primaryAccent,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size(double.infinity, AppSpacing.buttonHeight),
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMd,
          ),
          textStyle: AppTypography.button,
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ThemeTokens.darkSurface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: ThemeTokens.darkBorderPrimary, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: ThemeTokens.darkBorderPrimary, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: ThemeTokens.primaryAccent, width: 1.5),
        ),
        hintStyle: AppTypography.bodyMedium.copyWith(color: ThemeTokens.darkTextTertiary),
        labelStyle: AppTypography.bodyMedium.copyWith(color: ThemeTokens.darkTextSecondary),
        floatingLabelStyle: AppTypography.labelMedium.copyWith(color: ThemeTokens.primaryAccent),
      ),

      // Splash / Ink
      splashFactory: InkSparkle.splashFactory,
      splashColor: ThemeTokens.primaryAccent.withValues(alpha: 0.08),
      highlightColor: Colors.transparent,
    );
  }

  // ─── LIGHT THEME ─────────────────────────────────────────
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: AppTypography.fontFamily,
      pageTransitionsTheme: _pageTransitions,
      extensions: <ThemeExtension<dynamic>>[
        _lightColors,
        _lightShadows,
        _lightGlass,
      ],

      colorScheme: const ColorScheme.light(
        primary: ThemeTokens.primaryAccent,
        onPrimary: Colors.white,
        secondary: ThemeTokens.secondaryAccent,
        onSecondary: Colors.white,
        surface: ThemeTokens.lightSurface,
        onSurface: ThemeTokens.lightTextPrimary,
        error: ThemeTokens.error,
        onError: Colors.white,
      ),

      scaffoldBackgroundColor: ThemeTokens.lightBackground,

      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        iconTheme: const IconThemeData(
          color: ThemeTokens.lightTextPrimary,
          size: 22,
        ),
        titleTextStyle: AppTypography.titleMedium.copyWith(
          color: ThemeTokens.lightTextPrimary,
        ),
        centerTitle: true,
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ThemeTokens.primaryAccent,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size(double.infinity, AppSpacing.buttonHeight),
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMd,
          ),
          textStyle: AppTypography.button,
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ThemeTokens.lightSurface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: ThemeTokens.lightBorderPrimary, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: ThemeTokens.lightBorderPrimary, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: ThemeTokens.primaryAccent, width: 1.5),
        ),
        hintStyle: AppTypography.bodyMedium.copyWith(color: ThemeTokens.lightTextTertiary),
        labelStyle: AppTypography.bodyMedium.copyWith(color: ThemeTokens.lightTextSecondary),
        floatingLabelStyle: AppTypography.labelMedium.copyWith(color: ThemeTokens.primaryAccent),
      ),

      splashFactory: InkSparkle.splashFactory,
      splashColor: ThemeTokens.primaryAccent.withValues(alpha: 0.08),
      highlightColor: Colors.transparent,
    );
  }
}

import 'package:flutter/material.dart';

/// Lyket Design System — Color Tokens
/// Dark-first luxury palette with red primary accent
class AppColors {
  AppColors._();

  // ─── Backgrounds ─────────────────────────────────────────
  static const Color background = Color(0xFF0A0A0B);
  static const Color surface = Color(0xFF121316);
  static const Color card = Color(0xFF1B1D22);

  // ─── Borders ─────────────────────────────────────────────
  static const Color border = Color(0x0FFFFFFF); // 6% white
  static const Color borderLight = Color(0x1AFFFFFF); // 10% white
  static const Color borderFocus = Color(0x33FF0000); // 20% red

  // ─── Primary Accent (Red) ────────────────────────────────
  static const Color primary = Color(0xFFFF0000);
  static const Color primaryLight = Color(0xFFFF3333);
  static const Color primaryDark = Color(0xFFCC0000);
  static const Color primaryMuted = Color(0x33FF0000); // 20% red

  // ─── Secondary Accent ────────────────────────────────────
  static const Color secondary = Color(0xFF00C2FF);
  static const Color secondaryMuted = Color(0x3300C2FF);

  // ─── Brand/Lead Accent ───────────────────────────────────
  static const Color brandAccent = Color(0xFF7C5CFF);
  static const Color brandAccentMuted = Color(0x337C5CFF);

  // ─── Semantic ────────────────────────────────────────────
  static const Color success = Color(0xFF22C55E);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);

  // ─── Text ────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFA1A1AA);
  static const Color textTertiary = Color(0xFF71717A);
  static const Color textDisabled = Color(0xFF52525B);

  // ─── Gradients ───────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFFF0000), Color(0xFFFF4444)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient primaryGradientVertical = LinearGradient(
    colors: [Color(0xFFFF0000), Color(0xFFCC0000)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient surfaceGradient = LinearGradient(
    colors: [Color(0xFF121316), Color(0xFF0A0A0B)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cinematicGradient = LinearGradient(
    colors: [
      Color(0xFF0A0A0B),
      Color(0xFF1B0000),
      Color(0xFF0A0A0B),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ─── Light Theme Overrides ───────────────────────────────
  static const Color lightBackground = Color(0xFFF8F8FA);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFF0F0F3);
  static const Color lightBorder = Color(0x0F000000);
  static const Color lightTextPrimary = Color(0xFF18181B);
  static const Color lightTextSecondary = Color(0xFF71717A);

  // ─── Overlay ─────────────────────────────────────────────
  static const Color overlay = Color(0x80000000);
  static const Color shimmerBase = Color(0xFF1B1D22);
  static const Color shimmerHighlight = Color(0xFF2A2D35);
}

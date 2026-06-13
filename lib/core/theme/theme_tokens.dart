import 'package:flutter/material.dart';

class ThemeTokens {
  ThemeTokens._();

  // ─── ACCENTS (Shared) ────────────────────────────────────
  static const Color primaryAccent = Color(0xFFFF0000);
  static const Color secondaryAccent = Color(0xFF00C2FF);
  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);

  // ─── DARK THEME ──────────────────────────────────────────
  static const Color darkBackground = Color(0xFF0A0A0B);
  static const Color darkSurface = Color(0xFF121316);
  static const Color darkCard = Color(0xFF1B1D22);
  
  static const Color darkBorderPrimary = Color(0x0FFFFFFF); // 6% white
  static const Color darkBorderSecondary = Color(0x1AFFFFFF); // 10% white
  
  static const Color darkTextPrimary = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFFA1A1AA);
  static const Color darkTextTertiary = Color(0xFF71717A);
  static const Color darkTextDisabled = Color(0xFF52525B);

  // ─── LIGHT THEME ─────────────────────────────────────────
  static const Color lightBackground = Color(0xFFF2F2F7);
  static const Color lightSurfaceSecondary = Color(0xFFE5E5EA);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  
  static const Color lightBorderPrimary = Color(0x1F000000); // 12% black
  static const Color lightBorderSecondary = Color(0x0F000000); // 6% black

  static const Color lightTextPrimary = Color(0xFF000000);
  static const Color lightTextSecondary = Color(0xFF6E6E73);
  static const Color lightTextTertiary = Color(0xFF8E8E93);
  static const Color lightTextDisabled = Color(0xFFC7C7CC);

  // ─── SHADOWS ─────────────────────────────────────────────
  // Dark mode shadows (minimal/none)
  static const List<BoxShadow> darkShadow1 = [];
  static const List<BoxShadow> darkShadow2 = [];
  static const List<BoxShadow> darkShadow3 = [];

  // Light mode shadows (Premium Layer System)
  static const List<BoxShadow> lightShadow1 = [
    BoxShadow(color: Color(0x14000000), blurRadius: 12, offset: Offset(0, 4)), // 8% black
  ];
  static const List<BoxShadow> lightShadow2 = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 24, offset: Offset(0, 8)), // 10% black
  ];
  static const List<BoxShadow> lightShadow3 = [
    BoxShadow(color: Color(0x1F000000), blurRadius: 40, offset: Offset(0, 16)), // 12% black
  ];

  // ─── GRADIENTS ───────────────────────────────────────────
  static const LinearGradient darkCinematicGradient = LinearGradient(
    colors: [Color(0xFF0A0A0B), Color(0xFF1B0000), Color(0xFF0A0A0B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient lightCinematicGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFF2F2F7), Color(0xFFE5E5EA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

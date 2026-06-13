import 'package:flutter/material.dart';

/// Lyket Design System — Spacing & Sizing Tokens
/// Generous, breathing-room layout system
class AppSpacing {
  AppSpacing._();

  // ─── Spacing Scale ───────────────────────────────────────
  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
  static const double xxxl = 64.0;
  static const double xxxxl = 80.0;

  // ─── Radius Scale ────────────────────────────────────────
  static const double radiusSm = 8.0;
  static const double radiusMd = 14.0;
  static const double radiusLg = 18.0;
  static const double radiusXl = 22.0;
  static const double radiusXxl = 28.0;
  static const double radiusFull = 100.0;

  // ─── Border Radius ───────────────────────────────────────
  static final BorderRadius borderRadiusSm = BorderRadius.circular(radiusSm);
  static final BorderRadius borderRadiusMd = BorderRadius.circular(radiusMd);
  static final BorderRadius borderRadiusLg = BorderRadius.circular(radiusLg);
  static final BorderRadius borderRadiusXl = BorderRadius.circular(radiusXl);
  static final BorderRadius borderRadiusXxl = BorderRadius.circular(radiusXxl);
  static final BorderRadius borderRadiusFull = BorderRadius.circular(radiusFull);

  // ─── Padding Presets ─────────────────────────────────────
  static const EdgeInsets paddingHorizontal = EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets paddingAll = EdgeInsets.all(lg);
  static const EdgeInsets paddingScreen = EdgeInsets.symmetric(horizontal: lg, vertical: md);
  static const EdgeInsets paddingCard = EdgeInsets.all(xl);

  // ─── Icon Sizes ──────────────────────────────────────────
  static const double iconSm = 18.0;
  static const double iconMd = 22.0;
  static const double iconLg = 28.0;
  static const double iconXl = 36.0;

  // ─── Button Heights ──────────────────────────────────────
  static const double buttonHeight = 56.0;
  static const double buttonHeightSm = 44.0;
  static const double inputHeight = 56.0;
}

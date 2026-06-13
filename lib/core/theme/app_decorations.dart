import 'dart:ui';
import 'package:flutter/material.dart';
import 'app_theme.dart';
import 'app_spacing.dart';

/// Lyket Design System — Decorations & Visual Effects
/// Floating cards, glassmorphism, glow borders
class AppDecorations {
  AppDecorations._();

  // ─── Floating Card ───────────────────────────────────────
  static BoxDecoration floatingCard(BuildContext context) => BoxDecoration(
    color: context.colors.card,
    borderRadius: AppSpacing.borderRadiusXl,
    border: Border.all(color: context.colors.border, width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.3),
        blurRadius: 24,
        offset: const Offset(0, 8),
        spreadRadius: -4,
      ),
    ],
  );

  // ─── Surface Card ────────────────────────────────────────
  static BoxDecoration surfaceCard(BuildContext context) => BoxDecoration(
    color: context.colors.surface,
    borderRadius: AppSpacing.borderRadiusXl,
    border: Border.all(color: context.colors.borderLight, width: 1),
  );

  // ─── Glassmorphism Card ──────────────────────────────────
  static BoxDecoration glassCard(BuildContext context) => BoxDecoration(
    color: context.colors.surface.withValues(alpha: 0.6),
    borderRadius: AppSpacing.borderRadiusXl,
    border: Border.all(color: context.colors.borderLight, width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.2),
        blurRadius: 32,
        offset: const Offset(0, 12),
        spreadRadius: -8,
      ),
    ],
  );

  // ─── Selected Card ──────────────────────────────────────
  static BoxDecoration selectedCard(BuildContext context) => BoxDecoration(
    color: context.colors.primaryAccent.withValues(alpha: 0.08),
    borderRadius: AppSpacing.borderRadiusXl,
    border: Border.all(color: context.colors.primaryAccent.withValues(alpha: 0.4), width: 1.5),
    boxShadow: [
      BoxShadow(
        color: context.colors.primaryAccent.withValues(alpha: 0.1),
        blurRadius: 24,
        offset: const Offset(0, 4),
        spreadRadius: -2,
      ),
    ],
  );

  // ─── Input Decoration ────────────────────────────────────
  static BoxDecoration inputDefault(BuildContext context) => BoxDecoration(
    color: context.colors.surface,
    borderRadius: AppSpacing.borderRadiusMd,
    border: Border.all(color: context.colors.border, width: 1),
  );

  static BoxDecoration inputFocused(BuildContext context) => BoxDecoration(
    color: context.colors.surface,
    borderRadius: AppSpacing.borderRadiusMd,
    border: Border.all(color: context.colors.primaryAccent.withValues(alpha: 0.5), width: 1.5),
    boxShadow: [
      BoxShadow(
        color: context.colors.primaryAccent.withValues(alpha: 0.08),
        blurRadius: 16,
        spreadRadius: 0,
      ),
    ],
  );

  // ─── Premium Gradient Button ─────────────────────────────
  static BoxDecoration premiumButton(BuildContext context) => BoxDecoration(
    gradient: context.colors.cinematicGradient,
    borderRadius: AppSpacing.borderRadiusMd,
    boxShadow: [
      BoxShadow(
        color: context.colors.primaryAccent.withValues(alpha: 0.35),
        blurRadius: 20,
        offset: const Offset(0, 6),
        spreadRadius: -4,
      ),
    ],
  );

  static BoxDecoration premiumButtonPressed(BuildContext context) => BoxDecoration(
    gradient: context.colors.cinematicGradient,
    borderRadius: AppSpacing.borderRadiusMd,
    boxShadow: [
      BoxShadow(
        color: context.colors.primaryAccent.withValues(alpha: 0.2),
        blurRadius: 12,
        offset: const Offset(0, 3),
        spreadRadius: -2,
      ),
    ],
  );

  // ─── Helpers ─────────────────────────────────────────────
  static ImageFilter get blurFilter => ImageFilter.blur(sigmaX: 20, sigmaY: 20);
}

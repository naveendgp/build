import 'package:flutter/material.dart';
import 'theme_extensions.dart';

extension ThemeContextExtension on BuildContext {
  AppThemeColors get colors => Theme.of(this).extension<AppThemeColors>()!;
  AppThemeShadows get shadows => Theme.of(this).extension<AppThemeShadows>()!;
  AppThemeGlass get glass => Theme.of(this).extension<AppThemeGlass>()!;
  TextTheme get typography => Theme.of(this).textTheme;
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
}

import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Platform-aware icon set.
///
/// On iOS these resolve to SF Symbol equivalents (via [CupertinoIcons]);
/// everywhere else the existing Material icons are returned so Android is
/// pixel-identical to before.
class AppIcons {
  AppIcons._();

  static bool get _ios => defaultTargetPlatform == TargetPlatform.iOS;

  // ─── Navigation ─────────────────────────────────────────
  // Home intentionally uses the Material glyph on all platforms — the SF
  // house variants were rejected in design review. Selection is conveyed by
  // tint + the dot indicator.
  static IconData get home => Icons.home_filled;
  static IconData get homeFilled => Icons.home_filled;
  static IconData get search => _ios ? CupertinoIcons.search : Icons.search_rounded;
  static IconData get add => _ios ? CupertinoIcons.add : Icons.add_rounded;
  static IconData get messages => _ios ? CupertinoIcons.paperplane : Icons.send_rounded;
  static IconData get messagesFilled => _ios ? CupertinoIcons.paperplane_fill : Icons.send_rounded;
  static IconData get profile => _ios ? CupertinoIcons.person_crop_circle : Icons.person_outline_rounded;
  static IconData get profileFilled => _ios ? CupertinoIcons.person_crop_circle_fill : Icons.person_outline_rounded;
  static IconData get back => _ios ? CupertinoIcons.chevron_back : Icons.arrow_back;
  static IconData get chevronRight => _ios ? CupertinoIcons.chevron_forward : Icons.chevron_right_rounded;
  static IconData get close => _ios ? CupertinoIcons.xmark : Icons.close_rounded;

  // ─── Interactions ───────────────────────────────────────
  static IconData get like => _ios ? CupertinoIcons.heart_fill : Icons.favorite_rounded;
  static IconData get likeOutline => _ios ? CupertinoIcons.heart : Icons.favorite_border_rounded;
  static IconData get comment => _ios ? CupertinoIcons.chat_bubble : Icons.chat_bubble_outline_rounded;
  static IconData get share => _ios ? CupertinoIcons.square_arrow_up : Icons.send_outlined;
  static IconData get bookmark => _ios ? CupertinoIcons.bookmark_fill : Icons.bookmark_rounded;
  static IconData get bookmarkOutline => _ios ? CupertinoIcons.bookmark : Icons.bookmark_border_rounded;
  static IconData get reminder => _ios ? CupertinoIcons.bell_fill : Icons.notifications_active_outlined;
  static IconData get notifications => _ios ? CupertinoIcons.bell_fill : Icons.notifications_rounded;
  static IconData get follow => _ios ? CupertinoIcons.plus_circle_fill : Icons.person_add_rounded;

  // ─── Actions ────────────────────────────────────────────
  static IconData get edit => _ios ? CupertinoIcons.square_pencil : Icons.edit_rounded;
  static IconData get delete => _ios ? CupertinoIcons.trash_fill : Icons.delete_rounded;
  static IconData get archive => _ios ? CupertinoIcons.archivebox_fill : Icons.archive_rounded;
  static IconData get restore => _ios ? CupertinoIcons.arrow_uturn_left_circle_fill : Icons.restore_rounded;
  static IconData get camera => _ios ? CupertinoIcons.camera_fill : Icons.camera_alt_rounded;
  static IconData get gallery => _ios ? CupertinoIcons.photo_on_rectangle : Icons.photo_library_rounded;
  static IconData get settings => _ios ? CupertinoIcons.gear_alt_fill : Icons.settings_rounded;
  static IconData get location => _ios ? CupertinoIcons.location_fill : Icons.location_on_rounded;
  static IconData get analytics => _ios ? CupertinoIcons.chart_bar_fill : Icons.analytics_rounded;
  static IconData get website => _ios ? CupertinoIcons.compass : Icons.language_rounded;
  static IconData get more => _ios ? CupertinoIcons.ellipsis : Icons.more_horiz_rounded;

  // ─── Menu ───────────────────────────────────────────────
  static IconData get darkMode => _ios ? CupertinoIcons.moon_fill : Icons.dark_mode_rounded;
  static IconData get dashboard => _ios ? CupertinoIcons.square_grid_2x2 : Icons.dashboard_rounded;
  static IconData get help => _ios ? CupertinoIcons.question_circle : Icons.help_outline_rounded;
  static IconData get faq => _ios ? CupertinoIcons.chat_bubble_2 : Icons.question_answer_rounded;
  static IconData get tickets => _ios ? CupertinoIcons.ticket : Icons.confirmation_number_outlined;
  static IconData get logout => _ios ? CupertinoIcons.square_arrow_right : Icons.logout_rounded;
}

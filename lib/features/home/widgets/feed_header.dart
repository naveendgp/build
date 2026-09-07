import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../notifications/providers/notifications_provider.dart';
import 'hamburger_menu_sheet.dart';

/// Floating translucent header with blur, logo, dynamic title, and actions
class FeedHeader extends ConsumerWidget {
  final double scrollOffset;

  const FeedHeader({super.key, this.scrollOffset = 0});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadNotifications = ref.watch(notificationsProvider).unreadCount;
    final opacity = (1.0 - (scrollOffset / 100)).clamp(0.0, 1.0);
    final blurSigma = (scrollOffset / 10).clamp(0.0, 20.0);
    final topPad = MediaQuery.of(context).padding.top;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurSigma + 10, sigmaY: blurSigma + 10),
        child: Container(
          padding: EdgeInsets.only(top: topPad + 8, bottom: 12, left: 20, right: 16),
          decoration: BoxDecoration(
            color: context.colors.background.withValues(alpha: 0.7 + (scrollOffset / 500).clamp(0.0, 0.25)),
            border: Border(bottom: BorderSide(color: context.colors.border, width: 0.5)),
          ),
          child: Row(
            children: [
              // Logo
              Opacity(
                opacity: opacity,
                child: Text(
                  'Lyket',
                  style: AppTypography.titleLarge.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                    color: context.colors.primaryAccent,
                  ),
                ),
              ),
              const Spacer(),
              // Actions
              _HeaderAction(
                icon: Icons.notifications_none_rounded,
                onTap: () => context.push('/notifications'),
                badge: unreadNotifications,
              ),
              const SizedBox(width: 4),
              _HeaderAction(
                icon: Icons.menu_rounded,
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    backgroundColor: Colors.transparent,
                    isScrollControlled: true,
                    builder: (context) => const HamburgerMenuSheet(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderAction extends StatefulWidget {
  final IconData icon;
  final VoidCallback onTap;
  final int? badge;

  const _HeaderAction({required this.icon, required this.onTap, this.badge});

  @override
  State<_HeaderAction> createState() => _HeaderActionState();
}

class _HeaderActionState extends State<_HeaderAction>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 100), vsync: this);
    _scale = Tween(begin: 1.0, end: 0.85).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) { _ctrl.reverse(); widget.onTap(); },
      onTapCancel: () => _ctrl.reverse(),
      child: AnimatedBuilder(
        animation: _scale,
        builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
        child: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: context.colors.surface.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Badge(
              isLabelVisible: widget.badge != null && widget.badge! > 0,
              label: Text(widget.badge != null ? (widget.badge! > 9 ? '9+' : widget.badge.toString()) : ''),
              backgroundColor: Colors.redAccent,
              child: Icon(widget.icon, size: 21, color: context.colors.textSecondary),
            ),
          ),
        ),
      ),
    );
  }
}

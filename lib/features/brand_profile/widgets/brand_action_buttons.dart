import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/brand_profile_models.dart';

class BrandActionButtons extends StatefulWidget {
  final BrandProfile profile;
  final VoidCallback? onFollowToggled;
  final VoidCallback? onMessageTap;
  final VoidCallback? onWebsiteTap;
  final VoidCallback? onShareTap;

  const BrandActionButtons({
    super.key,
    required this.profile,
    this.onFollowToggled,
    this.onMessageTap,
    this.onWebsiteTap,
    this.onShareTap,
  });

  @override
  State<BrandActionButtons> createState() => _BrandActionButtonsState();
}

class _BrandActionButtonsState extends State<BrandActionButtons> {
  late bool isFollowing;

  @override
  void initState() {
    super.initState();
    isFollowing = widget.profile.isFollowing;
  }

  void _toggleFollow() {
    setState(() {
      isFollowing = !isFollowing;
    });
    widget.onFollowToggled?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: context.colors.surface.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: _buildFollowButton(),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  flex: 1,
                  child: _buildActionButton(
                    icon: Icons.chat_bubble_outline_rounded,
                    onTap: widget.onMessageTap ?? () {},
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  flex: 1,
                  child: _buildActionButton(
                    icon: Icons.language_rounded,
                    onTap: widget.onWebsiteTap ?? () {},
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  flex: 1,
                  child: _buildActionButton(
                    icon: Icons.share_rounded,
                    onTap: widget.onShareTap ?? () {},
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFollowButton() {
    return GestureDetector(
      onTap: _toggleFollow,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        height: AppSpacing.buttonHeightSm,
        decoration: BoxDecoration(
          color: isFollowing ? context.colors.textPrimary.withValues(alpha: 0.08) : context.colors.primaryAccent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isFollowing
              ? []
              : [
                  BoxShadow(
                    color: context.colors.primaryAccent.withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        alignment: Alignment.center,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          transitionBuilder: (Widget child, Animation<double> animation) {
            return ScaleTransition(scale: animation, child: child);
          },
          child: Text(
            isFollowing ? 'Following' : 'Follow',
            key: ValueKey<bool>(isFollowing),
            style: AppTypography.buttonSmall.copyWith(
              color: isFollowing ? context.colors.textPrimary : Colors.white,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: AppSpacing.buttonHeightSm,
        decoration: BoxDecoration(
          color: context.colors.textPrimary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.center,
        child: Icon(
          icon,
          color: context.colors.textPrimary,
          size: 20,
        ),
      ),
    );
  }
}

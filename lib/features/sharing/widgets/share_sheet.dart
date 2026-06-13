import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/haptics.dart';
import '../../home/models/feed_models.dart';
import '../services/share_service.dart';
import 'social_destination_button.dart';

/// Premium glassmorphic share sheet — luxury content distribution experience.
///
/// Call `ShareSheet.show(context, post)` from any share entry point.
class ShareSheet extends StatefulWidget {
  final FeedPost post;

  const ShareSheet({super.key, required this.post});

  /// Show the share sheet as a modal bottom sheet.
  static void show(BuildContext context, FeedPost post) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      barrierColor: Colors.black.withValues(alpha: 0.5),
      builder: (_) => ShareSheet(post: post),
    );
  }

  @override
  State<ShareSheet> createState() => _ShareSheetState();
}

class _ShareSheetState extends State<ShareSheet>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  late Animation<double> _slideAnim;
  late Animation<double> _fadeAnim;
  bool _linkCopied = false;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _slideAnim = Tween<double>(begin: 80, end: 0).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic),
    );
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animCtrl, curve: const Interval(0.1, 1.0)),
    );
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleCopyLink() async {
    Haptics.medium();
    final success = await ShareService.copyLink(widget.post.id);
    if (success && mounted) {
      setState(() => _linkCopied = true);
      // Reset after 2s
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _linkCopied = false);
      });
    }
  }

  void _handleNativeShare() {
    Haptics.light();
    Navigator.pop(context);
    ShareService.nativeShare(
      postId: widget.post.id,
      title: widget.post.title,
      brandName: widget.post.brandName,
    );
  }

  void _handleSocialTap(Future<bool> Function() action) async {
    Navigator.pop(context);
    final success = await action();
    if (!success) {
      // Fallback: copy link
      await ShareService.copyLink(widget.post.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final bottomPad = MediaQuery.of(context).viewPadding.bottom;

    return AnimatedBuilder(
      animation: _animCtrl,
      builder: (_, _) => Transform.translate(
        offset: Offset(0, _slideAnim.value),
        child: Opacity(
          opacity: _fadeAnim.value,
          child: _buildContent(context, post, bottomPad),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, FeedPost post, double bottomPad) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: context.colors.card.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: context.colors.borderLight.withValues(alpha: 0.4),
          width: 0.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 40,
            offset: const Offset(0, -12),
            spreadRadius: -8,
          ),
        ],
      ),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ─── Drag handle ───
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: context.colors.textTertiary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),

            // ─── Header — post preview ───
            _buildHeader(context, post),
            const SizedBox(height: 20),

            // ─── Divider ───
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              height: 0.5,
              color: context.colors.border.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 20),

            // ─── Primary actions ───
            _buildPrimaryActions(context),
            const SizedBox(height: 24),

            // ─── Social destinations ───
            _buildSocialGrid(context, post),
            SizedBox(height: 16 + bottomPad),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, FeedPost post) {
    final mediaUrl = ApiClient.resolveMediaUrl(post.mediaUrl);
    final avatarUrl = ApiClient.resolveMediaUrl(post.brandAvatar);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          // Post thumbnail
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 64,
              height: 64,
              child: mediaUrl.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: mediaUrl,
                      fit: BoxFit.cover,
                      memCacheWidth: 200,
                      placeholder: (_, _) => Container(color: context.colors.surface),
                      errorWidget: (_, _, _) => Container(
                        color: context.colors.surface,
                        child: Icon(Icons.image_outlined, color: context.colors.textTertiary, size: 24),
                      ),
                    )
                  : Container(
                      color: context.colors.surface,
                      child: Icon(Icons.image_outlined, color: context.colors.textTertiary, size: 24),
                    ),
            ),
          ),
          const SizedBox(width: 14),

          // Post info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Share Post',
                  style: AppTypography.labelSmall.copyWith(
                    color: context.colors.textTertiary,
                    fontSize: 11,
                    letterSpacing: 0.8,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  post.title,
                  style: AppTypography.titleSmall.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    // Brand avatar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: avatarUrl.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: avatarUrl,
                                fit: BoxFit.cover,
                                memCacheWidth: 60,
                                errorWidget: (_, _, _) => Container(
                                  color: context.colors.surface,
                                  child: Icon(Icons.business, size: 10, color: context.colors.textTertiary),
                                ),
                              )
                            : Container(
                                color: context.colors.surface,
                                child: Icon(Icons.business, size: 10, color: context.colors.textTertiary),
                              ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        post.brandName,
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.textSecondary,
                          fontSize: 12,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (post.isVerified) ...[
                      const SizedBox(width: 4),
                      Icon(Icons.verified_rounded, size: 13, color: context.colors.primaryAccent),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrimaryActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          // Copy Link button
          Expanded(
            child: _PrimaryActionButton(
              icon: _linkCopied ? Icons.check_rounded : Icons.link_rounded,
              label: _linkCopied ? 'Copied!' : 'Copy Link',
              isSuccess: _linkCopied,
              onTap: _handleCopyLink,
            ),
          ),
          const SizedBox(width: 12),
          // Native Share button
          Expanded(
            child: _PrimaryActionButton(
              icon: Icons.ios_share_rounded,
              label: 'Share More',
              onTap: _handleNativeShare,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialGrid(BuildContext context, FeedPost post) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Wrap(
        alignment: WrapAlignment.center,
        spacing: 4,
        runSpacing: 16,
        children: [
          SocialDestinationButton(
            icon: Icons.chat_rounded,
            label: 'WhatsApp',
            color: const Color(0xFF25D366),
            onTap: () => _handleSocialTap(
              () => ShareService.shareToWhatsApp(post.id, post.title),
            ),
          ),
          SocialDestinationButton(
            icon: Icons.camera_alt_rounded,
            label: 'Instagram',
            color: const Color(0xFFE1306C),
            onTap: () => _handleSocialTap(
              () => ShareService.shareToInstagram(post.id, post.title),
            ),
          ),
          SocialDestinationButton(
            icon: Icons.send_rounded,
            label: 'Telegram',
            color: const Color(0xFF0088CC),
            onTap: () => _handleSocialTap(
              () => ShareService.shareToTelegram(post.id, post.title),
            ),
          ),
          SocialDestinationButton(
            icon: Icons.tag_rounded,
            label: 'X',
            color: context.colors.textPrimary,
            onTap: () => _handleSocialTap(
              () => ShareService.shareToX(post.id, post.title),
            ),
          ),
          SocialDestinationButton(
            icon: Icons.facebook_rounded,
            label: 'Facebook',
            color: const Color(0xFF1877F2),
            onTap: () => _handleSocialTap(
              () => ShareService.shareToFacebook(post.id),
            ),
          ),
          SocialDestinationButton(
            icon: Icons.email_outlined,
            label: 'Email',
            color: const Color(0xFFEA4335),
            onTap: () => _handleSocialTap(
              () => ShareService.shareToEmail(post.id, post.title, post.brandName),
            ),
          ),
          SocialDestinationButton(
            icon: Icons.sms_outlined,
            label: 'SMS',
            color: const Color(0xFF34C759),
            onTap: () => _handleSocialTap(
              () => ShareService.shareToSMS(post.id, post.title),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Primary Action Button ───────────────────────────────────────────────────

class _PrimaryActionButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isSuccess;

  const _PrimaryActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isSuccess = false,
  });

  @override
  State<_PrimaryActionButton> createState() => _PrimaryActionButtonState();
}

class _PrimaryActionButtonState extends State<_PrimaryActionButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scale = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) => _ctrl.reverse(),
      onTapCancel: () => _ctrl.reverse(),
      onTap: () {
        Haptics.light();
        widget.onTap();
      },
      child: AnimatedBuilder(
        animation: _scale,
        builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          height: AppSpacing.buttonHeightSm,
          decoration: BoxDecoration(
            color: widget.isSuccess
                ? const Color(0xFF22C55E).withValues(alpha: 0.15)
                : context.colors.surface,
            borderRadius: AppSpacing.borderRadiusLg,
            border: Border.all(
              color: widget.isSuccess
                  ? const Color(0xFF22C55E).withValues(alpha: 0.4)
                  : context.colors.border,
              width: 0.5,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, anim) =>
                    ScaleTransition(scale: anim, child: child),
                child: Icon(
                  widget.icon,
                  key: ValueKey(widget.icon),
                  size: 18,
                  color: widget.isSuccess
                      ? const Color(0xFF22C55E)
                      : context.colors.textPrimary,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                widget.label,
                style: AppTypography.labelLarge.copyWith(
                  color: widget.isSuccess
                      ? const Color(0xFF22C55E)
                      : context.colors.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/message_models.dart';

class ChatHeader extends StatelessWidget {
  /// Whether I have blocked the other side; the menu reads Unblock then.
  final bool isBlocked;

  /// Opens the ⋯ menu's only entry. Null hides the menu.
  final VoidCallback? onBlockToggle;

  final ChatParticipant participant;

  const ChatHeader({
    super.key,
    required this.participant,
    this.isBlocked = false,
    this.onBlockToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + AppSpacing.sm,
        bottom: AppSpacing.sm,
        left: AppSpacing.sm,
        right: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: context.colors.background.withValues(alpha: 0.9),
        border: Border(bottom: BorderSide(color: context.colors.border, width: 0.5)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              color: context.colors.textPrimary,
              size: 22,
            ),
          ),
          SizedBox(width: AppSpacing.xs),

          // Avatar
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: context.colors.borderLight, width: 1),
              image: participant.avatarUrl != null
                  ? DecorationImage(
                      image: CachedNetworkImageProvider(participant.avatarUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: participant.avatarUrl == null
                ? Icon(Icons.person, color: context.colors.textTertiary, size: 20)
                : null,
          ),
          SizedBox(width: AppSpacing.md),

          // Name and Status
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        participant.name,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: context.colors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (participant.isBrand) ...[
                      SizedBox(width: 4),
                      Icon(Icons.verified_rounded, size: 16, color: Colors.red),
                    ],
                  ],
                ),
                Text(
                  participant.isOnline ? 'Active now' : (participant.category ?? 'Offline'),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: participant.isOnline
                        ? context.colors.success
                        : context.colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          if (onBlockToggle != null)
            IconButton(
              tooltip: isBlocked ? 'Unblock' : 'Block',
              icon: Icon(Icons.more_vert_rounded, color: context.colors.textSecondary, size: 22),
              onPressed: () async {
                final choice = await showModalBottomSheet<bool>(
                  context: context,
                  backgroundColor: context.colors.card,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  builder: (sheetContext) => SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(height: 12),
                        Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: context.colors.border,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(height: 12),
                        ListTile(
                          leading: Icon(
                            isBlocked ? Icons.lock_open_rounded : Icons.block_outlined,
                            color: isBlocked ? context.colors.textPrimary : context.colors.error,
                          ),
                          title: Text(
                            isBlocked ? 'Unblock ${participant.name}' : 'Block ${participant.name}',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: isBlocked ? context.colors.textPrimary : context.colors.error,
                            ),
                          ),
                          onTap: () => Navigator.pop(sheetContext, true),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                );
                if (choice == true) onBlockToggle!();
              },
            ),
        ],
      ),
    );
  }
}

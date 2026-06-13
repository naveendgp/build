import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/message_models.dart';
import 'package:timeago/timeago.dart' as timeago;

class ChatListCard extends StatelessWidget {
  final Conversation conversation;

  const ChatListCard({super.key, required this.conversation});

  @override
  Widget build(BuildContext context) {
    final participant = conversation.otherParticipant;
    final lastMessage = conversation.lastMessage;
    final isUnread = conversation.unreadCount > 0;

    return GestureDetector(
      onTap: () => context.push('/messages/${conversation.id}'),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: context.colors.background,
          border: Border(
            bottom: BorderSide(
              color: context.colors.border,
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          children: [
            // Avatar with online indicator
            Stack(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: context.colors.borderLight,
                      width: 1,
                    ),
                    image: participant.avatarUrl != null
                        ? DecorationImage(
                            image: CachedNetworkImageProvider(participant.avatarUrl!),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: participant.avatarUrl == null
                      ? Icon(Icons.person, color: context.colors.textTertiary)
                      : null,
                ),
                if (participant.isOnline)
                  Positioned(
                    bottom: 2,
                    right: 2,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: context.colors.success,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: context.colors.background,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(width: AppSpacing.md),
            
            // Text Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                participant.name,
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: isUnread ? FontWeight.w700 : FontWeight.w600,
                                  color: context.colors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (participant.isBrand) ...[
                              SizedBox(width: 4),
                              Icon(
                                Icons.verified_rounded,
                                size: 14,
                                color: context.colors.primaryAccent,
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (lastMessage != null)
                        Text(
                          timeago.format(lastMessage.createdAt, locale: 'en_short'),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: isUnread ? FontWeight.w600 : FontWeight.w500,
                            color: isUnread ? context.colors.primaryAccent : context.colors.textTertiary,
                          ),
                        ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          lastMessage?.content ?? 'No messages yet',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: isUnread ? FontWeight.w600 : FontWeight.w400,
                            color: isUnread ? context.colors.textPrimary : context.colors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isUnread) ...[
                        SizedBox(width: 8),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: context.colors.primaryAccent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            conversation.unreadCount > 99 ? '99+' : conversation.unreadCount.toString(),
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/message_models.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMe;

  const MessageBubble({super.key, required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    final timeString = DateFormat('h:mm a').format(message.createdAt.toLocal());

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Flexible(
            child: Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
              padding: const EdgeInsets.only(
                left: 12,
                right: 12,
                top: 8,
                bottom: 4, // tight bottom padding for timestamp
              ),
              decoration: BoxDecoration(
                color: isMe ? context.colors.primaryAccent : context.colors.card,
                borderRadius: BorderRadius.circular(AppSpacing.radiusXl).copyWith(
                  bottomRight: isMe ? const Radius.circular(4) : null,
                  bottomLeft: !isMe ? const Radius.circular(4) : null,
                ),
                border: isMe ? null : Border.all(color: context.colors.borderLight),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Flexible(child: _buildContent(context)),
                  const SizedBox(width: 8),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2), // slightly align with baseline
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          timeString,
                          style: TextStyle(
                            fontSize: 10,
                            color: isMe ? Colors.white70 : context.colors.textSecondary,
                          ),
                        ),
                        if (isMe) ...[
                          const SizedBox(width: 4),
                          Icon(
                            Icons.done_all,
                            size: 14,
                            color: message.isRead ? const Color(0xFF34B7F1) : Colors.white70,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    switch (message.type) {
      case MessageType.text:
        return Text(
          message.content,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w400,
            color: isMe ? Colors.white : context.colors.textPrimary,
            height: 1.4,
          ),
        );
      case MessageType.image:
        // Placeholder for image handling
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              child: Image.network(
                message.metadata?['url'] ?? '',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => const SizedBox(
                  height: 150,
                  child: Center(child: Icon(Icons.broken_image, color: Colors.white54)),
                ),
              ),
            ),
            if (message.content.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                message.content,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  color: isMe ? Colors.white : context.colors.textPrimary,
                ),
              ),
            ],
          ],
        );
      default:
        return Text(
          'Unsupported message format',
          style: GoogleFonts.inter(
            color: isMe ? Colors.white70 : context.colors.textSecondary,
            fontStyle: FontStyle.italic,
          ),
        );
    }
  }
}

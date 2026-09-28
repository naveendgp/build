import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/support_models.dart';
import '../providers/support_provider.dart';

final ticketDetailProvider = FutureProvider.family.autoDispose<SupportTicket, String>((ref, id) {
  return ref.watch(supportApiClientProvider).getTicketById(id);
});

class TicketDetailScreen extends ConsumerWidget {
  final String ticketId;
  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketAsync = ref.watch(ticketDetailProvider(ticketId));

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Ticket Details',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ticketAsync.when(
        loading: () => const Center(child: CircularProgressIndicator.adaptive()),
        error: (err, stack) => Center(child: Text('Failed to load ticket', style: AppTypography.bodyMedium.copyWith(color: context.colors.error))),
        data: (ticket) => SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context, ticket),
              const SizedBox(height: 32),
              Text(
                'Description',
                style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.colors.borderLight),
                ),
                child: Text(
                  ticket.message,
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                ),
              ),
              if (ticket.attachments.isNotEmpty) ...[
                const SizedBox(height: 32),
                Text(
                  'Attachments',
                  style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: ticket.attachments.map((url) {
                    return Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: context.colors.borderLight),
                        image: DecorationImage(
                          image: NetworkImage(url),
                          fit: BoxFit.cover,
                        ),
                      ),
                    );
                  }).toList(),
                )
              ]
            ],
          ),
        ),
      ),
      bottomNavigationBar: ticketAsync.hasValue && ticketAsync.value!.conversation != null
          ? Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.colors.surface,
                border: Border(top: BorderSide(color: context.colors.borderLight)),
              ),
              child: ElevatedButton.icon(
                onPressed: () {
                  context.push('/messages/${ticketAsync.value!.conversation!['id']}');
                },
                icon: const Icon(Icons.chat_bubble_outline_rounded, color: Colors.white),
                label: Text('Open Support Chat', style: AppTypography.titleMedium.copyWith(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.colors.primaryAccent,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildHeader(BuildContext context, SupportTicket ticket) {
    final isResolved = ticket.status == 'RESOLVED' || ticket.status == 'CLOSED';
    final statusColor = isResolved ? context.colors.success : context.colors.warning;
    
    Color priorityColor;
    switch(ticket.priority.toLowerCase()) {
      case 'urgent': priorityColor = context.colors.error; break;
      case 'high': priorityColor = context.colors.warning; break;
      case 'medium': priorityColor = Colors.blue; break;
      case 'low': priorityColor = context.colors.textSecondary; break;
      default: priorityColor = context.colors.primaryAccent;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '#${ticket.id.substring(0, 8).toUpperCase()}',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary, fontWeight: FontWeight.bold),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                ticket.status,
                style: AppTypography.labelMedium.copyWith(color: statusColor, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          ticket.subject,
          style: AppTypography.titleLarge.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            _buildBadge(context, ticket.ticketType, Icons.category_rounded, context.colors.primaryAccent),
            const SizedBox(width: 12),
            _buildBadge(context, ticket.priority.toUpperCase(), Icons.flag_rounded, priorityColor),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          'Created on ${_formatDate(ticket.createdAt)}',
          style: AppTypography.labelMedium.copyWith(color: context.colors.textTertiary),
        ),
      ],
    );
  }

  Widget _buildBadge(BuildContext context, String text, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: context.colors.surface,
        border: Border.all(color: context.colors.borderLight),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: AppTypography.labelMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}

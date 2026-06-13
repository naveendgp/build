import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/glass_scaffold.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/haptics.dart';
import '../../messaging/screens/chat_screen.dart';

// â”€â”€â”€ My Tickets Provider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
final myTicketsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final res = await apiClient.dio.get('/support/tickets/my');
  if (res.statusCode == 200 && res.data is List) {
    return (res.data as List).cast<Map<String, dynamic>>();
  }
  return [];
});

class HelpSupportScreen extends ConsumerStatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  ConsumerState<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends ConsumerState<HelpSupportScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      title: 'Help & Support',
      body: Column(
        children: [
          // Tab Bar
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFF1B1D22).withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: ThemeTokens.primaryAccent,
                borderRadius: BorderRadius.circular(12),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white.withValues(alpha: 0.4),
              labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
              tabs: const [
                Tab(text: 'FAQ'),
                Tab(text: 'Contact Us'),
                Tab(text: 'My Tickets'),
              ],
            ),
          ),
          // Tab Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              physics: const BouncingScrollPhysics(),
              children: [
                _FAQTab(),
                _ContactTab(ref: ref),
                _MyTicketsTab(ref: ref),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ FAQ TAB Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
class _FAQTab extends StatelessWidget {
  static const _faqs = [
    {
      'q': 'What is Lyket?',
      'a': 'Lyket is a premium social commerce platform that connects brands with their audience through engaging content, lead generation, and community building.',
    },
    {
      'q': 'How do I switch between User and Brand accounts?',
      'a': 'Go to Settings > Account & Profile. If you have a brand account linked, you can toggle between your personal and brand profiles from the hamburger menu.',
    },
    {
      'q': 'How do I create a post?',
      'a': 'Tap the "+" button on the home screen. Choose your media, add a title, description, and tags. You can also set a campaign objective for your post.',
    },
    {
      'q': 'How does the QuickSite work?',
      'a': 'QuickSite is a mini-website for brands. It auto-generates from your brand profile, including your about section, services, contact info, and social links. Edit these from Brand Operations in Settings.',
    },
    {
      'q': 'How can I manage my leads?',
      'a': 'Navigate to the Lead Center from your brand profile. You can view, filter, and manage all leads collected from your posts and forms.',
    },
    {
      'q': 'Is my data secure?',
      'a': 'Yes. We use industry-standard encryption and secure authentication. Your personal data is never shared without your explicit consent. Review our Privacy Policy for full details.',
    },
    {
      'q': 'How do I report a bug?',
      'a': 'Head to the "Contact Us" tab and submit a support ticket with type "Bug Report". Include screenshots if possible Ã¢â‚¬â€ it helps us fix issues faster.',
    },
    {
      'q': 'Can I delete my account?',
      'a': 'Yes. Go to Settings > Account & Profile and scroll to the bottom. You\'ll find the account deletion option there. This action is irreversible.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
      itemCount: _faqs.length,
      itemBuilder: (context, index) {
        final faq = _faqs[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: const Color(0xFF1B1D22).withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
          ),
          child: Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
              childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 16),
              iconColor: ThemeTokens.primaryAccent,
              collapsedIconColor: Colors.white.withValues(alpha: 0.3),
              title: Text(
                faq['q']!,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
              children: [
                Text(
                  faq['a']!,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 13,
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ CONTACT / CREATE TICKET TAB Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
class _ContactTab extends StatefulWidget {
  final WidgetRef ref;
  const _ContactTab({required this.ref});

  @override
  State<_ContactTab> createState() => _ContactTabState();
}

class _ContactTabState extends State<_ContactTab> {
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  String _ticketType = 'SUPPORT';
  String _priority = 'medium';
  bool _isSubmitting = false;
  bool _isSubmitted = false;

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_subjectController.text.trim().isEmpty || _messageController.text.trim().isEmpty) return;

    Haptics.selection();
    setState(() => _isSubmitting = true);

    try {
      final apiClient = widget.ref.read(apiClientProvider);
      final res = await apiClient.dio.post('/support/tickets', data: {
        'subject': _subjectController.text.trim(),
        'message': _messageController.text.trim(),
        'ticketType': _ticketType,
        'priority': _priority,
      });

      if (res.statusCode == 201 || res.statusCode == 200) {
        setState(() {
          _isSubmitted = true;
          _isSubmitting = false;
        });
        // Refresh tickets list
        widget.ref.invalidate(myTicketsProvider);
      } else {
        throw Exception('Failed');
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to submit ticket. Please try again.'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
  }

  void _reset() {
    setState(() {
      _isSubmitted = false;
      _subjectController.clear();
      _messageController.clear();
      _ticketType = 'SUPPORT';
      _priority = 'medium';
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isSubmitted) {
      return _buildSubmittedView();
    }
    return _buildForm();
  }

  Widget _buildSubmittedView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.3)),
              ),
              child: const Icon(Icons.mark_email_read_outlined, color: Color(0xFF22C55E), size: 40),
            ),
            const SizedBox(height: 24),
            const Text(
              'Ticket Submitted!',
              style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(
              'Our team will get back to you within 24 hours.\nYou can track your ticket in the "My Tickets" tab.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 28),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildSmallButton('New Ticket', Icons.add_rounded, _reset),
                const SizedBox(width: 12),
                _buildSmallButton('Email Us', Icons.email_outlined, () async {
                  final uri = Uri.parse('mailto:support@lyket.in');
                  try { await launchUrl(uri); } catch (_) {}
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallButton(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white.withValues(alpha: 0.7), size: 18),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildForm() {
    final bool canSubmit =
        _subjectController.text.trim().isNotEmpty && _messageController.text.trim().isNotEmpty;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick Contact Options
          SizedBox(
            width: double.infinity,
            child: _buildQuickAction(
              icon: Icons.email_outlined,
              label: 'Email Us',
              color: ThemeTokens.primaryAccent,
              onTap: () async {
                final uri = Uri.parse('mailto:support@lyket.in');
                try { await launchUrl(uri); } catch (_) {}
              },
            ),
          ),
          const SizedBox(height: 24),

          // Divider
          Row(
            children: [
              Expanded(child: Container(height: 1, color: Colors.white.withValues(alpha: 0.06))),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Text('or submit a ticket', style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 12)),
              ),
              Expanded(child: Container(height: 1, color: Colors.white.withValues(alpha: 0.06))),
            ],
          ),
          const SizedBox(height: 24),

          // Ticket Type
          const Text('Ticket Type', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildTypeChip('SUPPORT', 'General Support', Icons.headset_mic_outlined),
              const SizedBox(width: 10),
              _buildTypeChip('BUG', 'Bug Report', Icons.bug_report_outlined),
            ],
          ),
          const SizedBox(height: 22),

          // Priority
          const Text('Priority', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildPriorityChip('low', 'Low', const Color(0xFF22C55E)),
              const SizedBox(width: 8),
              _buildPriorityChip('medium', 'Medium', const Color(0xFFFFB84D)),
              const SizedBox(width: 8),
              _buildPriorityChip('high', 'High', const Color(0xFFFF6B8A)),
              const SizedBox(width: 8),
              _buildPriorityChip('urgent', 'Urgent', Colors.redAccent),
            ],
          ),
          const SizedBox(height: 22),

          // Subject
          const Text('Subject', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 10),
          _buildTextField(_subjectController, 'Brief summary of your issue', maxLines: 1),
          const SizedBox(height: 22),

          // Message
          const Text('Describe Your Issue', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 10),
          _buildTextField(
            _messageController,
            'Tell us what happened, what you expected, and any steps to reproduce the issue...',
            maxLines: 6,
          ),
          const SizedBox(height: 28),

          // Submit
          GestureDetector(
            onTap: canSubmit && !_isSubmitting ? _submit : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: canSubmit ? ThemeTokens.primaryAccent : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                boxShadow: canSubmit
                    ? [BoxShadow(color: ThemeTokens.primaryAccent.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 6))]
                    : [],
              ),
              alignment: Alignment.center,
              child: _isSubmitting
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.send_rounded, color: canSubmit ? Colors.white : Colors.white.withValues(alpha: 0.3), size: 20),
                        const SizedBox(width: 10),
                        Text(
                          'Submit Ticket',
                          style: TextStyle(
                            color: canSubmit ? Colors.white : Colors.white.withValues(alpha: 0.3),
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
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

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeChip(String value, String label, IconData icon) {
    final isSelected = _ticketType == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          Haptics.selection();
          setState(() => _ticketType = value);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected
                ? ThemeTokens.primaryAccent.withValues(alpha: 0.12)
                : const Color(0xFF1B1D22).withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? ThemeTokens.primaryAccent.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.06),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isSelected ? ThemeTokens.primaryAccent : Colors.white.withValues(alpha: 0.4)),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? ThemeTokens.primaryAccent : Colors.white.withValues(alpha: 0.5),
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriorityChip(String value, String label, Color color) {
    final isSelected = _priority == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          Haptics.selection();
          setState(() => _priority = value);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? color.withValues(alpha: 0.12) : const Color(0xFF1B1D22).withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.06),
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? color : Colors.white.withValues(alpha: 0.4),
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        minLines: maxLines > 1 ? 3 : 1,
        onChanged: (_) => setState(() {}),
        style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.5),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.2)),
          border: InputBorder.none,
          filled: false,
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ MY TICKETS TAB Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
class _MyTicketsTab extends StatelessWidget {
  final WidgetRef ref;
  const _MyTicketsTab({required this.ref});

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'OPEN':
      case 'PENDING':
        return const Color(0xFFFFB84D);
      case 'IN_PROGRESS':
      case 'ACCEPTED':
        return const Color(0xFF00C2FF);
      case 'RESOLVED':
      case 'COMPLETED':
        return const Color(0xFF22C55E);
      case 'CLOSED':
      case 'REJECTED':
        return const Color(0xFFA1A1AA);
      default:
        return const Color(0xFFA1A1AA);
    }
  }

  IconData _typeIcon(String type) {
    switch (type.toUpperCase()) {
      case 'BUG':
        return Icons.bug_report_outlined;
      case 'LIVE_CHAT':
        return Icons.chat_outlined;
      default:
        return Icons.headset_mic_outlined;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final dt = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(myTicketsProvider);

    return ticketsAsync.when(
      data: (tickets) {
        if (tickets.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.confirmation_number_outlined, color: Colors.white.withValues(alpha: 0.15), size: 64),
                const SizedBox(height: 16),
                const Text(
                  'No tickets yet',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Text(
                  'When you submit a support ticket,\nit will appear here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 14, height: 1.5),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          color: ThemeTokens.primaryAccent,
          backgroundColor: const Color(0xFF1B1D22),
          onRefresh: () async => ref.invalidate(myTicketsProvider),
          child: ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
            itemCount: tickets.length,
            itemBuilder: (context, index) {
              final ticket = tickets[index];
              final status = (ticket['status'] ?? 'OPEN').toString().toUpperCase();
              final type = (ticket['ticketType'] ?? 'SUPPORT').toString();
              final priority = (ticket['priority'] ?? 'medium').toString();
              final sColor = _statusColor(status);

              return GestureDetector(
                onTap: () {
                  final conv = ticket['conversation'];
                  if (conv != null && conv['id'] != null) {
                    Haptics.selection();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ChatScreen(conversationId: conv['id']),
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Chat thread not available for this ticket yet.', style: TextStyle(color: Colors.white)),
                        backgroundColor: Colors.white.withValues(alpha: 0.1),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1B1D22).withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                    // Header Row
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: sColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(_typeIcon(type), color: sColor, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                ticket['subject'] ?? 'No Subject',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _formatDate(ticket['createdAt']?.toString()),
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.35), fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Message preview
                    Text(
                      ticket['message'] ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 13, height: 1.5),
                    ),
                    const SizedBox(height: 14),

                    // Tags Row
                    Row(
                      children: [
                        _buildTag(status, sColor),
                        const SizedBox(width: 8),
                        _buildTag(type, ThemeTokens.primaryAccent),
                        const SizedBox(width: 8),
                        _buildTag(priority.toUpperCase(), _priorityColor(priority)),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
          ),
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: ThemeTokens.primaryAccent),
      ),
      error: (err, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded, color: Colors.white.withValues(alpha: 0.3), size: 48),
            const SizedBox(height: 12),
            const Text('Failed to load tickets', style: TextStyle(color: Colors.white, fontSize: 16)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => ref.invalidate(myTicketsProvider),
              child: const Text('Tap to retry', style: TextStyle(color: ThemeTokens.primaryAccent, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5),
      ),
    );
  }

  Color _priorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'low':
        return const Color(0xFF22C55E);
      case 'medium':
        return const Color(0xFFFFB84D);
      case 'high':
        return const Color(0xFFFF6B8A);
      case 'urgent':
        return Colors.redAccent;
      default:
        return const Color(0xFFA1A1AA);
    }
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/glass_scaffold.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/haptics.dart';

class FeedbackScreen extends ConsumerStatefulWidget {
  const FeedbackScreen({super.key});

  @override
  ConsumerState<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends ConsumerState<FeedbackScreen>
    with SingleTickerProviderStateMixin {
  String? _selectedType;
  final _contentController = TextEditingController();
  bool _isSubmitting = false;
  bool _isSubmitted = false;
  late AnimationController _checkAnimController;
  late Animation<double> _checkAnim;

  static const _feedbackTypes = [
    {'key': 'love', 'icon': Icons.favorite_rounded, 'label': 'Love It', 'color': Color(0xFFFF6B8A)},
    {'key': 'suggestion', 'icon': Icons.lightbulb_outline_rounded, 'label': 'Suggestion', 'color': Color(0xFFFFB84D)},
    {'key': 'idea', 'icon': Icons.rocket_launch_outlined, 'label': 'Feature Idea', 'color': Color(0xFF7C5CFF)},
    {'key': 'general', 'icon': Icons.chat_bubble_outline_rounded, 'label': 'General', 'color': Color(0xFF00C2FF)},
  ];

  @override
  void initState() {
    super.initState();
    _checkAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _checkAnim = CurvedAnimation(parent: _checkAnimController, curve: Curves.elasticOut);
  }

  @override
  void dispose() {
    _contentController.dispose();
    _checkAnimController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedType == null || _contentController.text.trim().isEmpty) return;

    Haptics.selection();
    setState(() => _isSubmitting = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.post('/feedback', data: {
        'type': _selectedType,
        'content': _contentController.text.trim(),
      });

      if (res.statusCode == 201 || res.statusCode == 200) {
        setState(() {
          _isSubmitted = true;
          _isSubmitting = false;
        });
        _checkAnimController.forward();
      } else {
        throw Exception('Failed');
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to submit feedback. Please try again.'),
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
      _selectedType = null;
      _contentController.clear();
    });
    _checkAnimController.reset();
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      title: 'Feedback',
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 400),
        child: _isSubmitted ? _buildSuccessView() : _buildFormView(),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Center(
      key: const ValueKey('success'),
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ScaleTransition(
              scale: _checkAnim,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF7C5CFF), Color(0xFF00C2FF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF7C5CFF).withValues(alpha: 0.4),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: const Icon(Icons.check_rounded, color: Colors.white, size: 52),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'Thank You! 🎉',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Your feedback helps us make Lyket\nbetter for everyone.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFFA1A1AA),
                fontSize: 16,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 36),
            GestureDetector(
              onTap: _reset,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: const Text(
                  'Send Another',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormView() {
    final bool canSubmit =
        _selectedType != null && _contentController.text.trim().isNotEmpty;

    return SingleChildScrollView(
      key: const ValueKey('form'),
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          // Section Title
          const Text(
            'How are you feeling about Lyket?',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Pick a category that best describes your feedback',
            style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 14),
          ),
          const SizedBox(height: 20),

          // Type Selector Grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.6,
            children: _feedbackTypes.map((type) {
              final isSelected = _selectedType == type['key'];
              final color = type['color'] as Color;

              return GestureDetector(
                onTap: () {
                  Haptics.selection();
                  setState(() => _selectedType = type['key'] as String);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? color.withValues(alpha: 0.15)
                        : const Color(0xFF1B1D22).withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isSelected ? color.withValues(alpha: 0.6) : Colors.white.withValues(alpha: 0.08),
                      width: isSelected ? 1.5 : 1,
                    ),
                    boxShadow: isSelected
                        ? [BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 20, spreadRadius: 2)]
                        : [],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isSelected ? color.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.04),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSelected ? color.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.08),
                          ),
                        ),
                        child: Icon(
                          type['icon'] as IconData,
                          size: 24,
                          color: isSelected ? color : Colors.white.withValues(alpha: 0.6),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        type['label'] as String,
                        style: TextStyle(
                          color: isSelected ? color : Colors.white.withValues(alpha: 0.7),
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 28),

          // Text Input
          const Text(
            'Tell us more',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04), // Matches grid items
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: TextField(
              controller: _contentController,
              maxLines: 6,
              minLines: 4,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.5),
              decoration: InputDecoration(
                hintText: 'Share your thoughts, ideas, or suggestions...',
                hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.25)),
                border: InputBorder.none,
                filled: false,
                contentPadding: const EdgeInsets.all(18),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${_contentController.text.length} / 1000',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.3),
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 28),

          // Submit Button
          GestureDetector(
            onTap: canSubmit && !_isSubmitting ? _submit : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: canSubmit
                    ? const LinearGradient(
                        colors: [Color(0xFF7C5CFF), Color(0xFF6C47FF)],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      )
                    : null,
                color: canSubmit ? null : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                boxShadow: canSubmit
                    ? [BoxShadow(color: const Color(0xFF7C5CFF).withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 6))]
                    : [],
              ),
              alignment: Alignment.center,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : Text(
                      'Submit Feedback',
                      style: TextStyle(
                        color: canSubmit ? Colors.white : Colors.white.withValues(alpha: 0.3),
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

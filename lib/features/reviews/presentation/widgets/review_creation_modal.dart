import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/theme_extensions.dart';
import '../../../../core/theme/build_context_extensions.dart';
import '../../../../core/utils/haptics.dart';
import '../../domain/repositories/review_repository.dart';
import '../providers/review_providers.dart';

class ReviewCreationModal extends ConsumerStatefulWidget {
  final String brandId;
  const ReviewCreationModal({super.key, required this.brandId});

  @override
  ConsumerState<ReviewCreationModal> createState() => _ReviewCreationModalState();
}

class _ReviewCreationModalState extends ConsumerState<ReviewCreationModal> {
  int _rating = 0;
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  bool get _isValid => _rating > 0 && _descController.text.trim().length >= 20;

  Future<void> _submitReview() async {
    if (!_isValid) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final repo = ref.read(reviewRepositoryProvider);
      await repo.addReview(
        widget.brandId,
        _rating.toDouble(),
        _titleController.text.trim().isNotEmpty ? _titleController.text.trim() : null,
        _descController.text.trim(),
      );

      Haptics.medium();
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      Haptics.heavy();
      setState(() {
        _isLoading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1B1D22),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const Text(
            'Write a Review',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Share your experience with this brand',
            style: TextStyle(color: Colors.white70, fontSize: 16),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          
          Flexible(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Star Rating
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return IconButton(
                        onPressed: () {
                          Haptics.selection();
                          setState(() => _rating = index + 1);
                        },
                        icon: Icon(
                          index < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: index < _rating ? const Color(0xFFFFB800) : Colors.white30,
                          size: 40,
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 32),
                  
                  // Title Input
                  TextField(
                    controller: _titleController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Sum up your experience (optional)',
                      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.05),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.all(16),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Description Input
                  TextField(
                    controller: _descController,
                    style: const TextStyle(color: Colors.white),
                    maxLines: 4,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Tell us more about your interaction...',
                      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.05),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.all(16),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
          
          Text(
            'Minimum 20 characters',
            style: TextStyle(
              color: _descController.text.trim().length >= 20
                  ? const Color(0xFF22C55E)
                  : context.colors.textSecondary,
              fontSize: 12,
            ),
            textAlign: TextAlign.right,
          ),
          const SizedBox(height: 32),
          
          // Submit Button
          ElevatedButton(
            onPressed: _isLoading || _rating == 0 || _descController.text.trim().length < 20
                ? null
                : _submitReview,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF0000),
              foregroundColor: Colors.white,
              disabledBackgroundColor: Colors.white.withValues(alpha: 0.1),
              disabledForegroundColor: Colors.white.withValues(alpha: 0.3),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text(
                    'Submit Review',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),
        ],
      ),
    );
  }
}

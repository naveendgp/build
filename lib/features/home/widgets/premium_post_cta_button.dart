import 'package:flutter/material.dart';
import '../../../core/utils/haptics.dart';

class PremiumPostCTAButton extends StatefulWidget {
  final String label;
  final VoidCallback? onTap;

  const PremiumPostCTAButton({super.key, required this.label, this.onTap});

  @override
  State<PremiumPostCTAButton> createState() => _PremiumPostCTAButtonState();
}

class _PremiumPostCTAButtonState extends State<PremiumPostCTAButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      duration: const Duration(milliseconds: 120), 
      vsync: this
    );
    _scale = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut)
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _handleTap() async {
    if (_isLoading || widget.onTap == null) return;
    
    Haptics.selection();
    
    setState(() {
      _isLoading = true;
    });
    
    // Allow the caller to handle the tap. Since onTap is a VoidCallback,
    // we simulate a brief loading state so the user sees feedback.
    // In a real app, onTap might return a Future. Here we just fake a quick delay
    // or we can just run the onTap and remove loading immediately if it's synchronous.
    widget.onTap!();
    
    if (mounted) {
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = const Color(0xFFFF0000);
    final shadowColor = isDark 
        ? const Color(0xFFFF0000).withValues(alpha: 0.25) 
        : const Color(0xFFFF0000).withValues(alpha: 0.15);

    return GestureDetector(
      onTapDown: (_) { if (!_isLoading) _ctrl.forward(); },
      onTapUp: (_) { if (!_isLoading) { _ctrl.reverse(); _handleTap(); } },
      onTapCancel: () { if (!_isLoading) _ctrl.reverse(); },
      child: AnimatedBuilder(
        animation: _scale,
        builder: (context, child) => Transform.scale(
          scale: _scale.value,
          child: child,
        ),
        child: Container(
          width: double.infinity,
          height: 42,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: shadowColor,
                blurRadius: 16,
                offset: const Offset(0, 4),
                spreadRadius: 0,
              ),
            ],
          ),
          child: Stack(
            children: [
              Center(
                child: Text(
                  widget.label,
                  style: const TextStyle(
                    color: Color(0xFFFFFFFF),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
              Positioned(
                right: 16,
                top: 0,
                bottom: 0,
                child: Center(
                  child: _isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(
                          Icons.chevron_right_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

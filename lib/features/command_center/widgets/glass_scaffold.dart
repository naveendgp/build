import 'package:flutter/material.dart';

class GlassScaffold extends StatelessWidget {
  final String title;
  final Widget body;
  final Widget? floatingActionButton;
  final bool showBackButton;

  const GlassScaffold({
    super.key,
    required this.title,
    required this.body,
    this.floatingActionButton,
    this.showBackButton = true,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B), // Deep luxury black
      floatingActionButton: floatingActionButton,
      body: Stack(
        children: [
          // Ambient Glow Background
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF7C5CFF).withValues(alpha: 0.15),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF7C5CFF).withValues(alpha: 0.15),
                    blurRadius: 100,
                    spreadRadius: 100,
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -100,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF00C2FF).withValues(alpha: 0.1),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00C2FF).withValues(alpha: 0.1),
                    blurRadius: 100,
                    spreadRadius: 100,
                  ),
                ],
              ),
            ),
          ),
          
          // Removed noise overlay because programmatic grain causes severe UI thread lag.
          // Fallback to a simple dark gradient overlay for texture.
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withValues(alpha: 0.02),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.2),
                  ],
                ),
              ),
            ),
          ),

          // Main Content
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context),
                Expanded(child: body),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          if (showBackButton)
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
              ),
            ),
          if (showBackButton) const SizedBox(width: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

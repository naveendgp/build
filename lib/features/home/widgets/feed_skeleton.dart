import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/app_theme.dart';

class FeedSkeleton extends StatelessWidget {
  final bool isGrid;

  const FeedSkeleton({super.key, this.isGrid = false});

  @override
  Widget build(BuildContext context) {
    if (isGrid) {
      return GridView.builder(
        padding: const EdgeInsets.only(top: 100, left: 16, right: 16, bottom: 100),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.7,
        ),
        itemCount: 6,
        itemBuilder: (context, index) => _buildGridCard(context),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(top: 100, bottom: 100),
      itemCount: 3,
      itemBuilder: (context, index) => _buildSingleCard(context),
    );
  }

  Widget _buildSingleCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      height: 480,
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFF2A2B2E), width: 0.5),
      ),
      child: Shimmer.fromColors(
        baseColor: context.colors.surface,
        highlightColor: context.colors.surface.withValues(alpha: 0.5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(width: 100, height: 12, color: Colors.white),
                      const SizedBox(height: 6),
                      Container(width: 60, height: 10, color: Colors.white),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 200, height: 14, color: Colors.white),
                  const SizedBox(height: 6),
                  Container(width: 150, height: 12, color: Colors.white),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGridCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF2A2B2E), width: 0.5),
      ),
      child: Shimmer.fromColors(
        baseColor: context.colors.surface,
        highlightColor: context.colors.surface.withValues(alpha: 0.5),
        child: Column(
          children: [
            Expanded(
              flex: 3,
              child: Container(color: Colors.white),
            ),
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: double.infinity, height: 10, color: Colors.white),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          width: 18, height: 18,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(width: 40, height: 8, color: Colors.white),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

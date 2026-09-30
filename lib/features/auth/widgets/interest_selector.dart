import 'package:flutter/material.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/lyket_chip.dart';

/// Interest selection grid for User Signup Step 3
class InterestSelector extends StatelessWidget {
  final Set<String> selectedInterests;
  final ValueChanged<String> onToggle;

  const InterestSelector({super.key, required this.selectedInterests, required this.onToggle});

  static const List<Map<String, dynamic>> interests = [
    {'label': 'Technology', 'icon': Icons.computer_rounded},
    {'label': 'Fashion', 'icon': Icons.checkroom_rounded},
    {'label': 'Food', 'icon': Icons.restaurant_rounded},
    {'label': 'Travel', 'icon': Icons.flight_rounded},
    {'label': 'Fitness', 'icon': Icons.fitness_center_rounded},
    {'label': 'Art', 'icon': Icons.palette_rounded},
    {'label': 'Music', 'icon': Icons.music_note_rounded},
    {'label': 'Photography', 'icon': Icons.camera_alt_rounded},
    {'label': 'Gaming', 'icon': Icons.sports_esports_rounded},
    {'label': 'Business', 'icon': Icons.business_center_rounded},
    {'label': 'Education', 'icon': Icons.school_rounded},
    {'label': 'Lifestyle', 'icon': Icons.spa_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: interests.map((interest) {
        final label = interest['label'] as String;
        return LyketChip(
          label: label,
          icon: interest['icon'] as IconData,
          isSelected: selectedInterests.contains(label),
          onTap: () => onToggle(label),
        );
      }).toList(),
    );
  }
}

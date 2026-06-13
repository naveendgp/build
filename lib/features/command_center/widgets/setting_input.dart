import 'package:flutter/material.dart';

class SettingInput extends StatelessWidget {
  final String label;
  final String? initialValue;
  final String hintText;
  final int maxLines;
  final TextInputType keyboardType;
  final ValueChanged<String>? onChanged;
  final bool readOnly;
  final Widget? prefix;

  const SettingInput({
    super.key,
    required this.label,
    this.initialValue,
    required this.hintText,
    this.maxLines = 1,
    this.keyboardType = TextInputType.text,
    this.onChanged,
    this.readOnly = false,
    this.prefix,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label,
            style: const TextStyle(
              color: Color(0xFFA1A1AA),
              fontSize: 13,
              fontWeight: FontWeight.w500,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF121316).withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
          ),
          child: TextFormField(
            key: ValueKey(initialValue),
            initialValue: initialValue,
            maxLines: maxLines,
            keyboardType: keyboardType,
            readOnly: readOnly,
            style: TextStyle(
              color: readOnly ? Colors.white.withValues(alpha: 0.4) : Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w400,
            ),
            onChanged: readOnly ? null : onChanged,
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: TextStyle(
                color: Colors.white.withValues(alpha: 0.2),
                fontSize: 16,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              prefixIcon: prefix,
              suffixIcon: readOnly
                  ? Icon(Icons.lock_outline, color: Colors.white.withValues(alpha: 0.2), size: 18)
                  : null,
            ),
          ),
        ),
      ],
    );
  }
}

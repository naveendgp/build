import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';

class FaqModel {
  final String id;
  final String question;
  final String answer;
  final String category;
  final int order;

  FaqModel({
    required this.id,
    required this.question,
    required this.answer,
    required this.category,
    required this.order,
  });

  factory FaqModel.fromJson(Map<String, dynamic> json) {
    return FaqModel(
      id: json['id'] as String,
      question: json['question'] as String,
      answer: json['answer'] as String,
      category: json['category'] as String,
      order: json['order'] as int? ?? 0,
    );
  }
}

final faqProvider = FutureProvider<List<FaqModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('/faq');

  if (response.statusCode == 200) {
    final List<dynamic> data = response.data;
    final faqs = data.map((json) => FaqModel.fromJson(json)).toList();
    // Sort by category then order
    faqs.sort((a, b) {
      final catCompare = a.category.compareTo(b.category);
      if (catCompare != 0) return catCompare;
      return a.order.compareTo(b.order);
    });
    return faqs;
  } else {
    throw Exception('Failed to load FAQs');
  }
});

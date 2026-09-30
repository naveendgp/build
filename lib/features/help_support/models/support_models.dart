class SupportTicket {
  final String id;
  final String subject;
  final String message;
  final String priority;
  final String status;
  final String ticketType;
  final List<String> attachments;
  final String? issueType;
  final DateTime createdAt;
  final Map<String, dynamic>? conversation;

  SupportTicket({
    required this.id,
    required this.subject,
    required this.message,
    required this.priority,
    required this.status,
    required this.ticketType,
    required this.attachments,
    this.issueType,
    required this.createdAt,
    this.conversation,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id']?.toString() ?? '',
      subject: json['subject']?.toString() ?? 'No Subject',
      message: json['message']?.toString() ?? 'No Message',
      priority: json['priority']?.toString() ?? 'low',
      status: json['status']?.toString() ?? 'OPEN',
      ticketType: json['ticketType']?.toString() ?? 'SUPPORT',
      attachments: (json['attachments'] as List?)?.map((e) => e.toString()).toList() ?? [],
      issueType: json['issueType']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
      conversation: json['conversation'] as Map<String, dynamic>?,
    );
  }
}

class FaqItem {
  final String id;
  final String question;
  final String answer;
  final String category;

  FaqItem({required this.id, required this.question, required this.answer, required this.category});

  factory FaqItem.fromJson(Map<String, dynamic> json) {
    return FaqItem(
      id: json['id']?.toString() ?? '',
      question: json['question']?.toString() ?? '',
      answer: json['answer']?.toString() ?? '',
      category: json['category']?.toString() ?? 'General',
    );
  }
}

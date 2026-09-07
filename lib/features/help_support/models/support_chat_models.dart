/// Models for the *actual* live-chat system the backend and lyket-web use:
/// SupportRequest (queue) -> approved -> SupportChat + SupportMessage.
/// This is a separate system from the generic SupportTicket/`/support/tickets`
/// flow — LIVE_CHAT tickets there were a legacy path web no longer uses.

class SupportRequestModel {
  final String id;
  final String category;
  final String? description;
  final String status; // PENDING | APPROVED | REJECTED
  final int queuePosition;
  final String? rejectionReason;
  final DateTime createdAt;

  SupportRequestModel({
    required this.id,
    required this.category,
    this.description,
    required this.status,
    required this.queuePosition,
    this.rejectionReason,
    required this.createdAt,
  });

  factory SupportRequestModel.fromJson(Map<String, dynamic> json) {
    return SupportRequestModel(
      id: (json['id'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      description: json['description']?.toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      queuePosition: json['queuePosition'] is int ? json['queuePosition'] : int.tryParse('${json['queuePosition']}') ?? 0,
      rejectionReason: json['rejectionReason']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class SupportChatMessage {
  final String id;
  final String chatId;
  final String senderType; // 'user' | 'admin'
  final String message;
  final List<String> attachments;
  final bool isRead;
  final DateTime createdAt;

  SupportChatMessage({
    required this.id,
    required this.chatId,
    required this.senderType,
    required this.message,
    required this.attachments,
    required this.isRead,
    required this.createdAt,
  });

  bool get isFromAdmin => senderType == 'admin';

  factory SupportChatMessage.fromJson(Map<String, dynamic> json) {
    return SupportChatMessage(
      id: (json['id'] ?? '').toString(),
      chatId: (json['chatId'] ?? '').toString(),
      senderType: (json['senderType'] ?? 'user').toString(),
      message: (json['message'] ?? '').toString(),
      attachments: (json['attachments'] as List?)?.map((e) => e.toString()).toList() ?? [],
      isRead: json['isRead'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class SupportChat {
  final String id;
  final String category;
  final String status; // Open | Closed | Resolved
  final int unreadCount;
  final DateTime updatedAt;
  // From list/inbox/history endpoints: just the latest message (preview).
  // From the single-chat endpoint: the full ordered history.
  final List<SupportChatMessage> messages;

  SupportChat({
    required this.id,
    required this.category,
    required this.status,
    required this.unreadCount,
    required this.updatedAt,
    required this.messages,
  });

  SupportChatMessage? get lastMessage => messages.isNotEmpty ? messages.first : null;
  bool get isOpen => status == 'Open';

  factory SupportChat.fromJson(Map<String, dynamic> json) {
    return SupportChat(
      id: (json['id'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      status: (json['status'] ?? 'Open').toString(),
      unreadCount: json['unreadCount'] is int ? json['unreadCount'] : int.tryParse('${json['unreadCount']}') ?? 0,
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? '') ?? DateTime.now(),
      messages: (json['messages'] as List?)?.map((e) => SupportChatMessage.fromJson(e)).toList() ?? [],
    );
  }
}

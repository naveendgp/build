
enum MessageType {
  text,
  image,
  video,
  link,
  postShare,
  cta,
}

class ChatParticipant {
  final String id;
  final String name;
  final String? avatarUrl;
  final bool isBrand;
  final bool isOnline;
  final String? category; // For brands

  const ChatParticipant({
    required this.id,
    required this.name,
    this.avatarUrl,
    this.isBrand = false,
    this.isOnline = false,
    this.category,
  });

  factory ChatParticipant.fromJson(Map<String, dynamic> json) {
    return ChatParticipant(
      id: json['id'] ?? '',
      name: json['name'] ?? json['username'] ?? json['brandName'] ?? 'Unknown',
      avatarUrl: json['avatarUrl'] ?? json['profilePic'] ?? json['logo'],
      isBrand: json['isBrand'] ?? false,
      isOnline: json['isOnline'] ?? false,
      category: json['category'],
    );
  }
}

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String content; // JSON string if complex
  final DateTime createdAt;
  final bool isRead;
  final MessageType type;

  // Extracted content if it's a special type
  final Map<String, dynamic>? metadata;

  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.createdAt,
    this.isRead = false,
    this.type = MessageType.text,
    this.metadata,
  });

  Message copyWith({
    String? id,
    String? conversationId,
    String? senderId,
    String? content,
    DateTime? createdAt,
    bool? isRead,
    MessageType? type,
    Map<String, dynamic>? metadata,
  }) {
    return Message(
      id: id ?? this.id,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      content: content ?? this.content,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      type: type ?? this.type,
      metadata: metadata ?? this.metadata,
    );
  }

  factory Message.fromJson(Map<String, dynamic> json) {
    // Parse metadata if content is JSON for special types
    Map<String, dynamic>? metadata;
    MessageType type = MessageType.text;
    String content = json['content'] ?? '';

    try {
      if (content.startsWith('{') && content.endsWith('}')) {
        // Highly simplified parser for the demo, normally use dart:convert jsonDecode
        // Assuming backend sends type inside the content if it's complex
        // Actually, we'll just handle it gracefully.
      }
    } catch (_) {}

    return Message(
      id: json['id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      senderId: json['senderUserId'] ?? json['senderBrandId'] ?? '',
      content: content,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      isRead: json['isRead'] ?? false,
      type: type,
      metadata: metadata,
    );
  }
}

class Conversation {
  final String id;
  final ChatParticipant otherParticipant;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;
  final bool isRequest; // true if the user hasn't accepted it yet

  const Conversation({
    required this.id,
    required this.otherParticipant,
    this.lastMessage,
    this.unreadCount = 0,
    required this.updatedAt,
    this.isRequest = false,
  });

  factory Conversation.fromJson(Map<String, dynamic> json, String currentUserId) {
    // Be robust against different backend versions
    Map<String, dynamic>? participantJson;
    if (json['participant'] != null) {
      participantJson = json['participant'] as Map<String, dynamic>;
    } else if (json['otherParticipant'] != null) {
      participantJson = json['otherParticipant'] as Map<String, dynamic>;
    } else if (json['participants'] != null && json['participants'] is List && (json['participants'] as List).isNotEmpty) {
      final list = json['participants'] as List;
      // try to find the one that is not current user
      participantJson = list.firstWhere((p) => p['userId'] != currentUserId && p['brandId'] != currentUserId, orElse: () => list.first) as Map<String, dynamic>;
    }
    
    final lastMessageJson = json['lastMessage'] as Map<String, dynamic>?;
    Message? lastMsg;
    if (lastMessageJson != null) {
      lastMsg = Message.fromJson(lastMessageJson);
    }

    bool isBrand = false;
    if (participantJson != null) {
      if (participantJson['type'] == 'BRAND' || participantJson.containsKey('logoUrl') || participantJson.containsKey('lastLogin')) {
        isBrand = true;
      }
      participantJson['isBrand'] = isBrand;
    }

    return Conversation(
      id: json['conversationId'] ?? json['id'] ?? '',
      otherParticipant: participantJson != null 
          ? ChatParticipant.fromJson(participantJson)
          : const ChatParticipant(id: 'unknown', name: 'Unknown User'),
      lastMessage: lastMsg,
      unreadCount: json['unreadCount'] ?? 0,
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
      isRequest: json['isRequest'] ?? false,
    );
  }

  Conversation copyWith({
    String? id,
    ChatParticipant? otherParticipant,
    Message? lastMessage,
    int? unreadCount,
    DateTime? updatedAt,
    bool? isRequest,
  }) {
    return Conversation(
      id: id ?? this.id,
      otherParticipant: otherParticipant ?? this.otherParticipant,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      updatedAt: updatedAt ?? this.updatedAt,
      isRequest: isRequest ?? this.isRequest,
    );
  }
}

class SmartCtaData {
  final String title;
  final String subtitle;
  final String buttonText;
  final String actionUrl;
  final String? imageUrl;

  const SmartCtaData({
    required this.title,
    required this.subtitle,
    required this.buttonText,
    required this.actionUrl,
    this.imageUrl,
  });
}

import '../../../core/network/api_client.dart';

enum MessageType { text, image, video, link, postShare, cta }

bool _parseBool(dynamic val) {
  if (val == null) return false;
  if (val is bool) return val;
  if (val is String) return val.toLowerCase() == 'true' || val == '1';
  if (val is num) return val > 0;
  return false;
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
      id: json['id']?.toString() ?? '',
      name: (json['name'] ?? json['username'] ?? json['brandName'] ?? 'Unknown').toString(),
      // Brands come back with logoUrl, people with profilePic, and the
      // socket payload uses avatarUrl. A relative path needs resolving, and
      // an empty string has to read as "no picture" so the default shows.
      avatarUrl: _parseAvatar(json),
      isBrand: _parseBool(json['isBrand']),
      isOnline: _parseBool(json['isOnline']),
      category: json['category']?.toString(),
    );
  }
}

String? _parseAvatar(Map<String, dynamic> json) {
  for (final key in ['avatarUrl', 'profilePic', 'profilePicture', 'logoUrl', 'logo', 'image']) {
    final raw = json[key]?.toString().trim();
    if (raw != null && raw.isNotEmpty) return ApiClient.resolveMediaUrl(raw);
  }
  return null;
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
      id: json['id']?.toString() ?? '',
      conversationId: json['conversationId']?.toString() ?? '',
      senderId:
          (json['senderId'] ?? json['senderUserId'] ?? json['senderBrandId'])?.toString() ?? '',
      content: content,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      isRead: _parseBool(json['isRead']),
      type: type,
      metadata: metadata,
    );
  }
}

class Conversation {
  final String id;

  /// A thread with support rather than with a brand or a person. These belong
  /// in Help & Support, not in the inbox.
  final bool isSupportChat;

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
    this.isSupportChat = false,
  });

  factory Conversation.fromJson(Map<String, dynamic> json, String currentUserId) {
    // Be robust against different backend versions
    Map<String, dynamic>? participantJson;
    if (json['participant'] != null) {
      participantJson = json['participant'] as Map<String, dynamic>;
    } else if (json['otherParticipant'] != null) {
      participantJson = json['otherParticipant'] as Map<String, dynamic>;
    } else if (json['participants'] != null &&
        json['participants'] is List &&
        (json['participants'] as List).isNotEmpty) {
      final list = json['participants'] as List;
      // try to find the one that is not current user
      try {
        participantJson =
            list.firstWhere(
                  (p) =>
                      p['userId']?.toString() != currentUserId &&
                      p['brandId']?.toString() != currentUserId,
                )
                as Map<String, dynamic>;
      } catch (e) {
        // If we only found ourselves (like in a new support ticket), don't set participantJson to ourselves.
        // Leave it null so we can fall back to a "Lyket Support" default for support chats.
        participantJson = null;
      }
    }

    final lastMessageJson = json['lastMessage'] as Map<String, dynamic>?;
    Message? lastMsg;
    if (lastMessageJson != null) {
      lastMsg = Message.fromJson(lastMessageJson);
    }

    bool isBrand = false;
    if (participantJson != null) {
      if (participantJson['type'] == 'BRAND' ||
          participantJson.containsKey('logoUrl') ||
          participantJson.containsKey('lastLogin')) {
        isBrand = true;
      }
      participantJson['isBrand'] = isBrand;

      // Fix name extraction if it's nested inside user or brand
      if (participantJson['name'] == null) {
        if (participantJson['user'] != null && participantJson['user'] is Map) {
          participantJson['name'] =
              participantJson['user']['name'] ?? participantJson['user']['username'];
          participantJson['avatarUrl'] =
              participantJson['avatarUrl'] ?? participantJson['user']['profilePic'];
        } else if (participantJson['brand'] != null && participantJson['brand'] is Map) {
          participantJson['name'] =
              participantJson['brand']['name'] ?? participantJson['brand']['username'];
          participantJson['avatarUrl'] =
              participantJson['avatarUrl'] ?? participantJson['brand']['logoUrl'];
        }
      }
    }

    final isSupportChat = json['isSupportChat'] == true;

    return Conversation(
      id: (json['conversationId'] ?? json['id'])?.toString() ?? '',
      isSupportChat: isSupportChat,
      otherParticipant: participantJson != null
          ? ChatParticipant.fromJson(participantJson)
          : (isSupportChat
                ? const ChatParticipant(id: 'support', name: 'Lyket Support', isBrand: true)
                : const ChatParticipant(id: 'unknown', name: 'Unknown User')),
      lastMessage: lastMsg,
      unreadCount: json['unreadCount'] ?? 0,
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
      isRequest: _parseBool(json['isRequest']),
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

enum NotificationType { reminder, brand, social, message, system }

class AppNotification {
  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final DateTime createdAt;
  final bool isRead;
  final bool isPriority;

  // Polymorphic payload fields
  final String? avatarUrl;
  final String? referenceId; // e.g. postId, messageId, or userId
  final String? entityType; // e.g. 'post', 'comment', 'user'
  final String? ctaText;
  final DateTime? expiresAt; // For reminders

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.createdAt,
    this.isRead = false,
    this.isPriority = false,
    this.avatarUrl,
    this.referenceId,
    this.entityType,
    this.ctaText,
    this.expiresAt,
  });

  AppNotification copyWith({
    String? id,
    NotificationType? type,
    String? title,
    String? message,
    DateTime? createdAt,
    bool? isRead,
    bool? isPriority,
    String? avatarUrl,
    String? referenceId,
    String? entityType,
    String? ctaText,
    DateTime? expiresAt,
  }) {
    return AppNotification(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      isPriority: isPriority ?? this.isPriority,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      referenceId: referenceId ?? this.referenceId,
      entityType: entityType ?? this.entityType,
      ctaText: ctaText ?? this.ctaText,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }

  static bool _parseBool(dynamic val) {
    if (val == null) return false;
    if (val is bool) return val;
    if (val is String) return val.toLowerCase() == 'true' || val == '1';
    if (val is num) return val > 0;
    return false;
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: (json['id'] ?? '').toString(),
      type: NotificationType.values.firstWhere(
        (e) => e.name.toLowerCase() == (json['type']?.toString() ?? 'system').toLowerCase(),
        orElse: () => NotificationType.system,
      ),
      title: (json['title'] ?? '').toString(),
      message: (json['body'] ?? json['message'] ?? '').toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      isRead: _parseBool(json['isRead']),
      isPriority: _parseBool(json['isPriority']),
      avatarUrl: json['avatarUrl']?.toString(),
      referenceId: json['referenceId']?.toString(),
      entityType: json['entityType']?.toString(),
      ctaText: json['ctaText']?.toString(),
      expiresAt: json['expiresAt'] != null ? DateTime.tryParse(json['expiresAt'].toString()) : null,
    );
  }
}

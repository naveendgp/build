// Lyket Comment System — Data Models
// Maps directly to backend API response from GET /posts/:postId/comments

class Comment {
  final String id;
  final String postId;
  final String userId;
  final String username;
  final String? profilePic;
  final String content;
  final DateTime createdAt;
  final String? parentId;
  final List<Comment> replies;
  final int likeCount;
  final bool isLiked;
  final bool isBrandReply;

  const Comment({
    required this.id,
    required this.postId,
    required this.userId,
    required this.username,
    this.profilePic,
    required this.content,
    required this.createdAt,
    this.parentId,
    this.replies = const [],
    this.likeCount = 0,
    this.isLiked = false,
    this.isBrandReply = false,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    final brand = json['brand'] as Map<String, dynamic>?;
    final repliesJson = json['replies'] as List<dynamic>? ?? [];

    final isBrand = brand != null;
    final commentUsername = isBrand ? (brand['name'] ?? 'Brand') : (user?['username'] ?? 'User');
    final commentProfilePic = isBrand ? brand['logoUrl'] : user?['profilePic'];
    final actorId = json['userId'] ?? json['brandId'] ?? '';

    return Comment(
      id: json['id'] ?? '',
      postId: json['postId'] ?? '',
      userId: actorId,
      username: commentUsername,
      profilePic: commentProfilePic,
      content: json['content'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      parentId: json['parentId'],
      replies: repliesJson
          .map((r) => Comment.fromJson(r as Map<String, dynamic>))
          .toList(),
      // Backend doesn't have like count on comments yet — default to 0
      likeCount: json['likeCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      isBrandReply: json['isBrandReply'] ?? isBrand,
    );
  }

  Comment copyWith({
    bool? isLiked,
    int? likeCount,
    List<Comment>? replies,
  }) {
    return Comment(
      id: id,
      postId: postId,
      userId: userId,
      username: username,
      profilePic: profilePic,
      content: content,
      createdAt: createdAt,
      parentId: parentId,
      replies: replies ?? this.replies,
      likeCount: likeCount ?? this.likeCount,
      isLiked: isLiked ?? this.isLiked,
      isBrandReply: isBrandReply,
    );
  }
}

enum CommentFilter {
  top,
  newest,
  brandReplies,
}

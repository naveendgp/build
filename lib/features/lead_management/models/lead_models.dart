class LeadSubmission {
  final String id;
  final String formId;
  final String postId;
  final String userId;
  final Map<String, dynamic> answers;
  final DateTime createdAt;
  final String username;
  final String? email;
  final String? contactNumber;
  final double qualityScore;

  const LeadSubmission({
    required this.id,
    required this.formId,
    required this.postId,
    required this.userId,
    required this.answers,
    required this.createdAt,
    required this.username,
    this.email,
    this.contactNumber,
    this.qualityScore = 0,
  });

  factory LeadSubmission.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    return LeadSubmission(
      id: json['id'] ?? '',
      formId: json['formId'] ?? '',
      postId: json['postId'] ?? '',
      userId: json['userId'] ?? '',
      answers: json['answers'] as Map<String, dynamic>? ?? {},
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      username: user['username'] ?? 'Anonymous',
      email: user['email'],
      contactNumber: user['contactNumber'],
      qualityScore: (json['qualityScore'] as num?)?.toDouble() ?? 0,
    );
  }
}

class LeadStatItem {
  final String postId;
  final String? postTitle;
  final String? formId;
  final String? formTitle;
  final int viewCount;
  final int fieldCount;
  final int submissionCount;

  const LeadStatItem({
    required this.postId,
    this.postTitle,
    this.formId,
    this.formTitle,
    this.viewCount = 0,
    this.fieldCount = 0,
    this.submissionCount = 0,
  });

  factory LeadStatItem.fromJson(Map<String, dynamic> json) {
    return LeadStatItem(
      postId: json['postId'] ?? '',
      postTitle: json['postTitle'],
      formId: json['formId'],
      formTitle: json['formTitle'],
      viewCount: json['viewCount'] ?? 0,
      fieldCount: json['fieldCount'] ?? 0,
      submissionCount: json['submissionCount'] ?? 0,
    );
  }
}

class BrandLeadStats {
  final List<LeadStatItem> posts;
  final int totalSubmissions;
  final int formCount;

  const BrandLeadStats({
    required this.posts,
    this.totalSubmissions = 0,
    this.formCount = 0,
  });

  factory BrandLeadStats.fromJson(Map<String, dynamic> json) {
    return BrandLeadStats(
      posts: (json['posts'] as List<dynamic>?)?.map((e) => LeadStatItem.fromJson(e)).toList() ?? [],
      totalSubmissions: json['totalSubmissions'] ?? 0,
      formCount: json['formCount'] ?? 0,
    );
  }
}

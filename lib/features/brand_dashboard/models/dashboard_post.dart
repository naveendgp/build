import '../../../core/network/api_client.dart';

/// One of the brand's own posts, straight from `/brand/me/posts` — the same
/// payload the web dashboard reads, so both show the same numbers.
class BrandDashboardPost {
  final String id;
  final String title;
  final String? thumbnail;
  final bool isVideo;
  final String objective;
  final String publishStatus;
  final DateTime? publishAt;
  final DateTime? createdAt;
  final String? archivedBy;

  final int viewCount;
  final int likeCount;
  final int commentCount;
  final int sharesCount;
  final int clicksCount;
  final int leadFormViews;
  final int leadFormSubmissions;
  final int directionRequests;
  final int messageRequests;

  const BrandDashboardPost({
    required this.id,
    required this.title,
    this.thumbnail,
    this.isVideo = false,
    required this.objective,
    required this.publishStatus,
    this.publishAt,
    this.createdAt,
    this.archivedBy,
    this.viewCount = 0,
    this.likeCount = 0,
    this.commentCount = 0,
    this.sharesCount = 0,
    this.clicksCount = 0,
    this.leadFormViews = 0,
    this.leadFormSubmissions = 0,
    this.directionRequests = 0,
    this.messageRequests = 0,
  });

  static int _int(dynamic v) => v is int ? v : int.tryParse('${v ?? ''}') ?? 0;
  static DateTime? _date(dynamic v) => v == null ? null : DateTime.tryParse(v.toString())?.toLocal();

  factory BrandDashboardPost.fromJson(Map<String, dynamic> json) {
    final media = (json['media'] as List?) ?? const [];
    final first = media.isNotEmpty ? media.first as Map<String, dynamic> : null;
    return BrandDashboardPost(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      thumbnail: first?['url'] == null ? null : ApiClient.resolveMediaUrl(first!['url'].toString()),
      isVideo: (first?['type'] ?? '').toString().toUpperCase() == 'VIDEO',
      objective: (json['marketingObjective'] ?? 'AWARENESS').toString(),
      publishStatus: (json['publishStatus'] ?? '').toString(),
      publishAt: _date(json['publishAt']),
      createdAt: _date(json['createdAt']),
      archivedBy: json['archivedBy']?.toString(),
      viewCount: _int(json['viewCount']),
      likeCount: _int(json['likeCount']),
      commentCount: _int(json['commentCount']),
      sharesCount: _int(json['sharesCount']),
      clicksCount: _int(json['clicksCount']),
      leadFormViews: _int(json['leadFormViews']),
      leadFormSubmissions: _int(json['leadFormSubmissions']),
      directionRequests: _int(json['directionRequests']),
      messageRequests: _int(json['messageRequests']),
    );
  }

  bool get isScheduled => publishStatus.toUpperCase() == 'SCHEDULED';
  bool get archivedByAdmin => (archivedBy ?? '').toUpperCase() == 'ADMIN';

  /// How the web ranks "Top": views, with likes and comments worth five each.
  int get topScore => viewCount + (likeCount + commentCount) * 5;

  /// Engagement as a share of views; null when nothing has been viewed, rather
  /// than the 200% the old page printed by dividing by one.
  double? get engagementRate =>
      viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : null;

  /// The one result that matters for this post's objective.
  ({String label, int value})? get primaryMetric {
    switch (objective) {
      case 'LEAD_GENERATION':
        return (label: 'Leads', value: leadFormSubmissions);
      case 'GET_DIRECTIONS':
        return (label: 'Directions', value: directionRequests);
      case 'MESSAGING':
        return (label: 'Messages', value: messageRequests);
      case 'TRAFFIC':
      case 'CONVERSIONS':
        return (label: 'Clicks', value: clicksCount);
      default:
        return null;
    }
  }
}

/// The objective labels the web uses, in the same order.
const dashboardObjectives = <({String key, String label, int color})>[
  (key: 'AWARENESS', label: 'Awareness', color: 0xFFA1A1AA),
  (key: 'TRAFFIC', label: 'Traffic', color: 0xFF3B82F6),
  (key: 'LEAD_GENERATION', label: 'Leads', color: 0xFFEF4444),
  (key: 'CONVERSIONS', label: 'Conversions', color: 0xFF22C55E),
  (key: 'GET_DIRECTIONS', label: 'Directions', color: 0xFF0EA5E9),
  (key: 'MESSAGING', label: 'Messaging', color: 0xFFA855F7),
];

String objectiveLabel(String key) =>
    dashboardObjectives.where((o) => o.key == key).firstOrNull?.label ?? 'Awareness';

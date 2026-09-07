export 'dashboard_models.dart';

class DashboardSummary {
  final MetricValue followers;
  final MetricValue posts;
  final MetricValue impressions;
  final MetricValue profileVisits;
  final MetricValue interactions;
  final MetricValue remindersSet;
  final MetricValue leads;
  final MetricValue messages;

  DashboardSummary({
    required this.followers,
    required this.posts,
    required this.impressions,
    required this.profileVisits,
    required this.interactions,
    required this.remindersSet,
    required this.leads,
    required this.messages,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      followers: MetricValue.fromJson(json['followers'] ?? {}),
      posts: MetricValue.fromJson(json['posts'] ?? {}),
      impressions: MetricValue.fromJson(json['impressions'] ?? {}),
      profileVisits: MetricValue.fromJson(json['profileVisits'] ?? {}),
      interactions: MetricValue.fromJson(json['interactions'] ?? {}),
      remindersSet: MetricValue.fromJson(json['remindersSet'] ?? {}),
      leads: MetricValue.fromJson(json['leads'] ?? {}),
      messages: MetricValue.fromJson(json['messages'] ?? {}),
    );
  }
}

class MetricValue {
  final int value;
  final double growth;

  MetricValue({required this.value, required this.growth});

  factory MetricValue.fromJson(Map<String, dynamic> json) {
    return MetricValue(
      value: json['value'] ?? 0,
      growth: (json['growth'] ?? 0.0).toDouble(),
    );
  }
}

class DashboardChartsData {
  final List<TimeSeriesData> reachTrend;
  final List<TimeSeriesData> engagementTrend;
  final List<TimeSeriesData> leadTrend;
  final List<TrafficSource> trafficSources;

  DashboardChartsData({
    required this.reachTrend,
    required this.engagementTrend,
    required this.leadTrend,
    required this.trafficSources,
  });

  factory DashboardChartsData.fromJson(Map<String, dynamic> json) {
    return DashboardChartsData(
      reachTrend: (json['reachTrend'] as List?)?.map((e) => TimeSeriesData.fromJson(e)).toList() ?? [],
      engagementTrend: (json['engagementTrend'] as List?)?.map((e) => TimeSeriesData.fromJson(e)).toList() ?? [],
      leadTrend: (json['leadTrend'] as List?)?.map((e) => TimeSeriesData.fromJson(e)).toList() ?? [],
      trafficSources: (json['trafficSources'] as List?)?.map((e) => TrafficSource.fromJson(e)).toList() ?? [],
    );
  }
}

class TimeSeriesData {
  final String date;
  final int value;

  TimeSeriesData({required this.date, required this.value});

  factory TimeSeriesData.fromJson(Map<String, dynamic> json) {
    return TimeSeriesData(
      date: json['date'] ?? '',
      value: json['value'] ?? 0,
    );
  }
}

class TrafficSource {
  final String source;
  final double percentage;

  TrafficSource({required this.source, required this.percentage});

  factory TrafficSource.fromJson(Map<String, dynamic> json) {
    return TrafficSource(
      source: json['source'] ?? '',
      percentage: (json['percentage'] ?? 0.0).toDouble(),
    );
  }
}

class PostAnalytics {
  final String id;
  final String title;
  final String? thumbnail;
  final String objective;
  final PostMetrics metrics;
  final PostTrends trends;
  final String createdAt;
  final String performanceScore;
  final int performanceScoreValue;

  PostAnalytics({
    required this.id,
    required this.title,
    this.thumbnail,
    required this.objective,
    required this.metrics,
    required this.trends,
    required this.createdAt,
    required this.performanceScore,
    required this.performanceScoreValue,
  });

  factory PostAnalytics.fromJson(Map<String, dynamic> json) {
    return PostAnalytics(
      id: (json['id'] ?? '').toString(),
      title: json['title'] ?? '',
      thumbnail: json['thumbnail'],
      objective: json['objective'] ?? '',
      metrics: PostMetrics.fromJson(json['metrics'] ?? {}),
      trends: PostTrends.fromJson(json['trends'] ?? {}),
      createdAt: json['createdAt'] ?? '',
      performanceScore: json['performanceScore'] ?? 'Average',
      performanceScoreValue: json['performanceScoreValue'] ?? 50,
    );
  }
}

class PostTrends {
  final double impressionsTrend;
  final double leadsTrend;
  final double ctrTrend;
  final double messagesTrend;

  PostTrends({
    required this.impressionsTrend,
    required this.leadsTrend,
    required this.ctrTrend,
    required this.messagesTrend,
  });

  factory PostTrends.fromJson(Map<String, dynamic> json) {
    return PostTrends(
      impressionsTrend: (json['impressionsTrend'] ?? 0.0).toDouble(),
      leadsTrend: (json['leadsTrend'] ?? 0.0).toDouble(),
      ctrTrend: (json['ctrTrend'] ?? 0.0).toDouble(),
      messagesTrend: (json['messagesTrend'] ?? 0.0).toDouble(),
    );
  }
}

class PostMetrics {
  final int impressions;
  final int likes;
  final int comments;
  final int shares;
  final int saves;
  final double ctr;
  final int leads;
  final int messages;

  PostMetrics({
    required this.impressions,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.saves,
    required this.ctr,
    required this.leads,
    required this.messages,
  });

  factory PostMetrics.fromJson(Map<String, dynamic> json) {
    return PostMetrics(
      impressions: json['impressions'] ?? 0,
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      shares: json['shares'] ?? 0,
      saves: json['saves'] ?? 0,
      ctr: (json['ctr'] ?? 0.0).toDouble(),
      leads: json['leads'] ?? 0,
      messages: json['messages'] ?? 0,
    );
  }
}

// --- New models for demographics and top content ---

class FollowerDemographics {
  final List<DemographicItem> age;
  final List<DemographicItem> location;
  final List<DemographicItem> gender;

  FollowerDemographics({required this.age, required this.location, required this.gender});

  factory FollowerDemographics.fromJson(Map<String, dynamic> json) {
    return FollowerDemographics(
      age: (json['age'] as List?)?.map((e) => DemographicItem.fromJson(e)).toList() ?? [],
      location: (json['location'] as List?)?.map((e) => DemographicItem.fromJson(e)).toList() ?? [],
      gender: (json['gender'] as List?)?.map((e) => DemographicItem.fromJson(e)).toList() ?? [],
    );
  }
}

class DemographicItem {
  final String label;
  final int count;

  DemographicItem({required this.label, required this.count});

  factory DemographicItem.fromJson(Map<String, dynamic> json) {
    return DemographicItem(
      label: json['label'] ?? '',
      count: json['count'] ?? 0,
    );
  }
}

class TopContentPost {
  final String id;
  final String title;
  final String? thumbnail;
  final int reach;
  final int likes;
  final int comments;
  final int leads;
  final String createdAt;

  TopContentPost({
    required this.id,
    required this.title,
    this.thumbnail,
    required this.reach,
    required this.likes,
    required this.comments,
    required this.leads,
    required this.createdAt,
  });

  factory TopContentPost.fromJson(Map<String, dynamic> json) {
    return TopContentPost(
      id: (json['id'] ?? '').toString(),
      title: json['title'] ?? '',
      thumbnail: json['thumbnail'],
      reach: json['reach'] ?? 0,
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      leads: json['leads'] ?? 0,
      createdAt: json['createdAt'] ?? '',
    );
  }
}

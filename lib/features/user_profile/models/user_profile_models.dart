import '../../../core/network/api_client.dart';

enum ProfileTab { saved, collections }

class UserProfileData {
  final String id;
  final String username;
  final String name;
  final String email;
  final String bio;
  final String avatarUrl;
  final String coverUrl;
  final List<String> aiIdentityTags;
  final int followingCount;
  final String contactNumber;
  final String gender;
  final String location;
  final String dateOfBirth;

  const UserProfileData({
    required this.id,
    required this.username,
    required this.name,
    required this.email,
    required this.bio,
    required this.avatarUrl,
    required this.coverUrl,
    required this.aiIdentityTags,
    this.followingCount = 0,
    this.contactNumber = '',
    this.gender = '',
    this.location = '',
    this.dateOfBirth = '',
  });

  /// Calculates profile completion based on 7 core fields
  double get completionPercentage {
    int filled = 0;
    if (name.isNotEmpty) filled++;
    if (username.isNotEmpty) filled++;
    if (email.isNotEmpty) filled++;
    if (contactNumber.isNotEmpty) filled++;
    if (location.isNotEmpty) filled++;
    if (gender.isNotEmpty) filled++;
    if (dateOfBirth.isNotEmpty) filled++;
    return filled / 7.0;
  }

  /// Returns a list of the display names of missing fields
  List<String> get missingFields {
    final missing = <String>[];
    if (name.isEmpty) missing.add('Full Name');
    if (username.isEmpty) missing.add('Username');
    if (email.isEmpty) missing.add('Email Address');
    if (contactNumber.isEmpty) missing.add('Phone Number');
    if (location.isEmpty) missing.add('Location');
    if (gender.isEmpty) missing.add('Gender');
    if (dateOfBirth.isEmpty) missing.add('Date of Birth');
    return missing;
  }

  factory UserProfileData.fromJson(Map<String, dynamic> json) {
    List<String> parseInterests(dynamic interests) {
      if (interests == null) return [];
      if (interests is String) {
        return interests.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      }
      if (interests is List) {
        return interests.map((e) => e.toString()).toList();
      }
      return [];
    }

    final pic = json['profilePic']?.toString().trim();
    final name = json['name']?.toString().trim() ?? '';
    
    return UserProfileData(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      name: name.isEmpty ? 'User' : name,
      email: json['email'] ?? '',
      bio: json['bio'] ?? '',
      avatarUrl: (pic != null && pic.isNotEmpty && pic != 'null') ? ApiClient.resolveMediaUrl(pic) : '',
      coverUrl: json['coverUrl'] != null ? ApiClient.resolveMediaUrl(json['coverUrl']) : '',
      aiIdentityTags: parseInterests(json['interests']),
      followingCount: json['_count']?['follows'] ?? 0,
      contactNumber: json['contactNumber'] ?? '',
      gender: json['gender'] ?? '',
      location: json['location'] ?? '',
      dateOfBirth: json['dateOfBirth'] != null 
          ? '${DateTime.parse(json['dateOfBirth']).toLocal().day.toString().padLeft(2, '0')}/${DateTime.parse(json['dateOfBirth']).toLocal().month.toString().padLeft(2, '0')}/${DateTime.parse(json['dateOfBirth']).toLocal().year}' 
          : '',
    );
  }

  static const mock = UserProfileData(
    id: 'usr_mock_1',
    username: '@alexa_designs',
    name: 'Alexa V.',
    email: 'alexa@example.com',
    bio: 'Curating the intersection of modern luxury, brutalist architecture, and culinary arts.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    aiIdentityTags: ['Fashion', 'Travel', 'Luxury Cafes'],
  );
}

class SavedPostItem {
  final String id;
  final String imageUrl;
  final String? videoUrl;
  final String title;
  final double aspectRatio;
  final bool isVideo;

  const SavedPostItem({
    required this.id,
    required this.imageUrl,
    this.videoUrl,
    required this.title,
    required this.aspectRatio,
    this.isVideo = false,
  });

  factory SavedPostItem.fromJson(Map<String, dynamic> json) {
    final media = json['media'] as List?;
    final firstMedia = (media != null && media.isNotEmpty) ? media.first : null;
    
    String url = '';
    String? vUrl;
    bool isVideo = false;

    if (firstMedia != null) {
      if (firstMedia['type']?.toString().toUpperCase() == 'VIDEO') {
        isVideo = true;
        vUrl = firstMedia['url'];
        url = firstMedia['thumbnailUrl'] ?? firstMedia['url'] ?? '';
      } else {
        url = firstMedia['url'] ?? '';
      }
    }

    return SavedPostItem(
      id: json['id'] ?? '',
      imageUrl: ApiClient.resolveMediaUrl(url),
      videoUrl: vUrl != null ? ApiClient.resolveMediaUrl(vUrl) : null,
      title: json['title'] ?? '',
      aspectRatio: firstMedia != null ? (firstMedia['aspectRatio'] as num?)?.toDouble() ?? 1.0 : 1.0,
      isVideo: isVideo,
    );
  }

  static const List<SavedPostItem> mockGrid = [
    SavedPostItem(id: '1', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Winter Collection', aspectRatio: 1.5),
    SavedPostItem(id: '2', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Minimalist Cafe', aspectRatio: 0.8),
    SavedPostItem(id: '3', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Sneaker Drop', aspectRatio: 1.0),
    SavedPostItem(id: '4', imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Paris Getaway', aspectRatio: 1.2),
    SavedPostItem(id: '5', imageUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Interior Design', aspectRatio: 0.7),
    SavedPostItem(id: '6', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Style Inspo', aspectRatio: 1.4),
  ];
}

class CollectionItem {
  final String id;
  final String title;
  final int postCount;
  final String lastUpdated;
  final bool isPrivate;
  final List<String> coverImages;
  final List<SavedPostItem> posts;

  const CollectionItem({
    required this.id,
    required this.title,
    required this.postCount,
    required this.lastUpdated,
    required this.isPrivate,
    required this.coverImages,
    required this.posts,
  });

  factory CollectionItem.fromJson(Map<String, dynamic> json) {
    List<String> images = [];
    List<SavedPostItem> parsedPosts = [];
    if (json['items'] != null && json['items'] is List) {
      for (var item in json['items']) {
        if (item['post'] != null) {
          final postItem = SavedPostItem.fromJson(item['post']);
          parsedPosts.add(postItem);
          if (postItem.imageUrl.isNotEmpty && !postItem.imageUrl.toLowerCase().endsWith('.mp4')) {
            images.add(postItem.imageUrl);
          }
        }
      }
    }

    return CollectionItem(
      id: json['id'] ?? '',
      title: json['name'] ?? 'Collection',
      postCount: parsedPosts.length,
      lastUpdated: 'Recently',
      isPrivate: true,
      coverImages: images,
      posts: parsedPosts,
    );
  }
}

class ActivityItem {
  final String id;
  final String type; // 'like', 'comment', 'follow'
  final String content;
  final String time;
  final String avatarUrl;

  const ActivityItem({
    required this.id,
    required this.type,
    required this.content,
    required this.time,
    required this.avatarUrl,
  });

  static const List<ActivityItem> mockList = [
    ActivityItem(id: 'a1', type: 'like', content: 'Liked a post by @nike', time: '10m ago', avatarUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'),
    ActivityItem(id: 'a2', type: 'comment', content: 'Commented: "Absolutely stunning 🖤"', time: '2h ago', avatarUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'),
    ActivityItem(id: 'a3', type: 'follow', content: 'Started following @vogue', time: '5h ago', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'),
  ];
}

class InterestItem {
  final String id;
  final String label;
  final String imageUrl;

  const InterestItem({
    required this.id,
    required this.label,
    required this.imageUrl,
  });

  static const List<InterestItem> mockList = [
    InterestItem(id: 'i1', label: 'High Fashion', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),
    InterestItem(id: 'i2', label: 'Minimalist Architecture', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),
    InterestItem(id: 'i3', label: 'Boutique Coffee', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),
    InterestItem(id: 'i4', label: 'Film Photography', imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'),
  ];
}

class RegionalVariant {
  const RegionalVariant({
    required this.id,
    required this.regionLabel,
    this.signerLabel,
    required this.videoUrl,
    this.primary = false,
    this.placeholderVideo = false,
  });

  final String id;
  final String regionLabel;
  final String? signerLabel;
  final String videoUrl;
  final bool primary;
  final bool placeholderVideo;

  factory RegionalVariant.fromJson(Map<String, dynamic> json) {
    return RegionalVariant(
      id: (json['id'] ?? '') as String,
      regionLabel: (json['regionLabel'] ?? 'Toàn quốc') as String,
      signerLabel: json['signerLabel'] as String?,
      videoUrl: (json['videoUrl'] ?? '') as String,
      primary: (json['primary'] ?? false) as bool,
      placeholderVideo: (json['placeholderVideo'] ?? false) as bool,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'regionLabel': regionLabel,
        'signerLabel': signerLabel,
        'videoUrl': videoUrl,
        'primary': primary,
        'placeholderVideo': placeholderVideo,
      };
}

class Sign {
  const Sign({
    required this.id,
    required this.word,
    required this.meaning,
    required this.topic,
    this.wordClass,
    this.thumbnailUrl,
    this.videoUrl,
    this.aiRecognizable = false,
    this.english,
  });

  final String id;
  final String word;
  final String meaning;
  final String topic;
  final String? wordClass;
  final String? thumbnailUrl;
  final String? videoUrl;
  final bool aiRecognizable;
  final String? english;

  factory Sign.fromJson(Map<String, dynamic> json) {
    return Sign(
      id: (json['id'] ?? '') as String,
      word: (json['word'] ?? '') as String,
      meaning: (json['meaning'] ?? '') as String,
      topic: (json['topic'] ?? '') as String,
      wordClass: json['wordClass'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      aiRecognizable: (json['aiRecognizable'] ?? false) as bool,
      english: json['english'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'word': word,
        'meaning': meaning,
        'topic': topic,
        'wordClass': wordClass,
        'thumbnailUrl': thumbnailUrl,
        'videoUrl': videoUrl,
        'aiRecognizable': aiRecognizable,
        'english': english,
      };
}

class SignDetail {
  const SignDetail({
    required this.id,
    required this.word,
    required this.meaning,
    this.wordClass,
    required this.topic,
    this.description,
    this.aiRecognizable = false,
    this.variants = const [],
    this.english,
  });

  final String id;
  final String word;
  final String meaning;
  final String? wordClass;
  final String topic;
  final String? description;
  final bool aiRecognizable;
  final List<RegionalVariant> variants;
  final String? english;

  String? get primaryVideoUrl {
    if (variants.isEmpty) return null;
    final primary = variants.firstWhere(
      (v) => v.primary,
      orElse: () => variants.first,
    );
    return primary.videoUrl;
  }

  factory SignDetail.fromJson(Map<String, dynamic> json) {
    final variantsList = (json['variants'] as List<dynamic>?)
            ?.map((v) => RegionalVariant.fromJson(v as Map<String, dynamic>))
            .toList() ??
        const [];

    return SignDetail(
      id: (json['id'] ?? '') as String,
      word: (json['word'] ?? '') as String,
      meaning: (json['meaning'] ?? '') as String,
      wordClass: json['wordClass'] as String?,
      topic: (json['topic'] ?? '') as String,
      description: json['description'] as String?,
      aiRecognizable: (json['aiRecognizable'] ?? false) as bool,
      variants: variantsList,
      english: json['english'] as String?,
    );
  }

  Sign toSign() {
    return Sign(
      id: id,
      word: word,
      meaning: meaning,
      topic: topic,
      wordClass: wordClass,
      thumbnailUrl: primaryVideoUrl,
      videoUrl: primaryVideoUrl,
      aiRecognizable: aiRecognizable,
      english: english,
    );
  }
}

class TopicItem {
  final String topic;
  final int signCount;

  const TopicItem({
    required this.topic,
    required this.signCount,
  });

  factory TopicItem.fromJson(Map<String, dynamic> json) {
    return TopicItem(
      topic: (json['topic'] ?? '') as String,
      signCount: (json['signCount'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'topic': topic,
        'signCount': signCount,
      };
}

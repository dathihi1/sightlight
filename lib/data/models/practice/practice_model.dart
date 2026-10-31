class PracticeQuestion {
  const PracticeQuestion({
    required this.id,
    required this.signId,
    required this.word,
    required this.videoUrl,
    required this.options,
    required this.correctAnswer,
    this.meaning = '',
    this.topic = '',
  });

  final String id;
  final String signId;
  final String word;
  final String videoUrl;
  final List<String> options;
  final String correctAnswer;
  final String meaning;
  final String topic;

  factory PracticeQuestion.fromJson(Map<String, dynamic> json) {
    return PracticeQuestion(
      id: (json['id'] ?? '') as String,
      signId: (json['signId'] ?? '') as String,
      word: (json['word'] ?? '') as String,
      videoUrl: (json['videoUrl'] ?? '') as String,
      options: (json['options'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      correctAnswer: (json['correctAnswer'] ?? '') as String,
      meaning: (json['meaning'] ?? '') as String,
      topic: (json['topic'] ?? '') as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'signId': signId,
        'word': word,
        'videoUrl': videoUrl,
        'options': options,
        'correctAnswer': correctAnswer,
        'meaning': meaning,
        'topic': topic,
      };
}

class VocabularySession {
  const VocabularySession({
    required this.sessionId,
    required this.items,
  });

  final String sessionId;
  final List<PracticeQuestion> items;

  factory VocabularySession.fromJson(Map<String, dynamic> json) {
    final list = (json['items'] as List<dynamic>?)
            ?.map((e) => PracticeQuestion.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];
    return VocabularySession(
      sessionId: (json['sessionId'] ?? '') as String,
      items: list,
    );
  }

  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'items': items.map((e) => e.toJson()).toList(),
      };
}

class FingerspellItem {
  const FingerspellItem({
    required this.id,
    required this.word,
    required this.hint,
    this.videoUrl,
    this.letterSigns = const {},
  });

  final String id;
  final String word;
  final String hint;
  final String? videoUrl;
  final Map<String, String> letterSigns;

  List<String> get letters =>
      word.toUpperCase().replaceAll(' ', '').split('');

  factory FingerspellItem.fromJson(Map<String, dynamic> json) {
    return FingerspellItem(
      id: (json['id'] ?? '') as String,
      word: (json['word'] ?? '') as String,
      hint: (json['hint'] ?? '') as String,
      videoUrl: json['videoUrl'] as String?,
      letterSigns: (json['letterSigns'] as Map<String, dynamic>?)?.map(
            (k, v) => MapEntry(k, v.toString()),
          ) ??
          const {},
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'word': word,
        'hint': hint,
        'videoUrl': videoUrl,
        'letterSigns': letterSigns,
      };
}

class FingerspellSession {
  const FingerspellSession({
    required this.sessionId,
    required this.items,
  });

  final String sessionId;
  final List<FingerspellItem> items;

  factory FingerspellSession.fromJson(Map<String, dynamic> json) {
    final list = (json['items'] as List<dynamic>?)
            ?.map((e) => FingerspellItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];
    return FingerspellSession(
      sessionId: (json['sessionId'] ?? '') as String,
      items: list,
    );
  }

  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'items': items.map((e) => e.toJson()).toList(),
      };
}

class PracticeAnswer {
  const PracticeAnswer({
    required this.sessionId,
    required this.questionId,
    required this.selectedAnswer,
    required this.isCorrect,
    this.timeTakenSeconds = 0,
  });

  final String sessionId;
  final String questionId;
  final String selectedAnswer;
  final bool isCorrect;
  final int timeTakenSeconds;

  factory PracticeAnswer.fromJson(Map<String, dynamic> json) {
    return PracticeAnswer(
      sessionId: (json['sessionId'] ?? '') as String,
      questionId: (json['questionId'] ?? '') as String,
      selectedAnswer: (json['selectedAnswer'] ?? '') as String,
      isCorrect: (json['isCorrect'] ?? false) as bool,
      timeTakenSeconds: (json['timeTakenSeconds'] ?? 0) as int,
    );
  }

  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'questionId': questionId,
        'selectedAnswer': selectedAnswer,
        'isCorrect': isCorrect,
        'timeTakenSeconds': timeTakenSeconds,
      };
}

class PracticeStats {
  const PracticeStats({
    this.totalSessions = 0,
    this.totalAnswered = 0,
    this.totalCorrect = 0,
    this.streakDays = 0,
    this.lastSessionDate,
  });

  final int totalSessions;
  final int totalAnswered;
  final int totalCorrect;
  final int streakDays;
  final String? lastSessionDate;

  double get accuracy =>
      totalAnswered == 0 ? 0.0 : (totalCorrect / totalAnswered) * 100;

  PracticeStats copyWithSession({
    required int answered,
    required int correct,
  }) {
    final now = DateTime.now();
    final todayStr = now.toIso8601String().substring(0, 10);

    int newStreak = streakDays;
    if (lastSessionDate == null) {
      newStreak = 1;
    } else if (lastSessionDate != todayStr) {
      final lastDate = DateTime.tryParse(lastSessionDate!);
      if (lastDate != null) {
        final diff = now.difference(lastDate).inDays;
        if (diff == 1) {
          newStreak += 1;
        } else if (diff > 1) {
          newStreak = 1;
        }
      }
    }

    return PracticeStats(
      totalSessions: totalSessions + 1,
      totalAnswered: totalAnswered + answered,
      totalCorrect: totalCorrect + correct,
      streakDays: newStreak,
      lastSessionDate: todayStr,
    );
  }

  factory PracticeStats.fromJson(Map<String, dynamic> json) {
    return PracticeStats(
      totalSessions: (json['totalSessions'] ?? 0) as int,
      totalAnswered: (json['totalAnswered'] ?? 0) as int,
      totalCorrect: (json['totalCorrect'] ?? 0) as int,
      streakDays: (json['streakDays'] ?? 0) as int,
      lastSessionDate: json['lastSessionDate'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'totalSessions': totalSessions,
        'totalAnswered': totalAnswered,
        'totalCorrect': totalCorrect,
        'streakDays': streakDays,
        'lastSessionDate': lastSessionDate,
      };
}

class AiPracticeItem {
  const AiPracticeItem({
    required this.signId,
    required this.label,
    this.topic = '',
    this.videoUrl = '',
    this.placeholderVideo = false,
    this.hint = '',
  });

  final String signId;
  final String label;
  final String topic;
  final String videoUrl;
  final bool placeholderVideo;
  final String hint;

  factory AiPracticeItem.fromJson(Map<String, dynamic> json) {
    return AiPracticeItem(
      signId: (json['signId'] ?? '') as String,
      label: (json['label'] ?? '') as String,
      topic: (json['topic'] ?? '') as String,
      videoUrl: (json['videoUrl'] ?? '') as String,
      placeholderVideo: (json['placeholderVideo'] ?? false) as bool,
      hint: (json['hint'] ?? '') as String,
    );
  }
}

class AiPracticeSessionResponse {
  const AiPracticeSessionResponse({
    required this.sessionId,
    required this.modelVersion,
    required this.items,
  });

  final String sessionId;
  final String modelVersion;
  final List<AiPracticeItem> items;

  factory AiPracticeSessionResponse.fromJson(Map<String, dynamic> json) {
    final list = (json['items'] as List<dynamic>?)
            ?.map((e) => AiPracticeItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];
    return AiPracticeSessionResponse(
      sessionId: (json['sessionId'] ?? '') as String,
      modelVersion: (json['modelVersion'] ?? 'vsl-mvp30-v2-lite-transformer')
          as String,
      items: list,
    );
  }
}

class AiCandidateDto {
  const AiCandidateDto({
    this.signId,
    required this.label,
    required this.confidence,
  });

  final String? signId;
  final String label;
  final double confidence;

  factory AiCandidateDto.fromJson(Map<String, dynamic> json) {
    return AiCandidateDto(
      signId: json['signId'] as String?,
      label: (json['label'] ?? '') as String,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class AiAttemptResponse {
  const AiAttemptResponse({
    required this.attemptId,
    required this.verified,
    required this.status,
    this.confidence,
    this.predictedSignId,
    this.predictedLabel,
    this.top3 = const [],
    this.qualityHints = const [],
    this.countedAgainstQuota = false,
    this.quotaRemaining,
    this.consecutiveFailures = 0,
    this.stubMode = false,
  });

  final String attemptId;
  final bool verified;
  final String status;
  final double? confidence;
  final String? predictedSignId;
  final String? predictedLabel;
  final List<AiCandidateDto> top3;
  final List<String> qualityHints;
  final bool countedAgainstQuota;
  final int? quotaRemaining;
  final int consecutiveFailures;
  final bool stubMode;

  factory AiAttemptResponse.fromJson(Map<String, dynamic> json) {
    final top3List = (json['top3'] as List<dynamic>?)
            ?.map((e) => AiCandidateDto.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];
    final hintsList = (json['qualityHints'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        const [];
    return AiAttemptResponse(
      attemptId: (json['attemptId'] ?? '') as String,
      verified: (json['verified'] ?? false) as bool,
      status: (json['status'] ?? 'unknown') as String,
      confidence: (json['confidence'] as num?)?.toDouble(),
      predictedSignId: json['predictedSignId'] as String?,
      predictedLabel: json['predictedLabel'] as String?,
      top3: top3List,
      qualityHints: hintsList,
      countedAgainstQuota: (json['countedAgainstQuota'] ?? false) as bool,
      quotaRemaining: json['quotaRemaining'] as int?,
      consecutiveFailures: (json['consecutiveFailures'] ?? 0) as int,
      stubMode: (json['stubMode'] ?? false) as bool,
    );
  }
}


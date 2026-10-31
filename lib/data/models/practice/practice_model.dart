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
    final todayStr = '${now.year}-${now.month}-${now.day}';

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

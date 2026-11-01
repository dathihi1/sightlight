class CourseSummary {
  const CourseSummary({
    required this.id,
    required this.code,
    required this.name,
    required this.status,
    required this.comingSoon,
  });

  final String id;
  final String code;
  final String name;
  final String status;
  final bool comingSoon;
}

class LearningPath {
  const LearningPath({
    required this.courseId,
    required this.courseName,
    required this.units,
    this.nextLessonId,
  });

  final String courseId;
  final String courseName;
  final String? nextLessonId;
  final List<LearningUnit> units;
}

class LearningUnit {
  const LearningUnit({
    required this.id,
    required this.number,
    required this.title,
    required this.lessons,
    required this.isLocked,
    required this.isFree,
    required this.starsEarned,
  });

  final String id;
  final int number;
  final String title;
  final List<LearningLesson> lessons;
  final bool isLocked;
  final bool isFree;
  final int starsEarned;

  int get completedCount => lessons.where((item) => item.isCompleted).length;
  int get totalCount => lessons.length;
  int get progressPercent =>
      totalCount == 0 ? 0 : completedCount * 100 ~/ totalCount;
}

class LearningLesson {
  const LearningLesson({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.status,
    required this.isLocked,
    required this.premiumLocked,
    this.lockedReason,
    this.bestScorePercent,
  });

  final String id;
  final String title;
  final String subtitle;
  final String status;
  final bool isLocked;
  final bool premiumLocked;
  final String? lockedReason;
  final int? bestScorePercent;

  bool get isCompleted => status == 'COMPLETED';
}

class LessonDetail {
  const LessonDetail({
    required this.id,
    required this.title,
    required this.summary,
    required this.estimatedMinutes,
    required this.blocks,
    required this.exercises,
    required this.resumeAtIndex,
  });

  final String id;
  final String title;
  final String summary;
  final int estimatedMinutes;
  final List<LessonBlock> blocks;
  final List<LessonExercise> exercises;
  final int resumeAtIndex;
}

class LessonBlock {
  const LessonBlock({
    required this.id,
    required this.type,
    required this.title,
    required this.bodyText,
    this.mediaRef,
  });

  final String id;
  final String type;
  final String title;
  final String bodyText;
  final String? mediaRef;
}

class LessonExercise {
  const LessonExercise({
    required this.id,
    required this.type,
    required this.instruction,
    required this.prompt,
    required this.options,
    required this.tokens,
    this.videoUrl,
    this.skill,
    this.difficulty,
  });

  final String id;
  final String type;
  final String instruction;
  final String prompt;
  final String? videoUrl;
  final List<LessonOption> options;
  final List<String> tokens;
  final String? skill;
  final String? difficulty;
}

class LessonOption {
  const LessonOption({required this.id, required this.label, this.videoUrl});

  final String id;
  final String label;
  final String? videoUrl;
}

class AnswerFeedback {
  const AnswerFeedback({
    required this.correct,
    required this.attemptNo,
    required this.willRepeat,
    this.correctOptionId,
    this.correctAnswerText,
    this.explanationVideoUrl,
  });

  final bool correct;
  final int attemptNo;
  final bool willRepeat;
  final String? correctOptionId;
  final String? correctAnswerText;
  final String? explanationVideoUrl;
}

class LessonMatchPair {
  const LessonMatchPair({required this.promptId, required this.optionId});

  final String promptId;
  final String optionId;

  Map<String, String> toJson() => {'promptId': promptId, 'optionId': optionId};
}

class LessonCompletion {
  const LessonCompletion({
    required this.scorePercent,
    required this.earnedExp,
    this.nextLessonId,
  });

  final int scorePercent;
  final int earnedExp;
  final String? nextLessonId;
}

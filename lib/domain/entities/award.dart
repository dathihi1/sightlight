class BadgeItem {
  const BadgeItem({
    required this.code,
    required this.title,
    required this.description,
    this.iconUrl,
    this.category = 'General',
    this.level = 1,
    this.maxLevel = 3,
    this.currentValue = 0,
    this.targetValue = 100,
    this.isUnlocked = false,
    this.isCelebrated = false,
    this.unlockedAt,
    this.expReward = 50,
  });

  final String code;
  final String title;
  final String description;
  final String? iconUrl;
  final String category;
  final int level;
  final int maxLevel;
  final int currentValue;
  final int targetValue;
  final bool isUnlocked;
  final bool isCelebrated;
  final DateTime? unlockedAt;
  final int expReward;

  double get progressRatio =>
      targetValue > 0 ? (currentValue / targetValue).clamp(0.0, 1.0) : 1.0;

  BadgeItem copyWith({
    String? code,
    String? title,
    String? description,
    String? iconUrl,
    String? category,
    int? level,
    int? maxLevel,
    int? currentValue,
    int? targetValue,
    bool? isUnlocked,
    bool? isCelebrated,
    DateTime? unlockedAt,
    int? expReward,
  }) {
    return BadgeItem(
      code: code ?? this.code,
      title: title ?? this.title,
      description: description ?? this.description,
      iconUrl: iconUrl ?? this.iconUrl,
      category: category ?? this.category,
      level: level ?? this.level,
      maxLevel: maxLevel ?? this.maxLevel,
      currentValue: currentValue ?? this.currentValue,
      targetValue: targetValue ?? this.targetValue,
      isUnlocked: isUnlocked ?? this.isUnlocked,
      isCelebrated: isCelebrated ?? this.isCelebrated,
      unlockedAt: unlockedAt ?? this.unlockedAt,
      expReward: expReward ?? this.expReward,
    );
  }
}

class AwardOverview {
  const AwardOverview({
    required this.badges,
    this.totalPoints = 0,
    this.unlockedCount = 0,
  });

  final List<BadgeItem> badges;
  final int totalPoints;
  final int unlockedCount;
}

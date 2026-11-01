import '../../../domain/entities/award.dart';

class BadgeItemDto {
  const BadgeItemDto({
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

  factory BadgeItemDto.fromJson(Map<String, dynamic> json) {
    DateTime? parsedUnlockedAt;
    if (json['unlockedAt'] is String) {
      parsedUnlockedAt = DateTime.tryParse(json['unlockedAt'] as String);
    }

    final codeVal =
        (json['code'] ?? json['itemKey'] ?? json['id'] ?? '') as String;
    final titleVal =
        (json['title'] ?? json['name'] ?? 'Huy hiệu mới') as String;
    final descVal = (json['description'] ?? '') as String;
    final isUnlockedVal =
        (json['isUnlocked'] as bool?) ??
        (json['unlocked'] as bool?) ??
        (json['isOwned'] as bool?) ??
        false;

    return BadgeItemDto(
      code: codeVal,
      title: titleVal,
      description: descVal,
      iconUrl: json['iconUrl'] as String?,
      category: (json['category'] as String?) ?? 'General',
      level: (json['level'] as num?)?.toInt() ?? 1,
      maxLevel: (json['maxLevel'] as num?)?.toInt() ?? 3,
      currentValue:
          (json['currentValue'] as num?)?.toInt() ?? (isUnlockedVal ? 100 : 0),
      targetValue: (json['targetValue'] as num?)?.toInt() ?? 100,
      isUnlocked: isUnlockedVal,
      isCelebrated:
          (json['isCelebrated'] as bool?) ??
          (json['celebrated'] as bool?) ??
          false,
      unlockedAt: parsedUnlockedAt,
      expReward:
          (json['expReward'] as num?)?.toInt() ??
          (json['costExp'] as num?)?.toInt() ??
          50,
    );
  }

  BadgeItem toEntity() {
    return BadgeItem(
      code: code,
      title: title,
      description: description,
      iconUrl: iconUrl,
      category: category,
      level: level,
      maxLevel: maxLevel,
      currentValue: currentValue,
      targetValue: targetValue,
      isUnlocked: isUnlocked,
      isCelebrated: isCelebrated,
      unlockedAt: unlockedAt,
      expReward: expReward,
    );
  }
}

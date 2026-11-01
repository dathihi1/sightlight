import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/progress_stats.dart';
import '../../domain/entities/user.dart';
import '../../domain/entities/learning.dart';
import '../providers/auth_provider.dart';
import '../providers/gamification_provider.dart';
import '../providers/learning_provider.dart';

typedef Lesson = LearningLesson;
typedef Unit = LearningUnit;

final currentUnitProvider = Provider<Unit?>((ref) {
  final units = ref.watch(learningPathProvider).valueOrNull?.units ?? const [];
  if (units.isEmpty) return null;
  return units.firstWhere(
    (u) => u.completedCount < u.totalCount,
    orElse: () => units.first,
  );
});

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  void _onStartLesson(BuildContext context, Lesson lesson, Unit unit) {
    if (lesson.premiumLocked) {
      context.push('/upgrade');
      return;
    }
    if (lesson.isLocked) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(lesson.lockedReason ?? 'Bài học đang bị khóa.')),
      );
      return;
    }
    context.push('/lessons/${lesson.id}');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final user = authState.value;
    final statsAsync = ref.watch(progressStatsProvider);
    final stats = statsAsync.valueOrNull;

    final pathAsync = ref.watch(learningPathProvider);
    final currentUnit = ref.watch(currentUnitProvider);
    final allUnits = pathAsync.valueOrNull?.units ?? const <Unit>[];

    if (pathAsync.isLoading && allUnits.isEmpty) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (pathAsync.hasError && allUnits.isEmpty) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  pathAsync.error.toString().replaceFirst('Exception: ', ''),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.invalidate(learningPathProvider),
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final allLessons = allUnits.expand((u) => u.lessons).toList();
    final totalLessons = allLessons.length;
    final totalCompleted = allLessons.where((l) => l.isCompleted).length;
    final overallPercent = totalLessons > 0
        ? (totalCompleted * 100 ~/ totalLessons)
        : 0;

    final targetLesson = currentUnit != null && currentUnit.lessons.isNotEmpty
        ? currentUnit.lessons.firstWhere(
            (l) => !l.isCompleted && !l.isLocked,
            orElse: () => currentUnit.lessons.first,
          )
        : null;

    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          // 1. Profile / Stats summary card
          _buildProfileStatsCard(context, user, stats, overallPercent),
          const SizedBox(height: 20),

          // 2. "Tiếp tục học" Section
          _buildContinueSectionHeader(context),
          const SizedBox(height: 12),
          if (currentUnit != null)
            _buildContinueLearningCard(context, currentUnit, targetLesson),
          const SizedBox(height: 28),

          // 3. "Lộ trình học" Section Header
          _buildRoadmapSectionHeader(context, allUnits),
          const SizedBox(height: 14),

          // 4. 17 Unit Cards
          ...allUnits.map(
            (unit) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _UnitCard(
                key: ValueKey(unit.id),
                unit: unit,
                initiallyExpanded: unit.number == 1,
                onStartLesson: (lesson) =>
                    _onStartLesson(context, lesson, unit),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildProfileStatsCard(
    BuildContext context,
    User? user,
    ProgressStats? stats,
    int overallPercent,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final displayName =
        user?.displayName ?? user?.email.split('@').first ?? 'Học viên';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withAlpha(8),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: isDark
                    ? theme.colorScheme.primary.withAlpha(40)
                    : const Color(0xFFEFF6FF),
                backgroundImage: user?.avatarUrl != null
                    ? NetworkImage(user!.avatarUrl!)
                    : null,
                child: user?.avatarUrl == null
                    ? Text(
                        displayName.isNotEmpty
                            ? displayName[0].toUpperCase()
                            : 'H',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Xin chào, $displayName',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 17,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Hoàn thành $overallPercent% lộ trình học',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? Colors.white60
                            : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withAlpha(10)
                  : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem(
                  context,
                  icon: Icons.local_fire_department_rounded,
                  iconColor: const Color(0xFFF97316),
                  value: '${stats?.streakDays ?? 0}',
                  label: 'Ngày chuỗi',
                ),
                Container(
                  width: 1,
                  height: 28,
                  color: isDark ? Colors.white24 : const Color(0xFFE2E8F0),
                ),
                _buildStatItem(
                  context,
                  icon: Icons.check_circle_outline_rounded,
                  iconColor: const Color(0xFF2563EB),
                  value: '${stats?.signsMastered ?? 0}',
                  label: 'Ký hiệu',
                ),
                Container(
                  width: 1,
                  height: 28,
                  color: isDark ? Colors.white24 : const Color(0xFFE2E8F0),
                ),
                _buildStatItem(
                  context,
                  icon: Icons.star_rounded,
                  iconColor: const Color(0xFFEAB308),
                  value: '${stats?.expBalance ?? 0}',
                  label: 'Điểm EXP',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: iconColor, size: 18),
            const SizedBox(width: 4),
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: isDark ? Colors.white60 : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildContinueSectionHeader(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          'Tiếp tục học',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        Text(
          'Khoá học SignLight',
          style: theme.textTheme.bodySmall?.copyWith(
            color: const Color(0xFF64748B),
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildContinueLearningCard(
    BuildContext context,
    Unit currentUnit,
    Lesson? targetLesson,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: theme.colorScheme.primary.withAlpha(15),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: isDark
                      ? theme.colorScheme.primary.withAlpha(40)
                      : const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(16),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${currentUnit.number}',
                  style: TextStyle(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 22,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      currentUnit.title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 17,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Chủ đề ${currentUnit.number} · ${currentUnit.isFree ? "Miễn phí" : "Nâng cao"}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? Colors.white60
                            : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (currentUnit.progressPercent / 100).clamp(0.03, 1.0),
              minHeight: 8,
              backgroundColor: isDark
                  ? Colors.white.withAlpha(20)
                  : const Color(0xFFE2E8F0),
              valueColor: AlwaysStoppedAnimation<Color>(
                theme.colorScheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${currentUnit.completedCount}/${currentUnit.totalCount} bài',
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white60 : const Color(0xFF64748B),
                ),
              ),
              Text(
                '${currentUnit.progressPercent}%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                if (targetLesson != null) {
                  _onStartLesson(context, targetLesson, currentUnit);
                } else {
                  context.go('/practice');
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    targetLesson != null
                        ? (targetLesson.isCompleted
                              ? 'Học tiếp: ${targetLesson.title}'
                              : 'Bắt đầu: ${targetLesson.title}')
                        : 'Bắt đầu học',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoadmapSectionHeader(BuildContext context, List<Unit> allUnits) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final allLessons = allUnits.expand((u) => u.lessons).toList();
    final totalLessons = allLessons.length;
    final completedLessons = allLessons.where((l) => l.isCompleted).length;
    final overallPercent = totalLessons > 0
        ? (completedLessons * 100 ~/ totalLessons)
        : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'Lộ trình học',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withAlpha(20)
                    : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '$completedLessons/$totalLessons bài ($overallPercent%)',
                style: TextStyle(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: totalLessons > 0
                ? (completedLessons / totalLessons).clamp(0.02, 1.0)
                : 0.02,
            minHeight: 6,
            backgroundColor: isDark
                ? Colors.white.withAlpha(25)
                : const Color(0xFFE2E8F0),
            valueColor: AlwaysStoppedAnimation<Color>(
              theme.colorScheme.primary,
            ),
          ),
        ),
      ],
    );
  }
}

class _UnitCard extends StatefulWidget {
  const _UnitCard({
    super.key,
    required this.unit,
    required this.initiallyExpanded,
    required this.onStartLesson,
  });

  final Unit unit;
  final bool initiallyExpanded;
  final void Function(Lesson lesson) onStartLesson;

  @override
  State<_UnitCard> createState() => _UnitCardState();
}

class _UnitCardState extends State<_UnitCard> {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final unit = widget.unit;
    final isLocked = unit.isLocked;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withAlpha(8),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header (Tappable to expand / collapse)
          InkWell(
            onTap: isLocked
                ? null
                : () {
                    setState(() {
                      _isExpanded = !_isExpanded;
                    });
                  },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Unit number icon / badge
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: isLocked
                              ? (isDark
                                    ? Colors.white.withAlpha(15)
                                    : const Color(0xFFF1F5F9))
                              : (isDark
                                    ? theme.colorScheme.primary.withAlpha(40)
                                    : const Color(0xFFEFF6FF)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${unit.number}',
                          style: TextStyle(
                            color: isLocked
                                ? (isDark
                                      ? Colors.white38
                                      : const Color(0xFF94A3B8))
                                : theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Title & Subtitle
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              unit.title,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: isLocked
                                    ? (isDark
                                          ? Colors.white38
                                          : const Color(0xFF94A3B8))
                                    : null,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            // Requirement 3: lessons count (0/4 bài), progress (0%)
                            Text(
                              '${unit.completedCount}/${unit.totalCount} bài • ${unit.progressPercent}%',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: isDark
                                    ? Colors.white60
                                    : const Color(0xFF64748B),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Trailing: Lock icon or Chevron
                      if (isLocked)
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: isDark
                                ? Colors.white.withAlpha(10)
                                : const Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.lock_outline_rounded,
                            size: 18,
                            color: isDark
                                ? Colors.white38
                                : const Color(0xFF94A3B8),
                          ),
                        )
                      else
                        AnimatedRotation(
                          turns: _isExpanded ? 0.5 : 0.0,
                          duration: const Duration(milliseconds: 200),
                          child: const Icon(
                            Icons.keyboard_arrow_down_rounded,
                            size: 24,
                            color: Color(0xFF64748B),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(
                      value: unit.totalCount > 0
                          ? (unit.completedCount / unit.totalCount).clamp(
                              0.0,
                              1.0,
                            )
                          : 0.0,
                      minHeight: 5,
                      backgroundColor: isDark
                          ? Colors.white.withAlpha(20)
                          : const Color(0xFFE2E8F0),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isLocked
                            ? (isDark
                                  ? Colors.white24
                                  : const Color(0xFFCBD5E1))
                            : theme.colorScheme.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Lessons list when expanded
          if (_isExpanded && !isLocked) ...[
            Divider(
              height: 1,
              thickness: 1,
              color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                children: [
                  for (int i = 0; i < unit.lessons.length; i++) ...[
                    _buildLessonRow(
                      context: context,
                      lesson: unit.lessons[i],
                      onStart: () => widget.onStartLesson(unit.lessons[i]),
                    ),
                    if (i < unit.lessons.length - 1) const SizedBox(height: 8),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLessonRow({
    required BuildContext context,
    required Lesson lesson,
    required VoidCallback onStart,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDone = lesson.isCompleted;
    final isLocked = lesson.isLocked;

    // Dot indicator
    Widget dot;
    if (isDone) {
      dot = Container(
        width: 28,
        height: 28,
        decoration: const BoxDecoration(
          color: Color(0xFF10B981),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check_rounded, color: Colors.white, size: 16),
      );
    } else if (isLocked) {
      dot = Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withAlpha(20) : const Color(0xFFF1F5F9),
          shape: BoxShape.circle,
        ),
        child: Icon(
          Icons.lock_outline_rounded,
          size: 15,
          color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
        ),
      );
    } else {
      dot = Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: isDark
              ? theme.colorScheme.primary.withAlpha(40)
              : const Color(0xFFEFF6FF),
          shape: BoxShape.circle,
          border: Border.all(color: theme.colorScheme.primary, width: 2),
        ),
        child: Center(
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
              shape: BoxShape.circle,
            ),
          ),
        ),
      );
    }

    String statusText;
    if (isDone) {
      statusText = 'Đã hoàn thành';
    } else if (isLocked) {
      statusText = 'Hoàn thành bài trước để mở';
    } else {
      statusText = 'Chưa học';
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isLocked
            ? Colors.transparent
            : (isDark ? Colors.white.withAlpha(10) : const Color(0xFFF8FAFC)),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
        ),
      ),
      child: Row(
        children: [
          dot,
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lesson.title,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: isLocked
                        ? (isDark ? Colors.white38 : const Color(0xFF94A3B8))
                        : (isDark ? Colors.white : const Color(0xFF0F172A)),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  statusText,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDone
                        ? const Color(0xFF10B981)
                        : isLocked
                        ? (isDark ? Colors.white38 : const Color(0xFF94A3B8))
                        : (isDark ? Colors.white60 : const Color(0xFF64748B)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Requirement 4: "Bắt đầu" button per lesson
          ElevatedButton(
            onPressed: isLocked ? null : onStart,
            style: ElevatedButton.styleFrom(
              elevation: 0,
              backgroundColor: isDone
                  ? (isDark
                        ? Colors.white.withAlpha(25)
                        : const Color(0xFFEFF6FF))
                  : theme.colorScheme.primary,
              foregroundColor: isDone
                  ? theme.colorScheme.primary
                  : Colors.white,
              disabledBackgroundColor: isDark
                  ? Colors.white.withAlpha(10)
                  : const Color(0xFFF1F5F9),
              disabledForegroundColor: isDark
                  ? Colors.white24
                  : const Color(0xFF94A3B8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isLocked
                      ? 'Khóa'
                      : isDone
                      ? 'Học lại'
                      : 'Bắt đầu',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (!isLocked) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward_rounded, size: 14),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

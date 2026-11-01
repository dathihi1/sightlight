import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:sightlight_flutter/core/theme/app_theme.dart';
import 'package:sightlight_flutter/domain/entities/progress_stats.dart';
import 'package:sightlight_flutter/domain/entities/learning.dart';
import 'package:sightlight_flutter/presentation/providers/learning_provider.dart';
import 'package:sightlight_flutter/presentation/providers/auth_provider.dart';
import 'package:sightlight_flutter/presentation/providers/gamification_provider.dart';
import 'package:sightlight_flutter/presentation/widgets/activity_chart_widget.dart';
import 'package:sightlight_flutter/presentation/widgets/streak_tracker_widget.dart';

class _Milestone {
  const _Milestone({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.highlight,
  });

  final String id;
  final String title;
  final String description;
  final String status; // 'COMPLETED', 'IN_PROGRESS', 'UPCOMING'
  final String highlight;
}

class ProgressPage extends ConsumerWidget {
  const ProgressPage({super.key});

  void _showFreezeConfirmDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.ac_unit, color: Colors.blue),
            SizedBox(width: 8),
            Text('Đóng băng chuỗi Streak'),
          ],
        ),
        content: const Text(
          'Bạn có muốn dùng 1 lượt Đóng băng (Freeze) để bảo vệ chuỗi streak của bạn không bị mất khi nghỉ 1 ngày không?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref
                  .read(progressStatsProvider.notifier)
                  .freezeStreak();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success
                          ? 'Đã kích hoạt đóng băng streak thành công!'
                          : 'Kích hoạt đóng băng streak thành công!',
                    ),
                  ),
                );
              }
            },
            child: const Text('Đóng băng ngay'),
          ),
        ],
      ),
    );
  }

  List<_Milestone> _getMilestones(ProgressStats stats) {
    return [
      _Milestone(
        id: 'm-1',
        title: 'Khởi đầu hành trình VSL',
        description: 'Làm quen với văn hoá giao tiếp của người Điếc và cấu trúc không gian ký hiệu ba chiều.',
        status: stats.completedLessons >= 1 ? 'COMPLETED' : 'IN_PROGRESS',
        highlight: stats.completedLessons >= 1 ? 'Đã hoàn thành' : 'Đang học',
      ),
      _Milestone(
        id: 'm-2',
        title: 'Thành thạo Bảng chữ cái ngón tay',
        description: 'Thuần thục 29 chữ cái ngón tay và quy tắc đánh vần tên riêng, địa danh Việt Nam.',
        status: stats.completedLessons >= 2
            ? 'COMPLETED'
            : (stats.completedLessons >= 1 ? 'IN_PROGRESS' : 'UPCOMING'),
        highlight: stats.completedLessons >= 2
            ? 'Đã hoàn thành'
            : 'Đang chinh phục',
      ),
      _Milestone(
        id: 'm-3',
        title: 'Chinh phục AI Camera tương tác',
        description: 'Thực hành động tác trước Camera với mô hình nhận diện khung xương bàn tay tức thì.',
        status: stats.completedLessons >= 3
            ? 'COMPLETED'
            : (stats.completedLessons >= 2 ? 'IN_PROGRESS' : 'UPCOMING'),
        highlight: '${stats.averageScore}% Chuẩn xác',
      ),
      _Milestone(
        id: 'm-4',
        title: 'Giao tiếp Đời sống & Gia đình',
        description: 'Nắm vững 50 cụm từ chào hỏi, biểu đạt cảm xúc và đối thoại thông dụng.',
        status: stats.completedLessons >= 12
            ? 'COMPLETED'
            : (stats.completedLessons >= 3 ? 'IN_PROGRESS' : 'UPCOMING'),
        highlight: stats.completedLessons >= 12
            ? 'Đã hoàn thành'
            : 'Đang chinh phục',
      ),
      _Milestone(
        id: 'm-5',
        title: 'Đại sứ Kết nối Cộng đồng',
        description: 'Lan toả thông điệp học ngôn ngữ ký hiệu tới 100 người bạn và đồng nghiệp.',
        status: 'UPCOMING',
        highlight: 'Mục tiêu tiếp theo',
      ),
    ];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsState = ref.watch(progressStatsProvider);
    final selectedDays = ref.watch(activityDaysRangeProvider);
    final authState = ref.watch(authStateProvider);
    final units =
        ref.watch(learningPathProvider).valueOrNull?.units ??
        const <LearningUnit>[];
    final theme = Theme.of(context);
    final user = authState.valueOrNull;
    final learnerName =
        (user?.displayName != null && user!.displayName!.isNotEmpty)
        ? user.displayName!
        : (user?.email != null && user!.email.isNotEmpty)
        ? user.email.split('@').first
        : 'Viet Thang';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hành trình học tập'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Làm mới',
            onPressed: () =>
                ref.read(progressStatsProvider.notifier).loadStats(),
          ),
        ],
      ),
      body: statsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Lỗi: $err'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () =>
                    ref.read(progressStatsProvider.notifier).loadStats(),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
        data: (stats) {
          final milestones = _getMilestones(stats);
          const totalUnits = 17;
          final totalLessons = totalUnits * 4;

          return RefreshIndicator(
            onRefresh: () =>
                ref.read(progressStatsProvider.notifier).loadStats(),
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // 1. Stats Summary: Hero Profile & Overview
                _buildHeroStatsOverview(
                  context,
                  stats: stats,
                  learnerName: learnerName,
                  totalLessons: totalLessons,
                ),
                const SizedBox(height: 16),

                // 2. Stats summary 2x2 grid
                _buildStatsGrid(context, stats),
                const SizedBox(height: 20),

                // 3. Streak Tracker Widget (existing component)
                StreakTrackerWidget(
                  stats: stats,
                  onFreezePressed: () => _showFreezeConfirmDialog(context, ref),
                ),
                const SizedBox(height: 20),

                // 4. Calendar with Practice Days Marked
                _buildPracticeCalendarCard(context, ref, stats),
                const SizedBox(height: 20),

                // 5. Completed Units Visualization
                _buildCompletedUnitsSection(
                  context,
                  stats: stats,
                  units: units,
                  totalUnits: totalUnits,
                  totalLessons: totalLessons,
                ),
                const SizedBox(height: 20),

                // 6. Learning Journey Timeline (Milestones)
                _buildJourneyTimelineSection(context, milestones),
                const SizedBox(height: 20),

                // 7. Activity Chart (7 / 30 days)
                ActivityChartWidget(
                  activities: stats.recentActivities,
                  selectedDays: selectedDays,
                  dailyGoalMinutes: stats.dailyGoalMinutes,
                  onDaysChanged: (days) {
                    ref.read(activityDaysRangeProvider.notifier).state = days;
                  },
                ),
                const SizedBox(height: 20),

                // 8. Learning Quality Card
                _buildQualityCard(context, theme, stats),
              ],
            ),
          );
        },
      ),
    );
  }

  // --- 1. HERO STATS OVERVIEW ---
  Widget _buildHeroStatsOverview(
    BuildContext context, {
    required ProgressStats stats,
    required String learnerName,
    required int totalLessons,
  }) {
    final theme = Theme.of(context);
    final lessonPercent = totalLessons > 0
        ? ((stats.completedLessons / totalLessons) * 100).clamp(0, 100).toInt()
        : 0;
    final progressRatio = totalLessons > 0
        ? (stats.completedLessons / totalLessons).clamp(0.0, 1.0)
        : 0.0;
    final initial = learnerName.isNotEmpty ? learnerName[0].toUpperCase() : 'S';

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppTheme.primaryBlue.withAlpha(36),
                  child: Text(
                    initial,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        learnerName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${stats.completedLessons}/$totalLessons bài học ($lessonPercent%)',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: progressRatio,
                          minHeight: 6,
                          backgroundColor: Colors.grey.shade200,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppTheme.primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                FilledButton.icon(
                  onPressed: () => context.go('/'),
                  icon: const Icon(Icons.play_arrow, size: 16),
                  label: const Text('Học tiếp', style: TextStyle(fontSize: 12)),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // --- 2. STATS SUMMARY 2x2 GRID ---
  Widget _buildStatsGrid(BuildContext context, ProgressStats stats) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatTile(
                context,
                icon: Icons.local_fire_department,
                iconColor: Colors.deepOrange,
                value: '${stats.streakDays} ngày',
                label: 'Chuỗi ngày Streak',
                subLabel: 'Kỷ lục: ${stats.longestStreak} ngày',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatTile(
                context,
                icon: Icons.star_rounded,
                iconColor: Colors.amber.shade800,
                value: '${stats.expBalance} EXP',
                label: 'Điểm EXP tích lũy',
                subLabel: '${stats.totalMinutesLearned.toInt()} phút học',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatTile(
                context,
                icon: Icons.check_circle_outline,
                iconColor: Colors.green,
                value: '${stats.signsMastered}',
                label: 'Ký hiệu thành thạo',
                subLabel: 'Ký tự & giao tiếp',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatTile(
                context,
                icon: Icons.track_changes,
                iconColor: Colors.blue.shade700,
                value: '${stats.averageScore}%',
                label: 'Độ chuẩn AI',
                subLabel: 'Trung bình camera',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatTile(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
    String? subLabel,
  }) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: iconColor, size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            if (subLabel != null) ...[
              const SizedBox(height: 2),
              Text(
                subLabel,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // --- 4. CALENDAR WITH PRACTICE DAYS MARKED ---
  Widget _buildPracticeCalendarCard(
    BuildContext context,
    WidgetRef ref,
    ProgressStats stats,
  ) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final year = now.year;
    final month = now.month;

    // Total days in current month
    final totalDaysInMonth = DateTime(year, month + 1, 0).day;
    // Weekday of 1st day of month: Monday = 1, Sunday = 7
    final firstWeekday = DateTime(year, month, 1).weekday;
    final leadingBlanks = firstWeekday - 1;

    // Activity map for O(1) lookup
    final activityMap = <String, ActivityDay>{};
    for (final act in stats.recentActivities) {
      final key = '${act.date.year}-${act.date.month}-${act.date.day}';
      activityMap[key] = act;
    }

    // Count practice days in current month
    int practiceDaysCount = 0;
    for (int d = 1; d <= totalDaysInMonth; d++) {
      final key = '$year-$month-$d';
      final act = activityMap[key];
      final isToday = d == now.day;
      if (act != null && (act.minutes > 0 || act.goalMet)) {
        practiceDaysCount++;
      } else if (isToday && stats.goalMetToday) {
        practiceDaysCount++;
      }
    }

    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    final totalCells = leadingBlanks + totalDaysInMonth;
    final rowCount = (totalCells / 7).ceil();

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.deepOrange.withAlpha(25),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.calendar_month,
                    color: Colors.deepOrange,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Lịch luyện tập tháng $month/$year',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Đã tập $practiceDaysCount ngày trong tháng này',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: () => _showFreezeConfirmDialog(context, ref),
                  icon: const Icon(Icons.ac_unit, size: 14, color: Colors.blue),
                  label: Text(
                    'Đóng băng (${stats.freezeCount})',
                    style: const TextStyle(fontSize: 11, color: Colors.blue),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    side: const BorderSide(color: Colors.blue),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 12),

            // Weekday labels
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: weekdays
                  .map(
                    (w) => Expanded(
                      child: Center(
                        child: Text(
                          w,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 8),

            // Month Grid
            Column(
              children: List.generate(rowCount, (rowIndex) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: List.generate(7, (colIndex) {
                      final cellIndex = rowIndex * 7 + colIndex;
                      final dayNumber = cellIndex - leadingBlanks + 1;

                      if (cellIndex < leadingBlanks ||
                          dayNumber > totalDaysInMonth) {
                        return const Expanded(child: SizedBox(height: 32));
                      }

                      final isToday = dayNumber == now.day;
                      final isFuture = dayNumber > now.day;
                      final key = '$year-$month-$dayNumber';
                      final act = activityMap[key];
                      final isPracticed =
                          (act != null && (act.minutes > 0 || act.goalMet)) ||
                          (isToday && stats.goalMetToday);
                      final isGoalMet =
                          act?.goalMet ?? (isToday && stats.goalMetToday);

                      Color bgColor = Colors.transparent;
                      Color textColor = isFuture
                          ? Colors.grey.shade400
                          : Colors.grey.shade800;
                      Border? border;

                      if (isGoalMet) {
                        bgColor = Colors.green;
                        textColor = Colors.white;
                      } else if (isPracticed) {
                        bgColor = Colors.orange;
                        textColor = Colors.white;
                      } else if (isToday) {
                        bgColor = Colors.orange.shade50;
                        textColor = Colors.deepOrange;
                        border = Border.all(color: Colors.deepOrange, width: 2);
                      }

                      return Expanded(
                        child: Center(
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: bgColor,
                              border: border,
                            ),
                            child: Center(
                              child: isGoalMet
                                  ? const Icon(
                                      Icons.check,
                                      size: 16,
                                      color: Colors.white,
                                    )
                                  : Text(
                                      '$dayNumber',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: (isToday || isPracticed)
                                            ? FontWeight.bold
                                            : FontWeight.normal,
                                        color: textColor,
                                      ),
                                    ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                );
              }),
            ),
            const SizedBox(height: 12),

            // Legend
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildLegendItem(Colors.orange, 'Đã học'),
                const SizedBox(width: 14),
                _buildLegendItem(Colors.green, 'Đạt mục tiêu'),
                const SizedBox(width: 14),
                _buildLegendItem(Colors.grey.shade300, 'Chưa học'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  // --- 5. COMPLETED UNITS VISUALIZATION ---
  Widget _buildCompletedUnitsSection(
    BuildContext context, {
    required ProgressStats stats,
    required List<LearningUnit> units,
    required int totalUnits,
    required int totalLessons,
  }) {
    final theme = Theme.of(context);
    final completedUnitsCount = (stats.completedLessons ~/ 4).clamp(
      0,
      totalUnits,
    );

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.collections_bookmark_outlined,
                      color: AppTheme.primaryBlue,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Tiến độ theo Unit (Chương)',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Text(
                    '$completedUnitsCount/$totalUnits hoàn thành',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.green.shade800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Horizontal units list
            SizedBox(
              height: 130,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: totalUnits,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (ctx, index) {
                  final unitNumber = index + 1;
                  final unitTitle = units.length > index
                      ? units[index].title
                      : 'Unit $unitNumber';
                  final completedInUnit = (stats.completedLessons - index * 4)
                      .clamp(0, 4);
                  final isCompleted = completedInUnit >= 4;
                  final isInProgress =
                      (completedInUnit > 0 && completedInUnit < 4) ||
                      (stats.completedLessons == index * 4 &&
                          index == completedUnitsCount);
                  final isLocked = !isCompleted && !isInProgress;

                  return Container(
                    width: 155,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? Colors.green.withAlpha(12)
                          : isInProgress
                          ? AppTheme.primaryBlue.withAlpha(12)
                          : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isCompleted
                            ? Colors.green.shade200
                            : isInProgress
                            ? Colors.blue.shade200
                            : Colors.grey.shade200,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Unit $unitNumber',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: isCompleted
                                    ? Colors.green.shade800
                                    : isInProgress
                                    ? AppTheme.primaryBlue
                                    : Colors.grey.shade600,
                              ),
                            ),
                            if (isCompleted)
                              const Icon(
                                Icons.check_circle,
                                size: 16,
                                color: Colors.green,
                              )
                            else if (isInProgress)
                              const Icon(
                                Icons.play_circle_fill,
                                size: 16,
                                color: AppTheme.primaryBlue,
                              )
                            else
                              Icon(
                                Icons.lock_outline,
                                size: 14,
                                color: Colors.grey.shade400,
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Expanded(
                          child: Text(
                            unitTitle,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isLocked
                                  ? Colors.grey.shade500
                                  : Colors.black87,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: completedInUnit / 4.0,
                            minHeight: 4,
                            backgroundColor: Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              isCompleted ? Colors.green : AppTheme.primaryBlue,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$completedInUnit/4 bài hoàn thành',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- 6. LEARNING JOURNEY TIMELINE (MILESTONES) ---
  Widget _buildJourneyTimelineSection(
    BuildContext context,
    List<_Milestone> milestones,
  ) {
    final theme = Theme.of(context);

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.timeline,
                  color: AppTheme.primaryBlue,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Cột mốc đáng nhớ trong hành trình',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Từng bước chân kiên trì học hỏi và đồng hành cùng cộng đồng người Điếc.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 16),

            // Timeline Items
            ...milestones.asMap().entries.map((entry) {
              final index = entry.key;
              final m = entry.value;
              final isCompleted = m.status == 'COMPLETED';
              final isInProgress = m.status == 'IN_PROGRESS';
              final isLast = index == milestones.length - 1;

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Timeline indicator column
                    SizedBox(
                      width: 26,
                      child: Column(
                        children: [
                          Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isCompleted
                                  ? AppTheme.primaryBlue
                                  : Colors.white,
                              border: isCompleted
                                  ? null
                                  : Border.all(
                                      color: isInProgress
                                          ? AppTheme.primaryBlue
                                          : Colors.grey.shade300,
                                      width: 2,
                                    ),
                            ),
                            child: isCompleted
                                ? const Icon(
                                    Icons.check,
                                    size: 14,
                                    color: Colors.white,
                                  )
                                : (isInProgress
                                      ? Center(
                                          child: Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: AppTheme.primaryBlue,
                                            ),
                                          ),
                                        )
                                      : null),
                          ),
                          if (!isLast)
                            Expanded(
                              child: Container(
                                width: 2,
                                color: isCompleted
                                    ? AppTheme.primaryBlue.withAlpha(90)
                                    : Colors.grey.shade300,
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Card Content
                    Expanded(
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isCompleted
                              ? Colors.blue.withAlpha(10)
                              : isInProgress
                              ? Colors.white
                              : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isCompleted
                                ? AppTheme.primaryBlue.withAlpha(40)
                                : isInProgress
                                ? AppTheme.primaryBlue.withAlpha(120)
                                : Colors.grey.shade200,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    m.title,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: isCompleted || isInProgress
                                          ? const Color(0xFF0F172A)
                                          : Colors.grey.shade600,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 7,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isCompleted
                                        ? Colors.blue.shade50
                                        : isInProgress
                                        ? Colors.amber.shade50
                                        : Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isCompleted
                                          ? Colors.blue.shade200
                                          : isInProgress
                                          ? Colors.amber.shade200
                                          : Colors.grey.shade300,
                                    ),
                                  ),
                                  child: Text(
                                    m.highlight,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: isCompleted
                                          ? AppTheme.primaryBlue
                                          : isInProgress
                                          ? Colors.amber.shade900
                                          : Colors.grey.shade600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 5),
                            Text(
                              m.description,
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey.shade600,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  // --- 8. LEARNING QUALITY CARD ---
  Widget _buildQualityCard(
    BuildContext context,
    ThemeData theme,
    ProgressStats stats,
  ) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.auto_graph,
                color: Colors.green,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Điểm chính xác AI trung bình: ${stats.averageScore}%',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Luyện tập mỗi ngày giúp tăng độ chính xác của cử chỉ tay.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

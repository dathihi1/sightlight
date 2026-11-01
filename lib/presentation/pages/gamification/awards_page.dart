import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../domain/entities/award.dart';
import '../../providers/gamification_provider.dart';
import '../../widgets/badge_celebration_dialog.dart';

class AwardsPage extends ConsumerStatefulWidget {
  const AwardsPage({super.key});

  @override
  ConsumerState<AwardsPage> createState() => _AwardsPageState();
}

class _AwardsPageState extends ConsumerState<AwardsPage> {
  String _selectedCategory = 'Tất cả';

  void _celebrateBadge(BadgeItem badge) {
    BadgeCelebrationDialog.show(
      context,
      badge: badge,
      onCelebrated: () {
        ref.read(awardsProvider.notifier).celebrateBadge(badge.code);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final awardsState = ref.watch(awardsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thành tựu & Huy hiệu'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(awardsProvider.notifier).loadAwards(),
          ),
        ],
      ),
      body: awardsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Lỗi: $err'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.read(awardsProvider.notifier).loadAwards(),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
        data: (badges) {
          final categories = [
            'Tất cả',
            ...badges.map((b) => b.category).toSet(),
          ];

          final filteredBadges = _selectedCategory == 'Tất cả'
              ? badges
              : badges.where((b) => b.category == _selectedCategory).toList();

          final unlockedCount = badges.where((b) => b.isUnlocked).length;
          final totalExp = badges
              .where((b) => b.isUnlocked)
              .fold<int>(0, (sum, b) => sum + b.expReward);

          return RefreshIndicator(
            onRefresh: () => ref.read(awardsProvider.notifier).loadAwards(),
            child: CustomScrollView(
              slivers: [
                // Header summary card
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Container(
                      padding: const EdgeInsets.all(20.0),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.amber.shade700,
                            Colors.orange.shade500,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.orange.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.25),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.emoji_events,
                              size: 40,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Huy hiệu mở khóa',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '$unlockedCount / ${badges.length}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '+$totalExp EXP thưởng đã nhận',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Category filter chips
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 44,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      scrollDirection: Axis.horizontal,
                      itemCount: categories.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, i) {
                        final cat = categories[i];
                        final isSelected = cat == _selectedCategory;
                        return ChoiceChip(
                          label: Text(cat),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedCategory = cat;
                              });
                            }
                          },
                        );
                      },
                    ),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),

                // Badges Grid
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 0.72,
                        ),
                    delegate: SliverChildBuilderDelegate((context, index) {
                      final badge = filteredBadges[index];
                      return _buildBadgeCard(context, badge);
                    }, childCount: filteredBadges.length),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBadgeCard(BuildContext context, BadgeItem badge) {
    final isUnlocked = badge.isUnlocked;
    final isCelebrated = badge.isCelebrated;

    return Card(
      elevation: isUnlocked ? 2 : 0.5,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isUnlocked
            ? BorderSide(color: Colors.amber.shade400, width: 1.5)
            : BorderSide(color: Colors.grey.shade300, width: 0.5),
      ),
      color: isUnlocked ? Colors.white : Colors.grey.shade50,
      child: InkWell(
        onTap: () {
          if (isUnlocked) {
            _celebrateBadge(badge);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  '${badge.title}: Đã hoàn thành ${badge.currentValue}/${badge.targetValue}',
                ),
                duration: const Duration(seconds: 2),
              ),
            );
          }
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Badge Icon with lock/level badge
              Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isUnlocked
                          ? Colors.amber.shade100
                          : Colors.grey.shade200,
                    ),
                    child: Icon(
                      isUnlocked ? Icons.military_tech : Icons.lock_outline,
                      size: 32,
                      color: isUnlocked
                          ? Colors.amber.shade900
                          : Colors.grey.shade500,
                    ),
                  ),
                  if (isUnlocked && !isCelebrated)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),

              // Level indicator
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isUnlocked
                      ? Colors.orange.shade50
                      : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Cấp ${badge.level}/${badge.maxLevel}',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isUnlocked
                        ? Colors.orange.shade800
                        : Colors.grey.shade600,
                  ),
                ),
              ),
              const SizedBox(height: 6),

              // Title
              Text(
                badge.title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: isUnlocked ? Colors.black87 : Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 4),

              // Description
              Expanded(
                child: Text(
                  badge.description,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    color: isUnlocked
                        ? Colors.grey.shade700
                        : Colors.grey.shade500,
                  ),
                ),
              ),
              const SizedBox(height: 6),

              // Progress bar
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: badge.progressRatio,
                  minHeight: 5,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isUnlocked ? Colors.amber.shade700 : Colors.blue.shade300,
                  ),
                ),
              ),
              const SizedBox(height: 4),

              // Status / Celebrate button
              if (isUnlocked && !isCelebrated)
                SizedBox(
                  height: 26,
                  child: TextButton(
                    onPressed: () => _celebrateBadge(badge),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      visualDensity: VisualDensity.compact,
                    ),
                    child: const Text(
                      'Ăn mừng 🎉',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                )
              else
                Text(
                  isUnlocked
                      ? 'Đã mở khóa'
                      : '${badge.currentValue}/${badge.targetValue}',
                  style: TextStyle(
                    fontSize: 10,
                    color: isUnlocked ? Colors.green : Colors.grey.shade600,
                    fontWeight: isUnlocked
                        ? FontWeight.bold
                        : FontWeight.normal,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

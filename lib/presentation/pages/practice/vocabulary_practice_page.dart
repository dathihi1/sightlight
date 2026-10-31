import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sightlight_flutter/presentation/providers/practice_provider.dart';
import 'package:sightlight_flutter/presentation/widgets/sign_video_player.dart';

class VocabularyPracticePage extends ConsumerWidget {
  const VocabularyPracticePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(vocabularyPracticeProvider);
    final notifier = ref.read(vocabularyPracticeProvider.notifier);

    if (state.isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện tập Từ vựng')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Đang khởi tạo phiên luyện tập...'),
            ],
          ),
        ),
      );
    }

    if (state.errorMessage != null && state.session == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện tập Từ vựng')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 12),
                Text(
                  'Không thể tải phiên luyện tập',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  state.errorMessage!,
                  style: theme.textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  icon: const Icon(Icons.refresh),
                  label: const Text('Thử lại'),
                  onPressed: notifier.restart,
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (state.isCompleted) {
      return _buildCompletionScreen(context, ref, state, notifier);
    }

    final question = state.currentQuestion;
    if (question == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện tập Từ vựng')),
        body: const Center(child: Text('Không có câu hỏi')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Luyện tập Từ vựng',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.stars_rounded,
                  size: 18,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  '${state.score}/${state.totalQuestions}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Linear progress bar
          LinearProgressIndicator(
            value: state.progress,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
            minHeight: 6,
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Question counter
                  Text(
                    'Câu hỏi ${state.currentIndex + 1} / ${state.totalQuestions}',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Hãy quan sát video và chọn từ đúng:',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Video Player
                  SignVideoPlayer(
                    videoUrl: question.videoUrl,
                    height: 230,
                    placeholderText:
                        'Ký hiệu "${question.word}"\n(Đang tải video...)',
                  ),
                  const SizedBox(height: 20),

                  // 4 Options Grid/List
                  ...question.options.map((option) {
                    final isSelected = state.selectedAnswer == option;
                    final isCorrectAnswer =
                        option.trim().toLowerCase() ==
                            question.correctAnswer.trim().toLowerCase();

                    Color? btnBg;
                    Color? btnFg;
                    BorderSide border = BorderSide(
                      color: theme.colorScheme.outlineVariant,
                    );

                    if (state.isAnswered) {
                      if (isCorrectAnswer) {
                        btnBg = Colors.green.shade50;
                        btnFg = Colors.green.shade900;
                        border = const BorderSide(color: Colors.green, width: 2);
                      } else if (isSelected && !state.isCorrect) {
                        btnBg = Colors.red.shade50;
                        btnFg = Colors.red.shade900;
                        border = const BorderSide(color: Colors.red, width: 2);
                      }
                    } else if (isSelected) {
                      btnBg = theme.colorScheme.primaryContainer;
                      btnFg = theme.colorScheme.onPrimaryContainer;
                      border = BorderSide(
                        color: theme.colorScheme.primary,
                        width: 2,
                      );
                    }

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          backgroundColor: btnBg,
                          side: border,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          alignment: Alignment.centerLeft,
                        ),
                        onPressed: state.isAnswered
                            ? null
                            : () => notifier.selectAnswer(option),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                option,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: btnFg ?? theme.colorScheme.onSurface,
                                ),
                              ),
                            ),
                            if (state.isAnswered)
                              if (isCorrectAnswer)
                                const Icon(
                                  Icons.check_circle_rounded,
                                  color: Colors.green,
                                )
                              else if (isSelected)
                                const Icon(
                                  Icons.cancel_rounded,
                                  color: Colors.red,
                                ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),

          // Bottom Bar: Feedback & Next button
          if (state.isAnswered)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: state.isCorrect
                    ? Colors.green.shade50
                    : Colors.red.shade50,
                border: Border(
                  top: BorderSide(
                    color: state.isCorrect
                        ? Colors.green.shade200
                        : Colors.red.shade200,
                  ),
                ),
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Icon(
                      state.isCorrect
                          ? Icons.check_circle
                          : Icons.info_outline,
                      color: state.isCorrect ? Colors.green : Colors.red,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            state.isCorrect
                                ? 'Chính xác! Xuất sắc.'
                                : 'Chưa đúng rồi!',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: state.isCorrect
                                  ? Colors.green.shade900
                                  : Colors.red.shade900,
                            ),
                          ),
                          if (!state.isCorrect)
                            Text(
                              'Đáp án: "${question.correctAnswer}"',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.red.shade800,
                              ),
                            ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: state.isCorrect
                            ? Colors.green.shade700
                            : Colors.red.shade700,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: notifier.nextQuestion,
                      child: Text(
                        state.currentIndex + 1 < state.totalQuestions
                            ? 'Tiếp theo'
                            : 'Hoàn tất',
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCompletionScreen(
    BuildContext context,
    WidgetRef ref,
    VocabularyPracticeState state,
    VocabularyPracticeNotifier notifier,
  ) {
    final theme = Theme.of(context);
    final percentage = state.totalQuestions > 0
        ? ((state.score / state.totalQuestions) * 100).round()
        : 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Kết quả luyện tập')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: percentage >= 80
                      ? Colors.amber.shade100
                      : theme.colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    percentage >= 80
                        ? Icons.emoji_events_rounded
                        : Icons.thumb_up_alt_rounded,
                    size: 48,
                    color: percentage >= 80
                        ? Colors.amber.shade800
                        : theme.colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                percentage >= 80 ? 'Tuyệt vời!' : 'Hoàn thành bài tập!',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Bạn đã trả lời đúng $percentage% câu hỏi',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 24),

              // Score card
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem(
                      context,
                      'Tổng số câu',
                      '${state.totalQuestions}',
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: theme.colorScheme.outlineVariant,
                    ),
                    _buildStatItem(
                      context,
                      'Đúng',
                      '${state.score}',
                      color: Colors.green,
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: theme.colorScheme.outlineVariant,
                    ),
                    _buildStatItem(
                      context,
                      'Chính xác',
                      '$percentage%',
                      color: theme.colorScheme.primary,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Action buttons
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.replay),
                  label: const Text('Luyện lại phiên này'),
                  onPressed: notifier.restart,
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Về danh mục luyện tập'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String label,
    String val, {
    Color? color,
  }) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Text(
          val,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

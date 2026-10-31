import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sightlight_flutter/presentation/providers/practice_provider.dart';
import 'package:sightlight_flutter/presentation/widgets/sign_video_player.dart';

class NumbersPracticePage extends ConsumerWidget {
  const NumbersPracticePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(numbersPracticeProvider);
    final notifier = ref.read(numbersPracticeProvider.notifier);

    if (state.isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện tập Số đếm')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Đang nạp bài luyện số đếm...'),
            ],
          ),
        ),
      );
    }

    if (state.errorMessage != null && state.session == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện tập Số đếm')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 12),
                Text(
                  'Không thể tải bài tập số đếm',
                  style: theme.textTheme.titleMedium,
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
      return _buildCompletionScreen(context, state, notifier);
    }

    final question = state.currentQuestion;
    if (question == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện tập Số đếm')),
        body: const Center(child: Text('Không có câu hỏi')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Luyện tập Số đếm',
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
                  Icons.pin_outlined,
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
                  Text(
                    'Câu hỏi ${state.currentIndex + 1} / ${state.totalQuestions}',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Ký hiệu số này biểu thị số mấy?',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Video Player
                  SignVideoPlayer(
                    videoUrl: question.videoUrl,
                    height: 230,
                    placeholderText: 'Ký hiệu "${question.word}"',
                  ),
                  const SizedBox(height: 20),

                  // 4 Option Buttons in a 2x2 Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 2.2,
                    children: question.options.map((option) {
                      final isSelected = state.selectedAnswer == option;
                      final isCorrect = option.trim().toLowerCase() ==
                          question.correctAnswer.trim().toLowerCase();

                      Color? bg;
                      Color? fg;
                      BorderSide border = BorderSide(
                        color: theme.colorScheme.outlineVariant,
                      );

                      if (state.isAnswered) {
                        if (isCorrect) {
                          bg = Colors.green.shade50;
                          fg = Colors.green.shade900;
                          border = const BorderSide(color: Colors.green, width: 2);
                        } else if (isSelected && !state.isCorrect) {
                          bg = Colors.red.shade50;
                          fg = Colors.red.shade900;
                          border = const BorderSide(color: Colors.red, width: 2);
                        }
                      } else if (isSelected) {
                        bg = theme.colorScheme.primaryContainer;
                        fg = theme.colorScheme.onPrimaryContainer;
                        border = BorderSide(
                          color: theme.colorScheme.primary,
                          width: 2,
                        );
                      }

                      return OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          backgroundColor: bg,
                          side: border,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: state.isAnswered
                            ? null
                            : () => notifier.selectAnswer(option),
                        child: Text(
                          option,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: fg ?? theme.colorScheme.onSurface,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Bar (Answer feedback & Next button)
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
                      state.isCorrect ? Icons.check_circle : Icons.error,
                      color: state.isCorrect ? Colors.green : Colors.red,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        state.isCorrect
                            ? 'Chính xác! Bạn nhận biết số rất nhanh.'
                            : 'Chưa đúng! Đáp án đúng là "${question.correctAnswer}"',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: state.isCorrect
                              ? Colors.green.shade900
                              : Colors.red.shade900,
                        ),
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: state.isCorrect
                            ? Colors.green.shade700
                            : Colors.red.shade700,
                        foregroundColor: Colors.white,
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
    VocabularyPracticeState state,
    NumbersPracticeNotifier notifier,
  ) {
    final theme = Theme.of(context);
    final percentage = state.totalQuestions > 0
        ? ((state.score / state.totalQuestions) * 100).round()
        : 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Kết quả luyện số đếm')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.tag_faces_rounded,
                size: 72,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                'Hoàn thành bài tập số đếm!',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Đạt $percentage% (${state.score}/${state.totalQuestions} câu đúng)',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.replay),
                  label: const Text('Luyện lại'),
                  onPressed: notifier.restart,
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Quay lại'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

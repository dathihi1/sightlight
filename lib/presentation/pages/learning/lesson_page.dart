import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/learning.dart';
import '../../providers/gamification_provider.dart';
import '../../providers/learning_provider.dart';
import '../../widgets/sign_video_player.dart';

class LessonPage extends ConsumerStatefulWidget {
  const LessonPage({super.key, required this.lessonId});

  final String lessonId;

  @override
  ConsumerState<LessonPage> createState() => _LessonPageState();
}

class _LessonPageState extends ConsumerState<LessonPage> {
  final Stopwatch _activeTime = Stopwatch()..start();
  final Stopwatch _questionTime = Stopwatch()..start();
  final TextEditingController _textController = TextEditingController();

  String? _loadedLessonId;
  int _currentIndex = 0;
  bool _showIntro = true;
  String? _selectedOptionId;
  String? _selectedMatchPrompt;
  List<String> _orderedTokens = [];
  List<String> _availableTokens = [];
  List<LessonMatchPair> _matches = [];
  AnswerFeedback? _feedback;
  LessonCompletion? _completion;
  bool _submitting = false;
  bool _completing = false;
  int _answeredCount = 0;

  @override
  void dispose() {
    _activeTime.stop();
    _questionTime.stop();
    _textController.dispose();
    super.dispose();
  }

  void _initializeLesson(LessonDetail lesson) {
    if (_loadedLessonId == lesson.id) return;
    _loadedLessonId = lesson.id;
    _currentIndex = lesson.exercises.isEmpty
        ? 0
        : lesson.resumeAtIndex.clamp(0, lesson.exercises.length - 1);
    _showIntro = lesson.blocks.isNotEmpty;
    if (lesson.exercises.isNotEmpty) {
      _resetAnswer(lesson.exercises[_currentIndex]);
    }
  }

  void _resetAnswer(LessonExercise exercise) {
    _selectedOptionId = null;
    _selectedMatchPrompt = null;
    _orderedTokens = [];
    _availableTokens = List<String>.from(exercise.tokens);
    _matches = [];
    _feedback = null;
    _textController.clear();
    _questionTime
      ..reset()
      ..start();
  }

  Future<void> _submit(LessonExercise exercise) async {
    if (_submitting || _feedback != null) return;

    final typedAnswer = _textController.text.trim();
    switch (exercise.type) {
      case 'SIGN_TO_MEANING':
      case 'MEANING_TO_SIGN':
        if (_selectedOptionId == null) {
          _showMessage('Chọn một đáp án để kiểm tra.');
          return;
        }
      case 'TYPE_WHAT_YOU_SEE':
      case 'SIGN_VIDEO_RECALL':
        if (typedAnswer.isEmpty) {
          _showMessage('Nhập câu trả lời để kiểm tra.');
          return;
        }
      case 'SENTENCE_ORDER':
        if (_orderedTokens.length != exercise.tokens.length) {
          _showMessage('Hãy chọn đủ các từ để hoàn thành câu.');
          return;
        }
      case 'MATCH_SIGN_MEANING':
        if (_matches.length != exercise.options.length) {
          _showMessage('Hãy ghép đủ các ký hiệu với ý nghĩa tương ứng.');
          return;
        }
      default:
        if (exercise.options.isNotEmpty && _selectedOptionId == null) {
          _showMessage('Chọn một đáp án để kiểm tra.');
          return;
        }
    }

    setState(() => _submitting = true);
    try {
      final result = await ref
          .read(learningRepositoryProvider)
          .submitAnswer(
            lessonId: widget.lessonId,
            exerciseId: exercise.id,
            answerType: exercise.type,
            selectedOptionId: _selectedOptionId,
            typedAnswer: typedAnswer.isEmpty ? null : typedAnswer,
            orderedTokens: exercise.type == 'SENTENCE_ORDER'
                ? _orderedTokens
                : null,
            matches: exercise.type == 'MATCH_SIGN_MEANING' ? _matches : null,
            clientElapsedMs: _questionTime.elapsedMilliseconds.clamp(0, 600000),
          );
      if (!mounted) return;
      setState(() {
        _feedback = result;
        _answeredCount++;
      });
    } catch (error) {
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _continueLesson(LessonDetail lesson) {
    if (_currentIndex < lesson.exercises.length - 1) {
      setState(() {
        _currentIndex++;
        _resetAnswer(lesson.exercises[_currentIndex]);
      });
      return;
    }
    _complete();
  }

  Future<void> _complete() async {
    if (_completing) return;
    setState(() => _completing = true);
    try {
      final result = await ref
          .read(learningRepositoryProvider)
          .completeLesson(
            widget.lessonId,
            activeSeconds: _activeTime.elapsed.inSeconds.clamp(15, 1800),
          );
      ref.invalidate(learningPathProvider);
      ref.read(progressStatsProvider.notifier).loadStats();
      if (mounted) setState(() => _completion = result);
    } catch (error) {
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _completing = false);
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final lessonAsync = ref.watch(lessonDetailProvider(widget.lessonId));
    return Scaffold(
      body: SafeArea(
        child: lessonAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _LessonError(
            message: error.toString().replaceFirst('Exception: ', ''),
            onRetry: () =>
                ref.invalidate(lessonDetailProvider(widget.lessonId)),
          ),
          data: (lesson) {
            _initializeLesson(lesson);
            if (_completion != null) return _buildCompletion(_completion!);
            if (_showIntro) return _buildIntro(lesson);
            if (lesson.exercises.isEmpty) return _buildEmptyLesson();
            return _buildExerciseFlow(lesson);
          },
        ),
      ),
    );
  }

  Widget _buildTopBar({required double progress}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 20, 8),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Thoát bài học',
            onPressed: () => context.pop(),
            icon: const Icon(Icons.close_rounded),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                minHeight: 12,
                value: progress.clamp(0, 1),
                backgroundColor: Theme.of(context)
                    .colorScheme
                    .surfaceContainerHighest,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIntro(LessonDetail lesson) {
    return Column(
      children: [
        _buildTopBar(progress: 0),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.school_rounded,
                    size: 38,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                lesson.title,
                style: Theme.of(context).textTheme.headlineMedium
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              if (lesson.summary.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  lesson.summary,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),
              ],
              if (lesson.estimatedMinutes > 0) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 20),
                    const SizedBox(width: 8),
                    Text('${lesson.estimatedMinutes} phút'),
                  ],
                ),
              ],
              const SizedBox(height: 24),
              ...lesson.blocks.map(_buildBlock),
            ],
          ),
        ),
        _BottomAction(
          child: FilledButton.icon(
            onPressed: () => setState(() => _showIntro = false),
            icon: const Icon(Icons.play_arrow_rounded),
            label: const Text('Bắt đầu bài học'),
          ),
        ),
      ],
    );
  }

  Widget _buildExerciseFlow(LessonDetail lesson) {
    final exercise = lesson.exercises[_currentIndex];
    final done = _currentIndex + (_feedback == null ? 0 : 1);
    return Column(
      children: [
        _buildTopBar(progress: done / lesson.exercises.length),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
          child: Row(
            children: [
              Text(
                'Câu ${_currentIndex + 1}/${lesson.exercises.length}',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              if (exercise.skill?.isNotEmpty == true)
                _InfoChip(label: exercise.skill!),
              if (exercise.difficulty?.isNotEmpty == true) ...[
                const SizedBox(width: 6),
                _InfoChip(label: exercise.difficulty!),
              ],
            ],
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (exercise.instruction.isNotEmpty)
                  Text(
                    exercise.instruction,
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                if (exercise.prompt.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    exercise.prompt,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
                const SizedBox(height: 18),
                _buildExercise(exercise),
                if (_feedback != null) ...[
                  const SizedBox(height: 18),
                  _buildFeedback(_feedback!),
                ],
              ],
            ),
          ),
        ),
        _BottomAction(
          child: _feedback == null
              ? FilledButton(
                  onPressed: _submitting ? null : () => _submit(exercise),
                  child: _submitting
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Kiểm tra'),
                )
              : FilledButton.icon(
                  onPressed: _completing ? null : () => _continueLesson(lesson),
                  icon: _completing
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.arrow_forward_rounded),
                  label: Text(
                    _currentIndex < lesson.exercises.length - 1
                        ? 'Câu tiếp theo'
                        : 'Hoàn thành',
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildExercise(LessonExercise exercise) {
    switch (exercise.type) {
      case 'SIGN_TO_MEANING':
      case 'MEANING_TO_SIGN':
        return _buildChoiceExercise(exercise);
      case 'TYPE_WHAT_YOU_SEE':
      case 'SIGN_VIDEO_RECALL':
        return _buildTypedExercise(exercise);
      case 'SENTENCE_ORDER':
        return _buildSentenceOrder(exercise);
      case 'MATCH_SIGN_MEANING':
        return _buildMatchExercise(exercise);
      default:
        return exercise.options.isNotEmpty
            ? _buildChoiceExercise(exercise)
            : _buildTypedExercise(exercise);
    }
  }

  Widget _buildChoiceExercise(LessonExercise exercise) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (exercise.videoUrl?.isNotEmpty == true) ...[
          SignVideoPlayer(videoUrl: exercise.videoUrl!, height: 220),
          const SizedBox(height: 16),
        ],
        ...exercise.options.asMap().entries.map((entry) {
          final option = entry.value;
          final selected = _selectedOptionId == option.id;
          final correct =
              _feedback != null &&
              (_feedback!.correctOptionId == option.id ||
                  (_feedback!.correct && selected));
          final wrong = _feedback != null && selected && !correct;
          final color = correct
              ? Colors.green
              : wrong
              ? Colors.red
              : Theme.of(context).colorScheme.primary;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: selected || correct || wrong
                  ? color.withAlpha(20)
                  : Theme.of(context).colorScheme.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
                side: BorderSide(
                  color: selected || correct || wrong
                      ? color
                      : Theme.of(context).colorScheme.outlineVariant,
                  width: selected || correct || wrong ? 2 : 1,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: _feedback == null
                    ? () => setState(() => _selectedOptionId = option.id)
                    : null,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    children: [
                      if (exercise.type == 'MEANING_TO_SIGN' &&
                          option.videoUrl?.isNotEmpty == true) ...[
                        SignVideoPlayer(
                          videoUrl: option.videoUrl!,
                          autoPlay: false,
                          height: 150,
                        ),
                        const SizedBox(height: 10),
                      ],
                      Row(
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: selected || correct || wrong
                                  ? color
                                  : Theme.of(context)
                                        .colorScheme
                                        .surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: selected || correct || wrong
                                ? Icon(
                                    correct
                                        ? Icons.check_rounded
                                        : wrong
                                        ? Icons.close_rounded
                                        : Icons.circle,
                                    color: Colors.white,
                                    size: 20,
                                  )
                                : Text('${entry.key + 1}'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              option.label.isEmpty
                                  ? 'Lựa chọn ${entry.key + 1}'
                                  : option.label,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildTypedExercise(LessonExercise exercise) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (exercise.videoUrl?.isNotEmpty == true) ...[
          SignVideoPlayer(videoUrl: exercise.videoUrl!, height: 240),
          const SizedBox(height: 18),
        ],
        TextField(
          controller: _textController,
          enabled: _feedback == null,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            labelText: 'Câu trả lời của bạn',
            hintText: 'Nhập câu trả lời...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
      ],
    );
  }

  Widget _buildSentenceOrder(LessonExercise exercise) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          constraints: const BoxConstraints(minHeight: 92),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
          child: _orderedTokens.isEmpty
              ? const Center(child: Text('Chạm các từ theo thứ tự đúng'))
              : Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _orderedTokens.asMap().entries.map((entry) {
                    return InputChip(
                      label: Text(entry.value),
                      onDeleted: _feedback == null
                          ? () => setState(() {
                              final token = _orderedTokens.removeAt(entry.key);
                              _availableTokens.add(token);
                            })
                          : null,
                    );
                  }).toList(),
                ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _availableTokens.asMap().entries.map((entry) {
            return ActionChip(
              label: Text(entry.value),
              onPressed: _feedback == null
                  ? () => setState(() {
                      final token = _availableTokens.removeAt(entry.key);
                      _orderedTokens.add(token);
                    })
                  : null,
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildMatchExercise(LessonExercise exercise) {
    final options = exercise.options;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          _selectedMatchPrompt == null
              ? 'Chọn một ký hiệu, sau đó chọn ý nghĩa tương ứng.'
              : 'Bây giờ hãy chọn ý nghĩa ở cột bên phải.',
        ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                children: options.asMap().entries.map((entry) {
                  final option = entry.value;
                  final selected = _selectedMatchPrompt == option.id;
                  final matched = _matches.any(
                    (pair) => pair.promptId == option.id,
                  );
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      onTap: _feedback == null
                          ? () =>
                                setState(() => _selectedMatchPrompt = option.id)
                          : null,
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: selected
                              ? Theme.of(context).colorScheme.primaryContainer
                              : Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(context).colorScheme.outlineVariant,
                          ),
                        ),
                        child: Column(
                          children: [
                            if (option.videoUrl?.isNotEmpty == true)
                              SignVideoPlayer(
                                videoUrl: option.videoUrl!,
                                autoPlay: false,
                                height: 94,
                              )
                            else
                              const SizedBox(
                                height: 70,
                                child: Icon(Icons.sign_language_rounded),
                              ),
                            const SizedBox(height: 6),
                            Text(
                              matched
                                  ? 'Đã ghép ✓'
                                  : 'Ký hiệu ${entry.key + 1}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                children: options.map((option) {
                  final used = _matches.any(
                    (pair) => pair.optionId == option.id,
                  );
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed:
                            _feedback == null && _selectedMatchPrompt != null
                            ? () => _pairMeaning(option.id)
                            : null,
                        style: OutlinedButton.styleFrom(
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.all(14),
                          backgroundColor: used
                              ? Colors.green.withAlpha(18)
                              : null,
                          side: BorderSide(
                            color: used
                                ? Colors.green
                                : Theme.of(context).colorScheme.outlineVariant,
                          ),
                        ),
                        child: Text(
                          '${used ? '✓ ' : ''}${option.label}',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _pairMeaning(String optionId) {
    final promptId = _selectedMatchPrompt;
    if (promptId == null) return;
    setState(() {
      _matches.removeWhere(
        (pair) => pair.promptId == promptId || pair.optionId == optionId,
      );
      _matches.add(LessonMatchPair(promptId: promptId, optionId: optionId));
      _selectedMatchPrompt = null;
    });
  }

  Widget _buildFeedback(AnswerFeedback result) {
    final color = result.correct ? Colors.green : Colors.red;
    const praise = ['Chính xác!', 'Tuyệt vời!', 'Làm tốt lắm!', 'Quá chuẩn!'];
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withAlpha(18),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withAlpha(100)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: color,
            foregroundColor: Colors.white,
            child: Icon(
              result.correct ? Icons.check_rounded : Icons.close_rounded,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.correct
                      ? praise[_answeredCount % praise.length]
                      : 'Chưa đúng rồi',
                  style: TextStyle(
                    color: color,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (!result.correct && result.correctAnswerText != null) ...[
                  const SizedBox(height: 4),
                  Text('Đáp án đúng: ${result.correctAnswerText}'),
                ],
                if (!result.correct && result.willRepeat) ...[
                  const SizedBox(height: 4),
                  const Text('Câu này sẽ quay lại để bạn luyện thêm.'),
                ],
                if (result.explanationVideoUrl?.isNotEmpty == true) ...[
                  const SizedBox(height: 12),
                  SignVideoPlayer(
                    videoUrl: result.explanationVideoUrl!,
                    autoPlay: false,
                    height: 170,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlock(LessonBlock block) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (block.title.isNotEmpty)
              Text(
                block.title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
            if (block.bodyText.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(block.bodyText),
            ],
            if (block.mediaRef?.startsWith('http') == true) ...[
              const SizedBox(height: 12),
              SignVideoPlayer(videoUrl: block.mediaRef!, height: 210),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyLesson() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.menu_book_outlined, size: 54),
            const SizedBox(height: 12),
            const Text('Bài học chưa có câu hỏi.'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.pop(),
              child: const Text('Quay lại lộ trình'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletion(LessonCompletion result) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 112,
              height: 112,
              decoration: BoxDecoration(
                color: Colors.amber.withAlpha(35),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.emoji_events_rounded,
                color: Colors.amber,
                size: 68,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              result.scorePercent == 100 ? 'Hoàn hảo!' : 'Hoàn thành bài học!',
              style: Theme.of(context).textTheme.headlineMedium
                  ?.copyWith(fontWeight: FontWeight.w900),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _ResultStat(
                  icon: Icons.star_rounded,
                  label: 'EXP',
                  value: '+${result.earnedExp}',
                  color: Colors.amber.shade700,
                ),
                const SizedBox(width: 12),
                _ResultStat(
                  icon: Icons.check_circle_rounded,
                  label: 'Chính xác',
                  value: '${result.scorePercent}%',
                  color: Colors.green,
                ),
              ],
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => context.pop(),
                child: const Text('Tiếp tục lộ trình'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BottomAction extends StatelessWidget {
  const _BottomAction({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withAlpha(245),
        border: Border(
          top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
        ),
      ),
      child: SizedBox(height: 52, child: child),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _ResultStat extends StatelessWidget {
  const _ResultStat({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
        decoration: BoxDecoration(
          color: color.withAlpha(18),
          border: Border.all(color: color.withAlpha(80)),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(color: color, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: color),
                const SizedBox(width: 6),
                Text(
                  value,
                  style: TextStyle(
                    color: color,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LessonError extends StatelessWidget {
  const _LessonError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Thử lại')),
          ],
        ),
      ),
    );
  }
}

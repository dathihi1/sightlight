import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sightlight_flutter/presentation/providers/practice_provider.dart';

class FingerspellPage extends ConsumerWidget {
  const FingerspellPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(fingerspellPracticeProvider);
    final notifier = ref.read(fingerspellPracticeProvider.notifier);

    if (state.isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện Bảng Chữ Cái & Đánh Vần')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Đang nạp bài luyện đánh vần ngón tay...'),
            ],
          ),
        ),
      );
    }

    if (state.errorMessage != null && state.session == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện Bảng Chữ Cái & Đánh Vần')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 12),
                Text(
                  'Không thể tải dữ liệu luyện tập',
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

    final item = state.currentItem;
    if (item == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Luyện Bảng Chữ Cái & Đánh Vần')),
        body: const Center(child: Text('Không có bài tập')),
      );
    }

    final targetLetters = item.letters;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Đánh Vần Ngón Tay',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          // Camera Toggle Button
          IconButton(
            icon: Icon(
              state.showCamera ? Icons.videocam : Icons.videocam_outlined,
              color: state.showCamera ? theme.colorScheme.primary : null,
            ),
            tooltip: state.showCamera ? 'Tắt Camera' : 'Bật Camera AI',
            onPressed: notifier.toggleCamera,
          ),
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
                  '${state.score}/${state.totalItems}',
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
                  // Camera simulation / preview mode
                  if (state.showCamera) ...[
                    _buildCameraSection(context, notifier),
                    const SizedBox(height: 16),
                  ],

                  // Word prompt card
                  Card(
                    elevation: 0,
                    color: theme.colorScheme.primaryContainer.withValues(alpha: 0.35),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            'Từ cần đánh vần:',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item.word,
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              letterSpacing: 4,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.hint,
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontStyle: FontStyle.italic,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Slots displaying entered letters vs target length
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(targetLetters.length, (index) {
                      final hasChar = index < state.enteredLetters.length;
                      final char = hasChar ? state.enteredLetters[index] : '';

                      Color boxBorder = theme.colorScheme.outlineVariant;
                      Color boxBg = theme.colorScheme.surface;

                      if (state.isAnswered) {
                        boxBg = state.isCorrect
                            ? Colors.green.shade50
                            : Colors.red.shade50;
                        boxBorder = state.isCorrect ? Colors.green : Colors.red;
                      } else if (hasChar) {
                        boxBorder = theme.colorScheme.primary;
                        boxBg =
                            theme.colorScheme.primaryContainer.withValues(alpha: 0.2);
                      }

                      return Container(
                        width: 48,
                        height: 56,
                        margin: const EdgeInsets.symmetric(horizontal: 5),
                        decoration: BoxDecoration(
                          color: boxBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: boxBorder, width: 2),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          char,
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: state.isAnswered
                                ? (state.isCorrect ? Colors.green : Colors.red)
                                : theme.colorScheme.onSurface,
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 20),

                  // Letter Signs Reference Guide
                  Text(
                    'Hướng dẫn ký hiệu chữ cái:',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest
                          .withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: targetLetters.map((l) {
                        final desc = item.letterSigns[l] ??
                            'Ký hiệu ngón tay chữ cái "$l" trong VSL';
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.primary,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  l,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  desc,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Virtual Keyboard for Fingerspell Entry
                  _buildFingerspellKeyboard(context, notifier, state),
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
                            ? 'Chính xác! Đánh vần rất chuẩn.'
                            : 'Chưa đúng! Đáp án: ${item.word}',
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
                      onPressed: notifier.nextItem,
                      child: Text(
                        state.currentIndex + 1 < state.totalItems
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

  Widget _buildCameraSection(
    BuildContext context,
    FingerspellPracticeNotifier notifier,
  ) {
    final theme = Theme.of(context);
    return Container(
      height: 180,
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.primary, width: 2),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.front_hand_outlined,
                color: Colors.white54,
                size: 48,
              ),
              const SizedBox(height: 8),
              const Text(
                'Camera AI: Đưa bàn tay vào khung hình',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Giữ tay vuông góc với camera khoảng cách 30-50cm',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 12,
                ),
              ),
            ],
          ),
          // Frame overlay border
          Positioned(
            top: 16,
            left: 24,
            right: 24,
            bottom: 16,
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(
                  color: theme.colorScheme.primary.withValues(alpha: 0.6),
                  width: 1.5,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFingerspellKeyboard(
    BuildContext context,
    FingerspellPracticeNotifier notifier,
    FingerspellPracticeState state,
  ) {
    const row1 = ['A', 'B', 'C', 'D', 'E', 'G', 'H'];
    const row2 = ['I', 'K', 'L', 'M', 'N', 'O', 'P'];
    const row3 = ['Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y'];

    return Column(
      children: [
        _buildKeyRow(row1, notifier, state),
        const SizedBox(height: 6),
        _buildKeyRow(row2, notifier, state),
        const SizedBox(height: 6),
        _buildKeyRow(row3, notifier, state),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            OutlinedButton.icon(
              icon: const Icon(Icons.backspace_outlined, size: 18),
              label: const Text('Xóa'),
              onPressed: state.isAnswered ? null : notifier.deleteLetter,
            ),
            const SizedBox(width: 12),
            OutlinedButton.icon(
              icon: const Icon(Icons.clear_all, size: 18),
              label: const Text('Xóa hết'),
              onPressed: state.isAnswered ? null : notifier.clearInput,
            ),
            const SizedBox(width: 12),
            ElevatedButton.icon(
              icon: const Icon(Icons.check, size: 18),
              label: const Text('Kiểm tra'),
              onPressed: (state.isAnswered || state.enteredLetters.isEmpty)
                  ? null
                  : notifier.checkAttempt,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildKeyRow(
    List<String> keys,
    FingerspellPracticeNotifier notifier,
    FingerspellPracticeState state,
  ) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: keys.map((k) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2.5),
            child: InkWell(
              onTap: state.isAnswered ? null : () => notifier.addLetter(k),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 38,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: const [
                    BoxShadow(
                      color: Colors.black12,
                      offset: Offset(0, 1),
                      blurRadius: 1,
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: Text(
                  k,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildCompletionScreen(
    BuildContext context,
    FingerspellPracticeState state,
    FingerspellPracticeNotifier notifier,
  ) {
    final theme = Theme.of(context);
    final percentage = state.totalItems > 0
        ? ((state.score / state.totalItems) * 100).round()
        : 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Kết quả luyện đánh vần')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.celebration_rounded,
                size: 72,
                color: Colors.amber.shade700,
              ),
              const SizedBox(height: 16),
              Text(
                'Hoàn thành bài đánh vần!',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Đúng $percentage% (${state.score}/${state.totalItems} từ)',
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

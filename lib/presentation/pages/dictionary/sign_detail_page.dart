import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sightlight_flutter/data/models/dictionary/sign_model.dart';
import 'package:sightlight_flutter/presentation/providers/dictionary_provider.dart';
import 'package:sightlight_flutter/presentation/widgets/sign_video_player.dart';

class SignDetailPage extends ConsumerStatefulWidget {
  const SignDetailPage({super.key, required this.signId, this.initialSign});

  final String signId;
  final Sign? initialSign;

  @override
  ConsumerState<SignDetailPage> createState() => _SignDetailPageState();
}

class _SignDetailPageState extends ConsumerState<SignDetailPage> {
  int _selectedVariantIndex = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final detailAsync = ref.watch(signDetailProvider(widget.signId));
    final favNotifier = ref.read(favoriteSignsProvider.notifier);
    final isFav = favNotifier.isFavorite(widget.signId);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.initialSign?.word ?? 'Chi tiết ký hiệu',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: Icon(
              isFav ? Icons.favorite : Icons.favorite_border,
              color: isFav ? Colors.redAccent : null,
            ),
            tooltip: isFav ? 'Bỏ lưu' : 'Lưu ký hiệu',
            onPressed: () {
              final sign =
                  widget.initialSign ?? detailAsync.valueOrNull?.toSign();
              if (sign != null) {
                favNotifier.toggleFavorite(sign);
                setState(() {});
              }
            },
          ),
        ],
      ),
      body: detailAsync.when(
        data: (detail) => _buildContent(context, detail),
        loading: () {
          if (widget.initialSign != null) {
            // Instant render with initialSign while loading variants
            return _buildContent(
              context,
              SignDetail(
                id: widget.initialSign!.id,
                word: widget.initialSign!.word,
                meaning: widget.initialSign!.meaning,
                topic: widget.initialSign!.topic,
                wordClass: widget.initialSign!.wordClass,
                english: widget.initialSign!.english,
                variants: [
                  if (widget.initialSign!.videoUrl != null)
                    RegionalVariant(
                      id: 'primary',
                      regionLabel: 'Toàn quốc',
                      videoUrl: widget.initialSign!.videoUrl!,
                      primary: true,
                    ),
                ],
              ),
            );
          }
          return const Center(child: CircularProgressIndicator());
        },
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 12),
                Text(
                  'Không thể tải chi tiết ký hiệu',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  error.toString(),
                  style: theme.textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  icon: const Icon(Icons.refresh),
                  label: const Text('Thử lại'),
                  onPressed: () =>
                      ref.invalidate(signDetailProvider(widget.signId)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, SignDetail detail) {
    final theme = Theme.of(context);

    // Current video URL from selected variant
    String currentVideoUrl = '';
    bool isPlaceholder = false;
    if (detail.variants.isNotEmpty) {
      final safeIndex = _selectedVariantIndex < detail.variants.length
          ? _selectedVariantIndex
          : 0;
      final variant = detail.variants[safeIndex];
      currentVideoUrl = variant.videoUrl;
      isPlaceholder = variant.placeholderVideo || currentVideoUrl.trim().isEmpty;
    } else {
      currentVideoUrl = widget.initialSign?.videoUrl ?? '';
      isPlaceholder = currentVideoUrl.trim().isEmpty;
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Video Player
          SignVideoPlayer(
            videoUrl: currentVideoUrl,
            height: 250,
            isPlaceholder: isPlaceholder,
            placeholderText:
                'Video mẫu của "${detail.word}" sẽ được bổ sung cùng giáo trình chuẩn',
          ),
          const SizedBox(height: 16),

          // Regional Variants Selector
          if (detail.variants.length > 1) ...[
            Text(
              'Biến thể vùng miền:',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(detail.variants.length, (idx) {
                  final variant = detail.variants[idx];
                  final isSelected = _selectedVariantIndex == idx;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: isSelected
                                ? theme.colorScheme.onPrimary
                                : theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            variant.regionLabel +
                                (variant.signerLabel != null
                                    ? ' (${variant.signerLabel})'
                                    : ''),
                          ),
                        ],
                      ),
                      selected: isSelected,
                      onSelected: (sel) {
                        if (sel) {
                          setState(() {
                            _selectedVariantIndex = idx;
                          });
                        }
                      },
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Word Header (Vietnamese & English)
          Card(
            elevation: 0,
            color: theme.colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.5,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        detail.word,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      if (detail.wordClass != null &&
                          detail.wordClass!.isNotEmpty) ...[
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.secondaryContainer,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            detail.wordClass!,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.onSecondaryContainer,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (detail.english != null &&
                      detail.english != detail.word) ...[
                    const SizedBox(height: 4),
                    Text(
                      'English: ${detail.english!}',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.secondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                  // Topic
                  Row(
                    children: [
                      Icon(
                        Icons.category_outlined,
                        size: 16,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Chủ đề: ',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(detail.topic, style: theme.textTheme.bodyMedium),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Meaning & Description
          Text(
            'Ý nghĩa & Cách thực hiện',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  detail.meaning,
                  style: theme.textTheme.bodyLarge?.copyWith(height: 1.5),
                ),
                if (detail.description != null &&
                    detail.description!.isNotEmpty &&
                    detail.description != detail.meaning) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                  Text(
                    'Mô tả chi tiết:',
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    detail.description!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      height: 1.4,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

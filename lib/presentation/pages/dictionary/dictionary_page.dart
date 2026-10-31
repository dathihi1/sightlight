import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sightlight_flutter/data/models/dictionary/sign_model.dart';
import 'package:sightlight_flutter/presentation/providers/dictionary_provider.dart';
import 'package:sightlight_flutter/presentation/widgets/sign_card.dart';
import 'sign_detail_page.dart';

class DictionaryPage extends ConsumerStatefulWidget {
  const DictionaryPage({super.key});

  @override
  ConsumerState<DictionaryPage> createState() => _DictionaryPageState();
}

class _DictionaryPageState extends ConsumerState<DictionaryPage> {
  final _searchController = TextEditingController();
  Timer? _debounceTimer;
  int _selectedTab = 0; // 0: All / Search, 1: Favorites

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      final query = _searchController.text.trim();
      ref.read(searchQueryProvider.notifier).state = query;
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _navigateToDetail(Sign sign) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SignDetailPage(
          signId: sign.id,
          initialSign: sign,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final searchAsync = ref.watch(searchResultsProvider);
    final history = ref.watch(searchHistoryProvider);
    final favorites = ref.watch(favoriteSignsProvider);
    final favNotifier = ref.read(favoriteSignsProvider.notifier);
    final query = ref.watch(searchQueryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Từ điển Ký hiệu',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Làm mới',
            onPressed: () => ref.invalidate(searchResultsProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SearchBar(
              controller: _searchController,
              hintText: 'Tìm kiếm ký hiệu (vd: Xin chào, Cảm ơn...)',
              leading: const Icon(Icons.search),
              trailing: [
                if (_searchController.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      ref.read(searchQueryProvider.notifier).state = '';
                    },
                  ),
              ],
              elevation: const WidgetStatePropertyAll(0),
              backgroundColor: WidgetStatePropertyAll(
                theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
              ),
              shape: WidgetStatePropertyAll(
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),

          // Tabs: All vs Favorites
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('Tất cả'),
                  selected: _selectedTab == 0,
                  onSelected: (sel) {
                    if (sel) setState(() => _selectedTab = 0);
                  },
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.favorite, size: 16, color: Colors.redAccent),
                      const SizedBox(width: 4),
                      Text('Đã lưu (${favorites.length})'),
                    ],
                  ),
                  selected: _selectedTab == 1,
                  onSelected: (sel) {
                    if (sel) setState(() => _selectedTab = 1);
                  },
                ),
              ],
            ),
          ),

          // Search History Chips (when tab is All and history exists)
          if (_selectedTab == 0 && query.isEmpty && history.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              alignment: Alignment.centerLeft,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tìm kiếm gần đây',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      InkWell(
                        onTap: () =>
                            ref.read(searchHistoryProvider.notifier).clearHistory(),
                        child: Text(
                          'Xóa tất cả',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: history.take(8).map((term) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: InputChip(
                            label: Text(term),
                            onPressed: () {
                              _searchController.text = term;
                              ref.read(searchQueryProvider.notifier).state =
                                  term;
                            },
                            onDeleted: () => ref
                                .read(searchHistoryProvider.notifier)
                                .removeQuery(term),
                            deleteIconColor:
                                theme.colorScheme.onSurfaceVariant,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),

          const Divider(height: 12),

          // Body: Search Results or Favorites
          Expanded(
            child: _selectedTab == 1
                ? _buildFavoritesList(favorites, favNotifier)
                : _buildSearchResults(searchAsync, favNotifier),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults(
    AsyncValue<List<Sign>> searchAsync,
    FavoriteSignsNotifier favNotifier,
  ) {
    return searchAsync.when(
      data: (signs) {
        if (signs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.search_off_rounded,
                  size: 56,
                  color: Theme.of(context).colorScheme.outline,
                ),
                const SizedBox(height: 12),
                Text(
                  'Không tìm thấy ký hiệu phù hợp',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  'Hãy thử tìm bằng từ khoá không dấu hoặc từ khác',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.refresh(searchResultsProvider.future),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: signs.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final sign = signs[index];
              final isFav = favNotifier.isFavorite(sign.id);
              return SignCard(
                sign: sign,
                isFavorite: isFav,
                onFavoriteToggle: () => favNotifier.toggleFavorite(sign),
                onTap: () => _navigateToDetail(sign),
              );
            },
          ),
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
      error: (error, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 48, color: Colors.orange),
              const SizedBox(height: 12),
              Text(
                'Không thể tải dữ liệu từ điển',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(
                error.toString(),
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.refresh),
                label: const Text('Thử lại'),
                onPressed: () => ref.invalidate(searchResultsProvider),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFavoritesList(
    List<Sign> favorites,
    FavoriteSignsNotifier favNotifier,
  ) {
    if (favorites.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.favorite_border_rounded,
              size: 56,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 12),
            Text(
              'Chưa có ký hiệu yêu thích',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              'Nhấn biểu tượng trái tim để lưu ký hiệu cần ôn tập',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: favorites.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final sign = favorites[index];
        return SignCard(
          sign: sign,
          isFavorite: true,
          onFavoriteToggle: () => favNotifier.toggleFavorite(sign),
          onTap: () => _navigateToDetail(sign),
        );
      },
    );
  }
}

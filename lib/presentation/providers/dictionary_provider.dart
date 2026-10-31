import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../core/storage/shared_prefs_provider.dart';
import '../../data/datasources/dictionary_local_datasource.dart';
import '../../data/datasources/dictionary_remote_datasource.dart';
import '../../data/models/dictionary/sign_model.dart';
import '../../data/repositories/dictionary_repository_impl.dart';
import '../../domain/repositories/dictionary_repository.dart';

final dictionaryRepositoryProvider = Provider<DictionaryRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final prefs = ref.watch(sharedPreferencesProvider);
  final remote = DictionaryRemoteDataSource(dio);
  final local = DictionaryLocalDataSource(prefs);
  return DictionaryRepositoryImpl(remote, local);
});

// Search query
final searchQueryProvider = StateProvider<String>((ref) => '');

// Debounced search results
final searchResultsProvider = FutureProvider<List<Sign>>((ref) async {
  final query = ref.watch(searchQueryProvider);
  final repo = ref.watch(dictionaryRepositoryProvider);

  // Debounce 300ms if query changed
  if (query.isNotEmpty) {
    await Future.delayed(const Duration(milliseconds: 300));
  }

  // Check if query is still current
  if (ref.state.isLoading && query != ref.read(searchQueryProvider)) {
    throw Exception('Cancelled by newer search');
  }

  return repo.search(query);
});

// Search history
final searchHistoryProvider =
    StateNotifierProvider<SearchHistoryNotifier, List<String>>((ref) {
  final repo = ref.watch(dictionaryRepositoryProvider);
  return SearchHistoryNotifier(repo);
});

class SearchHistoryNotifier extends StateNotifier<List<String>> {
  SearchHistoryNotifier(this._repository)
      : super(_repository.getSearchHistory());

  final DictionaryRepository _repository;

  Future<void> addQuery(String query) async {
    await _repository.addSearchQuery(query);
    state = _repository.getSearchHistory();
  }

  Future<void> removeQuery(String query) async {
    await _repository.removeSearchQuery(query);
    state = _repository.getSearchHistory();
  }

  Future<void> clearHistory() async {
    await _repository.clearSearchHistory();
    state = [];
  }
}

// Favorite signs
final favoriteSignsProvider =
    StateNotifierProvider<FavoriteSignsNotifier, List<Sign>>((ref) {
  final repo = ref.watch(dictionaryRepositoryProvider);
  return FavoriteSignsNotifier(repo);
});

class FavoriteSignsNotifier extends StateNotifier<List<Sign>> {
  FavoriteSignsNotifier(this._repository)
      : super(_repository.getFavoriteSigns());

  final DictionaryRepository _repository;

  bool isFavorite(String signId) => state.any((s) => s.id == signId);

  Future<bool> toggleFavorite(Sign sign) async {
    final result = await _repository.toggleFavorite(sign);
    state = _repository.getFavoriteSigns();
    return result;
  }
}

// Sign detail
final signDetailProvider =
    FutureProvider.family<SignDetail, String>((ref, signId) async {
  final repo = ref.watch(dictionaryRepositoryProvider);
  return repo.getSignDetail(signId);
});

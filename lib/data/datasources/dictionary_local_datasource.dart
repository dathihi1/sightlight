import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/storage_keys.dart';
import '../models/dictionary/sign_model.dart';

class DictionaryLocalDataSource {
  const DictionaryLocalDataSource(this._prefs);

  final SharedPreferences _prefs;

  // Search History
  List<String> getSearchHistory() {
    return _prefs.getStringList(StorageKeys.searchHistory) ?? [];
  }

  Future<void> addSearchQuery(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return;

    final current = getSearchHistory();
    current.remove(trimmed);
    current.insert(0, trimmed);
    if (current.length > 20) {
      current.removeLast();
    }
    await _prefs.setStringList(StorageKeys.searchHistory, current);
  }

  Future<void> removeSearchQuery(String query) async {
    final current = getSearchHistory();
    current.remove(query);
    await _prefs.setStringList(StorageKeys.searchHistory, current);
  }

  Future<void> clearSearchHistory() async {
    await _prefs.remove(StorageKeys.searchHistory);
  }

  // Favorite Signs
  List<Sign> getFavoriteSigns() {
    final list = _prefs.getStringList(StorageKeys.favoriteSigns) ?? [];
    return list
        .map((str) {
          try {
            return Sign.fromJson(jsonDecode(str) as Map<String, dynamic>);
          } catch (_) {
            return null;
          }
        })
        .whereType<Sign>()
        .toList();
  }

  bool isFavorite(String signId) {
    final favs = getFavoriteSigns();
    return favs.any((s) => s.id == signId);
  }

  Future<bool> toggleFavorite(Sign sign) async {
    final favs = getFavoriteSigns();
    final index = favs.indexWhere((s) => s.id == sign.id);
    final isFavNow = index == -1;

    if (isFavNow) {
      favs.insert(0, sign);
    } else {
      favs.removeAt(index);
    }

    final rawList = favs.map((s) => jsonEncode(s.toJson())).toList();
    await _prefs.setStringList(StorageKeys.favoriteSigns, rawList);
    return isFavNow;
  }
}

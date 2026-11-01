import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/storage_keys.dart';
import '../models/practice/practice_model.dart';

class PracticeLocalDataSource {
  const PracticeLocalDataSource(this._prefs);

  final SharedPreferences _prefs;

  PracticeStats getPracticeStats() {
    final raw = _prefs.getString(StorageKeys.practiceStats);
    if (raw == null || raw.isEmpty) {
      return const PracticeStats();
    }
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return PracticeStats.fromJson(json);
    } catch (_) {
      return const PracticeStats();
    }
  }

  Future<PracticeStats> recordSessionResult({
    required int answered,
    required int correct,
  }) async {
    final current = getPracticeStats();
    final updated = current.copyWithSession(
      answered: answered,
      correct: correct,
    );
    await _prefs.setString(
      StorageKeys.practiceStats,
      jsonEncode(updated.toJson()),
    );
    return updated;
  }

  Future<void> resetStats() async {
    await _prefs.remove(StorageKeys.practiceStats);
  }
}

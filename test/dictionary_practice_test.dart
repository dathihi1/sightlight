import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sightlight_flutter/data/datasources/dictionary_local_datasource.dart';
import 'package:sightlight_flutter/data/datasources/practice_local_datasource.dart';
import 'package:sightlight_flutter/data/models/dictionary/sign_model.dart';
import 'package:sightlight_flutter/data/models/practice/practice_model.dart';

void main() {
  group('Sign & SignDetail Models', () {
    test('RegionalVariant parses fromJson and serializes toJson correctly', () {
      final json = {
        'id': 'var-01',
        'regionLabel': 'Miền Bắc',
        'signerLabel': 'Người ký A',
        'videoUrl': 'https://example.com/north.mp4',
        'primary': true,
        'placeholderVideo': false,
      };

      final variant = RegionalVariant.fromJson(json);

      expect(variant.id, 'var-01');
      expect(variant.regionLabel, 'Miền Bắc');
      expect(variant.signerLabel, 'Người ký A');
      expect(variant.videoUrl, 'https://example.com/north.mp4');
      expect(variant.primary, isTrue);
      expect(variant.placeholderVideo, isFalse);

      final output = variant.toJson();
      expect(output['id'], 'var-01');
      expect(output['regionLabel'], 'Miền Bắc');
    });

    test('Sign parses fromJson and serializes toJson correctly', () {
      final json = {
        'id': 'sign-100',
        'word': 'Xin chào',
        'meaning': 'Lời chào hỏi',
        'topic': 'Chào hỏi',
        'wordClass': 'Thán từ',
        'videoUrl': 'https://example.com/hello.mp4',
        'aiRecognizable': true,
        'english': 'Hello',
      };

      final sign = Sign.fromJson(json);

      expect(sign.id, 'sign-100');
      expect(sign.word, 'Xin chào');
      expect(sign.meaning, 'Lời chào hỏi');
      expect(sign.topic, 'Chào hỏi');
      expect(sign.wordClass, 'Thán từ');
      expect(sign.aiRecognizable, isTrue);
      expect(sign.english, 'Hello');

      final output = sign.toJson();
      expect(output['id'], 'sign-100');
      expect(output['word'], 'Xin chào');
    });

    test('SignDetail handles variants list correctly', () {
      final json = {
        'id': 'sign-detail-1',
        'word': 'Cảm ơn',
        'meaning': 'Bày tỏ lòng biết ơn',
        'topic': 'Giao tiếp',
        'variants': [
          {
            'id': 'var-north',
            'regionLabel': 'Miền Bắc',
            'videoUrl': 'https://example.com/north.mp4',
            'primary': true,
          },
          {
            'id': 'var-south',
            'regionLabel': 'Miền Nam',
            'videoUrl': 'https://example.com/south.mp4',
            'primary': false,
          },
        ],
      };

      final detail = SignDetail.fromJson(json);

      expect(detail.id, 'sign-detail-1');
      expect(detail.variants.length, 2);
      expect(detail.variants[0].regionLabel, 'Miền Bắc');
      expect(detail.variants[1].regionLabel, 'Miền Nam');
    });
  });

  group('Practice Models & Statistics', () {
    test('PracticeStats calculates accuracy correctly', () {
      const statsZero = PracticeStats(
        totalSessions: 0,
        totalAnswered: 0,
        totalCorrect: 0,
        streakDays: 0,
      );
      expect(statsZero.accuracy, 0.0);

      const stats = PracticeStats(
        totalSessions: 5,
        totalAnswered: 20,
        totalCorrect: 16,
        streakDays: 3,
      );
      expect(stats.accuracy, 80.0);
    });

    test('PracticeStats copyWithSession increments stats correctly', () {
      final today = DateTime.now().toIso8601String().substring(0, 10);
      const initial = PracticeStats(
        totalSessions: 2,
        totalAnswered: 10,
        totalCorrect: 8,
        streakDays: 1,
        lastSessionDate: '2020-01-01',
      );

      final updated = initial.copyWithSession(answered: 10, correct: 9);

      expect(updated.totalSessions, 3);
      expect(updated.totalAnswered, 20);
      expect(updated.totalCorrect, 17);
      expect(updated.lastSessionDate, today);
    });

    test('PracticeQuestion and VocabularySession serialization works', () {
      final qJson = {
        'id': 'q-1',
        'signId': 'sign-1',
        'word': 'Bố',
        'videoUrl': 'https://example.com/bo.mp4',
        'options': ['Bố', 'Mẹ', 'Anh', 'Chị'],
        'correctAnswer': 'Bố',
        'meaning': 'Người cha',
        'topic': 'Gia đình',
      };

      final question = PracticeQuestion.fromJson(qJson);
      expect(question.id, 'q-1');
      expect(question.options.length, 4);
      expect(question.correctAnswer, 'Bố');

      final sessionJson = {
        'sessionId': 'sess-1',
        'items': [qJson],
      };

      final session = VocabularySession.fromJson(sessionJson);
      expect(session.sessionId, 'sess-1');
      expect(session.items.length, 1);
      expect(session.items[0].word, 'Bố');
    });

    test('FingerspellItem and FingerspellSession serialization works', () {
      final itemJson = {
        'id': 'fs-item-1',
        'word': 'HOA',
        'hint': 'Loài hoa',
        'letterSigns': {
          'H': 'Ngón trỏ và ngón giữa duỗi ngang',
          'O': 'Các ngón khum thành vòng tròn',
          'A': 'Nắm tay giơ ngón cái',
        },
      };

      final item = FingerspellItem.fromJson(itemJson);
      expect(item.id, 'fs-item-1');
      expect(item.word, 'HOA');
      expect(item.letters, ['H', 'O', 'A']);
      expect(item.letterSigns['H'], 'Ngón trỏ và ngón giữa duỗi ngang');

      final sessJson = {
        'sessionId': 'fs-sess-1',
        'items': [itemJson],
      };

      final session = FingerspellSession.fromJson(sessJson);
      expect(session.sessionId, 'fs-sess-1');
      expect(session.items.length, 1);
    });
  });

  group('Local Data Sources with SharedPreferences', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    test('DictionaryLocalDataSource stores and retrieves search history', () async {
      final dataSource = DictionaryLocalDataSource(prefs);

      expect(dataSource.getSearchHistory(), isEmpty);

      await dataSource.addSearchQuery('Xin chào');
      await dataSource.addSearchQuery('Cảm ơn');
      await dataSource.addSearchQuery('Xin chào'); // duplicate should move to top

      final history = dataSource.getSearchHistory();
      expect(history.length, 2);
      expect(history[0], 'Xin chào');
      expect(history[1], 'Cảm ơn');

      await dataSource.removeSearchQuery('Xin chào');
      expect(dataSource.getSearchHistory(), ['Cảm ơn']);

      await dataSource.clearSearchHistory();
      expect(dataSource.getSearchHistory(), isEmpty);
    });

    test('DictionaryLocalDataSource stores and toggles favorite signs', () async {
      final dataSource = DictionaryLocalDataSource(prefs);
      const testSign = Sign(
        id: 'fav-1',
        word: 'Yêu',
        meaning: 'Tình cảm yêu thương',
        topic: 'Cảm xúc',
      );

      expect(dataSource.isFavorite('fav-1'), isFalse);
      expect(dataSource.getFavoriteSigns(), isEmpty);

      final added = await dataSource.toggleFavorite(testSign);
      expect(added, isTrue);
      expect(dataSource.isFavorite('fav-1'), isTrue);
      expect(dataSource.getFavoriteSigns().length, 1);
      expect(dataSource.getFavoriteSigns().first.word, 'Yêu');

      final removed = await dataSource.toggleFavorite(testSign);
      expect(removed, isFalse);
      expect(dataSource.isFavorite('fav-1'), isFalse);
      expect(dataSource.getFavoriteSigns(), isEmpty);
    });

    test('PracticeLocalDataSource manages PracticeStats persistence', () async {
      final dataSource = PracticeLocalDataSource(prefs);

      final defaultStats = dataSource.getPracticeStats();
      expect(defaultStats.totalSessions, 0);
      expect(defaultStats.streakDays, 0);

      await dataSource.recordSessionResult(answered: 5, correct: 4);
      final updatedStats = dataSource.getPracticeStats();
      expect(updatedStats.totalSessions, 1);
      expect(updatedStats.totalAnswered, 5);
      expect(updatedStats.totalCorrect, 4);
      expect(updatedStats.accuracy, 80.0);

      await dataSource.resetStats();
      expect(dataSource.getPracticeStats().totalSessions, 0);
    });
  });
}

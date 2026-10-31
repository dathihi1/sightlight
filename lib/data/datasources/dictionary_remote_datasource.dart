import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../models/dictionary/sign_model.dart';

class DictionaryRemoteDataSource {
  const DictionaryRemoteDataSource(this._dio);

  final Dio _dio;

  Future<List<Sign>> searchSigns(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      // Default initial signs when query is empty: 'Gia đình & Xưng hô' (20 video signs)
      return getSignsByTopic('Gia đình & Xưng hô');
    }

    final response = await _dio.get(
      ApiConstants.dictionarySearch,
      queryParameters: {'q': trimmed},
    );

    final data = response.data as Map<String, dynamic>;
    final result = data['result'] as Map<String, dynamic>?;
    final items = result?['items'] as List<dynamic>?;

    if (items == null) return [];

    return items
        .map((json) => Sign.fromJson(json as Map<String, dynamic>))
        .map(_enrichWithEnglish)
        .toList();
  }

  Future<SignDetail> getSignDetail(String signId) async {
    final response = await _dio.get(ApiConstants.signDetail(signId));
    final data = response.data as Map<String, dynamic>;
    final result = data['result'] as Map<String, dynamic>? ?? data;

    final detail = SignDetail.fromJson(result);
    final english = _lookupEnglish(detail.word);
    return SignDetail(
      id: detail.id,
      word: detail.word,
      meaning: detail.meaning,
      wordClass: detail.wordClass,
      topic: detail.topic,
      description: detail.description,
      aiRecognizable: detail.aiRecognizable,
      variants: detail.variants,
      english: english,
    );
  }

  Future<List<TopicItem>> getTopics() async {
    final response = await _dio.get(ApiConstants.dictionaryTopics);
    final data = response.data as Map<String, dynamic>;
    final result = data['result'] as List<dynamic>?;
    if (result == null) return [];

    return result
        .map((e) => TopicItem.fromJson(e as Map<String, dynamic>))
        .where((t) => t.signCount > 0 && t.topic != 'Chào hỏi')
        .toList();
  }

  Future<List<Sign>> getSignsByTopic(String topic) async {
    final encoded = Uri.encodeComponent(topic);
    final response = await _dio.get(
      '${ApiConstants.apiPrefix}/dictionary/topics/$encoded/signs',
      queryParameters: {'size': 100},
    );
    final data = response.data as Map<String, dynamic>;
    final result = data['result'] as Map<String, dynamic>?;
    final items = result?['items'] as List<dynamic>?;

    if (items == null) return [];

    return items
        .map((json) => Sign.fromJson(json as Map<String, dynamic>))
        .map(_enrichWithEnglish)
        .toList();
  }

  Sign _enrichWithEnglish(Sign s) {
    return Sign(
      id: s.id,
      word: s.word,
      meaning: s.meaning,
      topic: s.topic,
      wordClass: s.wordClass,
      thumbnailUrl: s.thumbnailUrl,
      videoUrl: s.videoUrl,
      aiRecognizable: s.aiRecognizable,
      english: _lookupEnglish(s.word),
    );
  }

  static String _lookupEnglish(String vietnamese) {
    const map = {
      'Xin chào': 'Hello / Hi',
      'Tạm biệt': 'Goodbye',
      'Cảm ơn': 'Thank you',
      'Xin lỗi': 'Sorry / Excuse me',
      'Hàn Quốc': 'South Korea',
      'Thái Lan': 'Thailand',
      'Anh': 'Older brother',
      'Chị': 'Older sister',
      'Em': 'Younger sibling',
      'Cháu': 'Niece / Nephew / Grandchild',
      'Chú': 'Uncle',
      'Cậu': 'Maternal uncle',
      'Có': 'Yes / Have',
      'Không': 'No / Not',
      'Họ hàng': 'Relatives',
      'Cái bàn': 'Table / Desk',
      'Cái cửa': 'Door',
      'Mẹ': 'Mother',
      'Bố': 'Father',
      'Yêu': 'Love',
      'Thích': 'Like',
      'Bạn bè': 'Friends',
      'Trường học': 'School',
      'Bác sĩ': 'Doctor',
      'Giáo viên': 'Teacher',
      'Học sinh': 'Student',
    };
    return map[vietnamese] ?? vietnamese;
  }
}

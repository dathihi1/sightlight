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
        .toList();
  }

  Future<SignDetail> getSignDetail(String signId) async {
    final response = await _dio.get(ApiConstants.signDetail(signId));
    final data = response.data as Map<String, dynamic>;
    final result = data['result'] as Map<String, dynamic>? ?? data;

    final detail = SignDetail.fromJson(result);
    return SignDetail(
      id: detail.id,
      word: detail.word,
      meaning: detail.meaning,
      wordClass: detail.wordClass,
      topic: detail.topic,
      description: detail.description,
      aiRecognizable: detail.aiRecognizable,
      variants: detail.variants,
      english: detail.english,
    );
  }

  Future<List<TopicItem>> getTopics() async {
    final response = await _dio.get(ApiConstants.dictionaryTopics);
    final data = response.data as Map<String, dynamic>;
    final result = data['result'] as List<dynamic>?;
    if (result == null) return [];

    return result
        .map((e) => TopicItem.fromJson(e as Map<String, dynamic>))
        .where((t) => t.signCount > 0)
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
        .toList();
  }
}

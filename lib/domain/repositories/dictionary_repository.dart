import '../../data/models/dictionary/sign_model.dart';

abstract interface class DictionaryRepository {
  Future<List<Sign>> search(String query);
  Future<SignDetail> getSignDetail(String signId);
  Future<List<String>> getTopics();
  Future<List<Sign>> getSignsByTopic(String topic);
  List<String> getSearchHistory();
  Future<void> addSearchQuery(String query);
  Future<void> removeSearchQuery(String query);
  Future<void> clearSearchHistory();
  List<Sign> getFavoriteSigns();
  bool isFavorite(String signId);
  Future<bool> toggleFavorite(Sign sign);
}

import '../../domain/repositories/dictionary_repository.dart';
import '../datasources/dictionary_local_datasource.dart';
import '../datasources/dictionary_remote_datasource.dart';
import '../models/dictionary/sign_model.dart';

class DictionaryRepositoryImpl implements DictionaryRepository {
  const DictionaryRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
  );

  final DictionaryRemoteDataSource _remoteDataSource;
  final DictionaryLocalDataSource _localDataSource;

  @override
  Future<List<Sign>> search(String query) async {
    final results = await _remoteDataSource.searchSigns(query);
    if (query.trim().isNotEmpty) {
      await _localDataSource.addSearchQuery(query.trim());
    }
    return results;
  }

  @override
  Future<SignDetail> getSignDetail(String signId) =>
      _remoteDataSource.getSignDetail(signId);

  @override
  Future<List<TopicItem>> getTopics() => _remoteDataSource.getTopics();

  @override
  Future<List<Sign>> getSignsByTopic(String topic) =>
      _remoteDataSource.getSignsByTopic(topic);

  @override
  List<String> getSearchHistory() => _localDataSource.getSearchHistory();

  @override
  Future<void> addSearchQuery(String query) =>
      _localDataSource.addSearchQuery(query);

  @override
  Future<void> removeSearchQuery(String query) =>
      _localDataSource.removeSearchQuery(query);

  @override
  Future<void> clearSearchHistory() =>
      _localDataSource.clearSearchHistory();

  @override
  List<Sign> getFavoriteSigns() => _localDataSource.getFavoriteSigns();

  @override
  bool isFavorite(String signId) => _localDataSource.isFavorite(signId);

  @override
  Future<bool> toggleFavorite(Sign sign) =>
      _localDataSource.toggleFavorite(sign);
}

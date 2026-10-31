import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/datasources/user_remote_datasource.dart';
import '../../data/repositories/user_repository_impl.dart';
import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/user_repository.dart';

final userRemoteDataSourceProvider = Provider<UserRemoteDataSource>((ref) {
  final dio = ref.watch(dioProvider);
  return UserRemoteDataSource(dio);
});

final userRepositoryProvider = Provider<UserRepository>((ref) {
  final remoteDataSource = ref.watch(userRemoteDataSourceProvider);
  return UserRepositoryImpl(remoteDataSource);
});

final userProfileProvider =
    StateNotifierProvider<UserProfileNotifier, AsyncValue<UserProfile>>((ref) {
  final repository = ref.watch(userRepositoryProvider);
  return UserProfileNotifier(repository);
});

class UserProfileNotifier extends StateNotifier<AsyncValue<UserProfile>> {
  UserProfileNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadProfile();
  }

  final UserRepository _repository;

  Future<void> loadProfile() async {
    state = const AsyncValue.loading();
    try {
      final profile = await _repository.getProfile();
      state = AsyncValue.data(profile);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<bool> updateProfile({
    String? displayName,
    String? timezone,
  }) async {
    final current = state.valueOrNull;
    if (current == null) return false;

    // Optimistic update
    state = AsyncValue.data(
      current.copyWith(
        displayName: displayName ?? current.displayName,
        timezone: timezone ?? current.timezone,
      ),
    );

    try {
      final updated = await _repository.updateProfile(
        displayName: displayName,
        timezone: timezone,
      );
      state = AsyncValue.data(updated);
      return true;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      return false;
    }
  }

  Future<bool> updateAvatar(String filePath) async {
    final current = state.valueOrNull;
    if (current == null) return false;

    // Optimistic update with local file path
    state = AsyncValue.data(current.copyWith(avatarUrl: filePath));

    try {
      final newAvatarUrl = await _repository.updateAvatar(filePath);
      state = AsyncValue.data(current.copyWith(avatarUrl: newAvatarUrl));
      return true;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      return false;
    }
  }

  Future<bool> updatePreferences(UserPreferences preferences) async {
    final current = state.valueOrNull;
    if (current == null) return false;

    // Optimistic update
    state = AsyncValue.data(current.copyWith(preferences: preferences));

    try {
      final updatedPrefs = await _repository.updatePreferences(preferences);
      state = AsyncValue.data(current.copyWith(preferences: updatedPrefs));
      return true;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      return false;
    }
  }

  Future<void> requestPasswordReset(String email) async {
    await _repository.requestPasswordReset(email);
  }
}

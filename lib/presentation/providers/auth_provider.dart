import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../core/network/dio_client.dart';
import '../../core/storage/token_storage.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/models/auth/register_response.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  final remoteDataSource = AuthRemoteDataSource(dio);

  return AuthRepositoryImpl(remoteDataSource, tokenStorage);
});

final authStateProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
      final repository = ref.watch(authRepositoryProvider);
      return AuthNotifier(repository);
    });

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  AuthNotifier(this._repository) : super(const AsyncValue.loading()) {
    checkAuthStatus();
  }

  final AuthRepository _repository;

  Future<void> checkAuthStatus() async {
    state = const AsyncValue.loading();
    try {
      final user = await _repository.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _repository.login(email, password);
      state = AsyncValue.data(user);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<RegisterResponse> register(
    String email,
    String password,
    String displayName,
  ) async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.register(email, password, displayName);
      state = const AsyncValue.data(null);
      return result;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      final googleSignIn = GoogleSignIn.instance;

      // Initialize with client ID
      await googleSignIn.initialize(
        clientId: '701794322092-f9k658h8vgrftuv8t4mfk50ctnk7vc50.apps.googleusercontent.com',
        serverClientId: '701794322092-f9k658h8vgrftuv8t4mfk50.apps.googleusercontent.com',
      );

      // Check if authenticate() is supported
      if (googleSignIn.supportsAuthenticate()) {
        // Use authenticate() method - returns GoogleSignInAccount directly
        final account = await googleSignIn.authenticate();

        if (account == null) {
          throw Exception('Đăng nhập Google bị hủy');
        }

        final auth = await account.authentication;
        final idToken = auth.idToken;
        if (idToken == null || idToken.isEmpty) {
          throw Exception('Không nhận được Google ID Token');
        }

        final user = await _repository.loginWithGoogle(idToken);
        state = AsyncValue.data(user);
      } else {
        // Fallback to old signIn() method
        throw Exception('Platform này không hỗ trợ Google Sign-In');
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> forgotPassword(String email) async {
    await _repository.forgotPassword(email);
  }

  Future<void> logout() async {
    try {
      await _repository.logout();
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  void forceLogout() {
    state = const AsyncValue.data(null);
  }

  void updatePremiumStatus(bool isPremium) {
    final current = state.value;
    if (current != null) {
      state = AsyncValue.data(current.copyWith(isPremium: isPremium));
    }
  }
}

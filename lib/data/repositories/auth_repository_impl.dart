import '../../core/storage/token_storage.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/auth/forgot_password_request.dart';
import '../models/auth/google_login_request.dart';
import '../models/auth/login_request.dart';
import '../models/auth/register_request.dart';
import '../models/auth/register_response.dart';
import '../models/auth/token_refresh_request.dart';

class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl(this._remoteDataSource, this._tokenStorage);

  final AuthRemoteDataSource _remoteDataSource;
  final TokenStorage _tokenStorage;

  @override
  Future<User> login(String email, String password) async {
    final request = LoginRequest.create(email: email, password: password);
    final response = await _remoteDataSource.login(request);

    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Đăng nhập thất bại');
    }

    final result = response.result!;

    await _tokenStorage.saveAccessToken(result.accessToken);
    await _tokenStorage.saveRefreshToken(result.refreshToken);
    await _tokenStorage.saveUserId(result.userId);
    await _tokenStorage.saveUserEmail(email);

    final info = result.user;
    return User(
      id: info?.id ?? result.userId,
      email: info?.email ?? email,
      displayName: info?.displayName,
      avatarUrl: info?.avatarUrl,
      isPremium: info?.isPremium ?? false,
      roles: result.roles,
      activeCourseId: result.activeCourseId,
    );
  }

  @override
  Future<RegisterResponse> register(
    String email,
    String password,
    String displayName,
  ) async {
    final request = RegisterRequest.create(
      email: email,
      password: password,
      displayName: displayName,
    );
    final response = await _remoteDataSource.register(request);

    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Đăng ký thất bại');
    }

    final result = response.result!;
    return result;
  }

  @override
  Future<User> loginWithGoogle(String idToken) async {
    final request = GoogleLoginRequest.create(idToken: idToken);
    final response = await _remoteDataSource.googleLogin(request);

    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Đăng nhập Google thất bại');
    }

    final result = response.result!;

    await _tokenStorage.saveAccessToken(result.accessToken);
    await _tokenStorage.saveRefreshToken(result.refreshToken);
    await _tokenStorage.saveUserId(result.userId);

    final info = result.user;
    return User(
      id: info?.id ?? result.userId,
      email: info?.email ?? '',
      displayName: info?.displayName,
      avatarUrl: info?.avatarUrl,
      isPremium: info?.isPremium ?? false,
      roles: result.roles,
      activeCourseId: result.activeCourseId,
    );
  }

  @override
  Future<void> forgotPassword(String email) async {
    final request = ForgotPasswordRequest.create(email: email);
    final response = await _remoteDataSource.forgotPassword(request);

    if (response.isError) {
      throw Exception(
        response.errorMessage ?? 'Gửi yêu cầu quên mật khẩu thất bại',
      );
    }
  }

  @override
  Future<void> logout() async {
    try {
      final rt = await _tokenStorage.getRefreshToken();
      if (rt != null && rt.isNotEmpty) {
        await _remoteDataSource.logout(
          TokenRefreshRequest.create(refreshToken: rt),
        );
      }
    } catch (_) {
      // Clear local storage regardless of backend logout outcome
    }
    await _tokenStorage.clearTokens();
  }

  @override
  Future<User?> getCurrentUser() async {
    final token = await _tokenStorage.getAccessToken();
    if (token == null) return null;

    final userId = await _tokenStorage.getUserId();
    final userEmail = await _tokenStorage.getUserEmail();

    try {
      final response = await _remoteDataSource.getMe();
      if (response.isSuccess && response.result != null) {
        final result = response.result!;
        return User(
          id: result.id,
          email: result.email,
          displayName: result.displayName,
          avatarUrl: result.avatarUrl,
          isPremium: result.isPremium,
        );
      }
    } catch (_) {
      // Fallback to local stored info if available
    }

    if (userId != null) {
      return User(id: userId, email: userEmail ?? '', isPremium: false);
    }

    return null;
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await _tokenStorage.getAccessToken();
    return token != null && token.isNotEmpty;
  }
}

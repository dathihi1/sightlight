import '../entities/user.dart';
import '../../data/models/auth/register_response.dart';

abstract interface class AuthRepository {
  Future<User> login(String email, String password);
  Future<RegisterResponse> register(
    String email,
    String password,
    String displayName,
  );
  Future<User> loginWithGoogle(String idToken);
  Future<void> forgotPassword(String email);
  Future<void> logout();
  Future<User?> getCurrentUser();
  Future<bool> isLoggedIn();
}

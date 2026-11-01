import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/storage_keys.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return TokenStorage();
});

class TokenStorage {
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final StreamController<void> _sessionExpiredController =
      StreamController<void>.broadcast();

  Stream<void> get sessionExpired => _sessionExpiredController.stream;

  Future<void> saveAccessToken(String token) async {
    await _secureStorage.write(key: StorageKeys.accessToken, value: token);
  }

  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: StorageKeys.refreshToken, value: token);
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: StorageKeys.accessToken);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: StorageKeys.refreshToken);
  }

  Future<void> saveUserId(String userId) async {
    await _secureStorage.write(key: StorageKeys.userId, value: userId);
  }

  Future<String?> getUserId() async {
    return await _secureStorage.read(key: StorageKeys.userId);
  }

  Future<void> saveUserEmail(String email) async {
    await _secureStorage.write(key: StorageKeys.userEmail, value: email);
  }

  Future<String?> getUserEmail() async {
    return await _secureStorage.read(key: StorageKeys.userEmail);
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: StorageKeys.accessToken);
    await _secureStorage.delete(key: StorageKeys.refreshToken);
    await _secureStorage.delete(key: StorageKeys.userId);
    await _secureStorage.delete(key: StorageKeys.userEmail);
  }

  Future<void> expireSession() async {
    await clearTokens();
    _sessionExpiredController.add(null);
  }
}

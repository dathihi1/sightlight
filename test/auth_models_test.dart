import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/data/models/auth/forgot_password_request.dart';
import 'package:sightlight_flutter/data/models/auth/google_login_request.dart';
import 'package:sightlight_flutter/data/models/auth/login_request.dart';
import 'package:sightlight_flutter/data/models/auth/login_response.dart';
import 'package:sightlight_flutter/data/models/auth/register_request.dart';
import 'package:sightlight_flutter/data/models/auth/register_response.dart';
import 'package:sightlight_flutter/data/models/auth/token_refresh_request.dart';
import 'package:sightlight_flutter/data/models/auth/token_refresh_response.dart';

void main() {
  group('Auth Request Models', () {
    test('LoginRequest creates valid payload', () {
      final req = LoginRequest.create(
        email: 'user@example.com',
        password: 'password123',
      );

      final json = req.toJson();
      expect(json['email'], 'user@example.com');
      expect(json['password'], 'password123');
      expect(json['version'], '1.0');
      expect(json['requestId'], isNotEmpty);
    });

    test('RegisterRequest creates valid payload with terms accepted', () {
      final req = RegisterRequest.create(
        email: 'user@example.com',
        password: 'password123',
        displayName: 'Test User',
      );

      final json = req.toJson();
      expect(json['email'], 'user@example.com');
      expect(json['password'], 'password123');
      expect(json['displayName'], 'Test User');
      expect(json['acceptedTerms'], isTrue);
      expect(json['version'], '1.0');
      expect(json['requestId'], isNotEmpty);
    });

    test('GoogleLoginRequest creates valid payload', () {
      final req = GoogleLoginRequest.create(idToken: 'sample_id_token_xyz');

      final json = req.toJson();
      expect(json['idToken'], 'sample_id_token_xyz');
      expect(json['requestId'], isNotEmpty);
      expect(json['dailyGoalMinutes'], 10);
    });

    test('ForgotPasswordRequest creates valid payload', () {
      final req = ForgotPasswordRequest.create(email: 'user@example.com');

      final json = req.toJson();
      expect(json['email'], 'user@example.com');
      expect(json['version'], '1.0');
      expect(json['requestId'], isNotEmpty);
    });

    test('TokenRefreshRequest creates valid payload', () {
      final req = TokenRefreshRequest.create(
        refreshToken: 'sample_refresh_token',
      );

      final json = req.toJson();
      expect(json['refreshToken'], 'sample_refresh_token');
      expect(json['version'], '1.0');
      expect(json['requestId'], isNotEmpty);
    });
  });

  group('Auth Response Models', () {
    test('LoginResponse correctly parses backend response', () {
      final rawJson = {
        'accessToken': 'access_token_123',
        'refreshToken': 'refresh_token_456',
        'userId': 'uuid-user-001',
        'roles': ['LEARNER_FREE'],
        'activeCourseId': 'course-123',
        'requiresEmailVerification': true,
        'pendingDeletion': false,
      };

      final resp = LoginResponse.fromJson(rawJson);
      expect(resp.accessToken, 'access_token_123');
      expect(resp.refreshToken, 'refresh_token_456');
      expect(resp.userId, 'uuid-user-001');
      expect(resp.roles, ['LEARNER_FREE']);
      expect(resp.activeCourseId, 'course-123');
      expect(resp.requiresEmailVerification, isTrue);
    });

    test('RegisterResponse correctly parses backend response', () {
      final rawJson = {
        'userId': 'uuid-new-user-002',
        'accessToken': 'jwt_access',
        'refreshToken': 'jwt_refresh',
        'status': 'PENDING_VERIFICATION',
        'activeCourseId': 'course-abc',
      };

      final resp = RegisterResponse.fromJson(rawJson);
      expect(resp.userId, 'uuid-new-user-002');
      expect(resp.accessToken, 'jwt_access');
      expect(resp.refreshToken, 'jwt_refresh');
      expect(resp.status, 'PENDING_VERIFICATION');
      expect(resp.activeCourseId, 'course-abc');
    });

    test('TokenRefreshResponse correctly parses backend response', () {
      final rawJson = {
        'accessToken': 'new_access_token',
        'refreshToken': 'new_refresh_token',
        'expiresInSeconds': 900,
      };

      final resp = TokenRefreshResponse.fromJson(rawJson);
      expect(resp.accessToken, 'new_access_token');
      expect(resp.refreshToken, 'new_refresh_token');
      expect(resp.expiresInSeconds, 900);
    });
  });
}

import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/core/errors/app_exception.dart';
import 'package:sightlight_flutter/core/network/interceptors/auth_interceptor.dart';
import 'package:sightlight_flutter/core/network/interceptors/request_contract_interceptor.dart';
import 'package:sightlight_flutter/core/storage/token_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('request contract adds requestId, version, and trace header', () async {
    late RequestOptions captured;
    final dio = Dio(BaseOptions(baseUrl: 'https://test.invalid'));
    dio.httpClientAdapter = _CallbackAdapter((options) async {
      captured = options;
      return _jsonResponse(200, {
        'requestId': options.headers['X-Request-Id'],
        'errorCode': '00000',
        'errorMessage': 'Success',
        'result': <String, dynamic>{},
      });
    });
    dio.interceptors.add(const RequestContractInterceptor());

    await dio.post('/api/v1/test', data: <String, dynamic>{'value': 1});

    final body = captured.data as Map<String, dynamic>;
    expect(captured.headers['X-Request-Id'], isNotEmpty);
    expect(body['requestId'], captured.headers['X-Request-Id']);
    expect(body['version'], '1.0');
  });

  test('HTTP 200 with business errorCode is rejected as failure', () async {
    final dio = Dio(BaseOptions(baseUrl: 'https://test.invalid'));
    dio.httpClientAdapter = _CallbackAdapter((_) async {
      return _jsonResponse(200, {
        'requestId': 'request-1',
        'errorCode': '01201',
        'errorMessage': 'Email hoặc mật khẩu không đúng.',
        'result': null,
      });
    });
    dio.interceptors.add(const RequestContractInterceptor());

    await expectLater(
      dio.post('/api/v1/auth/login', data: <String, dynamic>{}),
      throwsA(
        isA<DioException>()
            .having((error) => error.error, 'error', isA<BusinessException>())
            .having(
              (error) => (error.error! as BusinessException).code,
              'business code',
              '01201',
            ),
      ),
    );
  });

  test('concurrent 401 responses rotate the refresh token only once', () async {
    FlutterSecureStorage.setMockInitialValues({
      'access_token': 'old-access',
      'refresh_token': 'old-refresh',
    });
    final storage = TokenStorage();
    var refreshCalls = 0;
    final adapter = _CallbackAdapter((options) async {
      if (options.path.endsWith('/api/v1/auth/refresh')) {
        refreshCalls++;
        await Future<void>.delayed(const Duration(milliseconds: 20));
        return _jsonResponse(200, {
          'requestId': 'refresh-request',
          'errorCode': '00000',
          'errorMessage': 'Success',
          'result': {
            'accessToken': 'new-access',
            'refreshToken': 'new-refresh',
            'expiresInSeconds': 900,
          },
        });
      }

      if (options.headers['Authorization'] == 'Bearer new-access') {
        return _jsonResponse(200, {
          'requestId': 'protected-request',
          'errorCode': '00000',
          'errorMessage': 'Success',
          'result': {'ok': true},
        });
      }
      return _jsonResponse(401, {
        'requestId': 'protected-request',
        'errorCode': '00401',
        'errorMessage': 'Unauthenticated',
        'result': null,
      });
    });

    Dio refreshClientFactory() {
      final client = Dio(BaseOptions(baseUrl: 'https://test.invalid'));
      client.httpClientAdapter = adapter;
      return client;
    }

    final dio = Dio(BaseOptions(baseUrl: 'https://test.invalid'));
    dio.httpClientAdapter = adapter;
    dio.interceptors.addAll([
      const RequestContractInterceptor(),
      AuthInterceptor(storage, dio, refreshClientFactory: refreshClientFactory),
    ]);

    final responses = await Future.wait([
      dio.get('/api/v1/protected/a'),
      dio.get('/api/v1/protected/b'),
    ]);

    expect(responses.every((response) => response.statusCode == 200), isTrue);
    expect(refreshCalls, 1);
    expect(await storage.getAccessToken(), 'new-access');
    expect(await storage.getRefreshToken(), 'new-refresh');
  });
}

ResponseBody _jsonResponse(int statusCode, Map<String, dynamic> body) {
  return ResponseBody.fromString(
    jsonEncode(body),
    statusCode,
    headers: {
      Headers.contentTypeHeader: ['application/json'],
    },
  );
}

class _CallbackAdapter implements HttpClientAdapter {
  _CallbackAdapter(this.callback);

  final FutureOr<ResponseBody> Function(RequestOptions options) callback;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return callback(options);
  }

  @override
  void close({bool force = false}) {}
}

# SignLight Flutter Integration Report

## Scope and contract source

Work was performed on the existing `flutter` branch after fast-forwarding from `1dbda74` to the latest remote UI commit `cd32e03`. Backend behavior was verified against Java controllers and DTOs from `sightlight/develope` commit `a64eacc` and `docs/sa/api-spec.md`. Where the draft spec and controller code differ, this report treats controller/DTO source as the executable contract.

The configured production API was not used for destructive tests, account mutations, or payment operations. No authorized test credentials were available, so production end-to-end behavior is explicitly unverified.

## Implemented and repaired

1. Shared API infrastructure
   - Added build-time `API_BASE_URL` and `GOOGLE_SERVER_CLIENT_ID` configuration.
   - Added UUID trace/request metadata and API version injection.
   - Enforced the `TransactionResponse` envelope and business error codes.
   - Added user-friendly Dio error mapping and one safe retry for idempotent transient failures.
   - Reworked access-token refresh into a single-flight rotation with one request retry and session-expiry notification.
   - Removed sensitive header/body/response logging.

2. Authentication and profile
   - Repaired nested `GET /me` parsing (`userId`, `profile`, `preferences`, roles, Premium state).
   - Preserved secure token storage, session restore, route guards, Google login, logout, and forgot-password flows.
   - Updated registration password validation to match the backend.
   - Removed fake profile/local avatar success and added optimistic-state rollback.

3. Learning
   - Replaced the hardcoded 17-unit home roadmap with course and learning-path APIs.
   - Added typed course/path/lesson/answer/completion entities and repositories.
   - Added a real lesson page with an intro followed by exactly one exercise per screen, progress tracking, server grading, feedback, and next-question navigation matching the web app.
   - Added dedicated choice, typed-answer, sentence-order, and sign-to-meaning matching controls, including the verified `orderedTokens`, `matches`, and elapsed-time request fields.

4. Dictionary and media
   - Retained real search/topic/sign-detail integrations and local-only favorites/history.
   - Removed invented English translations and silent topic exclusion.

5. AI practice
   - Connected capabilities, quota, session, and attempt APIs.
   - Fixed the 30/400 selector to send both `size` and `modelSize`.
   - Disabled unavailable model sizes based on backend capabilities.
   - Kept local ONNX inference and numeric-only backend payloads; no raw camera frames/video are uploaded.
   - Removed fake AI sessions and fake successful submissions.
   - Reworked the practice view into a video-call layout with switchable equal split-screen and camera-first picture-in-picture modes.

6. Branding
   - Applied the supplied SignLight logo to the in-app header, authentication, splash screen, Android launcher icons, and iOS AppIcon set.

7. Progress, store, referral, and billing
   - Removed fake progress, badge, shop, referral, and pricing data from production flows.
   - Used `gamification/summary` and `gamification/store` as implemented by the backend.
   - Loaded Premium plans from the backend.
   - Corrected payment verification to `/billing/status/{orderCode}`.
   - Removed the insecure behavior that granted Premium from return URL query parameters.
   - Removed unsupported client-supplied checkout return/cancel URLs.

8. Build tooling
   - Removed unused Freezed/JSON/Riverpod generators that were incompatible with Dart 3.13; the project contains no generator annotations or generated parts.
   - Updated `build_runner` to a Dart 3.13-compatible version.
   - Repaired Android library `compileSdk` configuration without disabling AAR metadata validation and handled Windows cross-drive Kotlin caches.

## Primary files added

- `lib/core/network/interceptors/request_contract_interceptor.dart`
- `lib/core/network/interceptors/safe_retry_interceptor.dart`
- `lib/domain/entities/learning.dart`
- `lib/domain/repositories/learning_repository.dart`
- `lib/data/datasources/learning_remote_datasource.dart`
- `lib/data/repositories/learning_repository_impl.dart`
- `lib/presentation/providers/learning_provider.dart`
- `lib/presentation/pages/learning/lesson_page.dart`
- `test/network_contract_test.dart`
- `test/learning_api_test.dart`

Other modified areas include API constants, Dio/auth/token infrastructure, auth/user/billing/dictionary/practice/gamification repositories, Home/Practice/Profile/Upgrade/Payment/Referral/Shop screens, routing, and affected tests. See `git diff --stat` for the complete list.

## Validation performed

Commands executed:

```text
flutter pub get
dart format lib test
flutter pub run build_runner build --delete-conflicting-outputs
flutter analyze
flutter test
flutter build apk --debug --no-pub
```

Final local results:

- `dart format --output=none --set-exit-if-changed lib test`: 111 files checked, 0 changed.
- `build_runner`: completed successfully; 0 outputs, as the project currently registers no code generators.
- `flutter analyze`: no issues.
- `flutter test`: 54 tests passed.
- Android debug build: succeeded; APK generated at `build/app/outputs/flutter-apk/app-debug.apk`.
- New coverage verifies request metadata, business failures returned with HTTP 200, concurrent 401 single-flight refresh, learning-path DTO mapping, safe lesson-option parsing, and updated production UI behavior.

Android build compatibility fixes include disabling Kotlin incremental compilation for the Windows cross-drive Pub-cache layout and using AGP's `finalizeDsl` variant API to compile Android library plugins, including `onnxruntime`, against SDK 36. The obsolete task-disabling workaround was removed so AAR metadata remains validated.

## Remaining blockers

1. AI landmark extraction (high impact)
   - The current camera screen measures pixel motion and constructs a synthetic `64×327` tensor. It does not implement the MediaPipe pose/hand landmark schema expected by the ONNX models and backend.
   - Therefore, model execution works technically, but recognition accuracy cannot be considered valid. Completing this requires an Android/iOS-compatible MediaPipe Holistic/hand-landmark pipeline that produces the backend’s exact `v2_holistic_subset` ordering and normalization.

2. Backend endpoints absent from actual controller source
   - `PATCH /me/profile`, `PUT /me/avatar`, `PATCH /me/preferences`
   - `/practice/vocabulary/*`, `/practice/fingerspell/*`, `/practice/numbers/*`
   - `/progress/overview`, `/progress/activity`, `/awards`, `/awards/{code}/celebrated`
   - The Flutter client no longer pretends these mutations succeeded. Implement them in Spring Boot or formally remove/replace them in the approved API contract.

3. Missing Flutter screens
   - Reset-password token/deep-link screen is absent.
   - Push installation/FCM lifecycle is absent.

4. Real environment verification
   - No test learner account, Google test account on a registered Android signing certificate, or sandbox payOS authorization was supplied.
   - Login, mutation, checkout, payment, quota, and Premium behavior must be manually verified in a non-production test environment before release.

## Manual verification instructions

1. Configure public build-time values:

```powershell
flutter run --dart-define-from-file=.env
```

2. Authenticate using a test learner account. Confirm restart restores the session and an invalid/expired refresh token returns to `/login` once.
3. Confirm Home loads the learner’s real course path. Open an unlocked lesson, submit each exercise, complete it, and verify Home/progress refresh.
4. Search dictionary terms, switch topics, open sign details, and play at least one non-placeholder video.
5. On a physical Android device, choose model 30 and 400. Confirm requests include the selected `modelSize`, quota is visible, and the backend receives numeric features only. Do not use accuracy as release evidence until the landmark-extraction blocker is resolved.
6. Load Premium plans. Start checkout only in a payOS sandbox/test setup. Confirm returning with a forged `status=PAID` and no valid backend order does not grant Premium.
7. Open Referral and Shop, refresh, and verify visible values match the test account’s backend records.

## Release decision

The shared API/session layer and the implemented backend flows are statically and contract tested. The application is not ready to claim fully verified end-to-end production integration because the AI feature tensor is not produced from real landmarks, several draft endpoints are absent from the backend controller, and no authorized test environment/credentials were provided.

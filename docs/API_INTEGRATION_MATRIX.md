# SignLight Flutter API Integration Matrix

Audit baseline: Flutter branch `cd32e03`; backend contract and controller source from `sightlight/develope` commit `a64eacc` (2026-10-31). The production API was not mutated or blindly exercised. “Contract-tested” means verified with deterministic mocked HTTP responses matching the backend DTO/controller source, not with a production account.

| Feature / screen | Method and endpoint | Flutter implementation | Status | Validation evidence / remaining issue |
|---|---|---|---|---|
| Login | `POST /api/v1/auth/login` | `AuthRemoteDataSource`, `AuthRepositoryImpl`, `LoginPage` | Integrated, contract-tested | Auth model/widget tests pass. Real credentials unavailable. |
| Register | `POST /api/v1/auth/register` | `RegisterRequest`, `AuthNotifier`, `RegisterPage` | Integrated, contract-tested | Client validation now matches backend minimum 10 characters plus letter and digit. Email verification UI is still unavailable. |
| Google login | `POST /api/v1/auth/google` | `AuthNotifier.signInWithGoogle`, Android OAuth configuration | Integrated, device verification required | Uses the Web OAuth client as `serverClientId`; Android package/SHA must exist in the same Google Cloud project. |
| Refresh token | `POST /api/v1/auth/refresh` | `AuthInterceptor`, `TokenStorage` | Integrated, contract-tested | Concurrent 401 test proves one refresh rotation and one retry per request. |
| Logout | `POST /api/v1/auth/logout` | `AuthRepositoryImpl.logout` | Integrated | Local secure tokens are cleared even when backend logout fails. |
| Session restore / route protection | `GET /api/v1/me` | `AuthRepositoryImpl.getCurrentUser`, `AuthNotifier`, `GoRouter` | Integrated | Nested `MeResult.profile/preferences/roles` parsing repaired. Failed refresh clears state and returns to login. |
| Forgot password | `POST /api/v1/auth/password/forgot` | `ForgotPasswordPage` | Integrated, widget-tested | No destructive request was sent to production. |
| Reset password | `POST /api/v1/auth/password/reset` | Constant/model only | Blocked in UI | Latest Flutter app has no reset-token/deep-link screen. |
| Profile display | `GET /api/v1/me` | `UserRemoteDataSource`, `UserProfileDto`, `ProfilePage` | Integrated | Demo profile fallback removed; loading/error/retry states remain. |
| Edit profile | `PATCH /api/v1/me/profile` | Existing datasource/provider/UI | Backend-blocked | Listed in draft API spec, but `MeController` at `a64eacc` only implements `GET /me`. UI now rolls back optimistic state instead of pretending success. |
| Avatar upload | `PUT /api/v1/me/avatar` | Multipart upload in `UserRemoteDataSource` | Backend-blocked | Endpoint absent from actual `MeController`; no local-file fake success remains. |
| Server preferences | `PATCH /api/v1/me/preferences` | Settings page and repository | Backend-blocked | Endpoint absent from actual controller. Local app theme/language remain stored locally. |
| Course catalog | `GET /api/v1/courses` | `LearningRemoteDataSource`, `coursesProvider` | Integrated, contract-tested | Used to select the first available course if the user has no active course. |
| Learning path / Home | `GET /api/v1/courses/{courseId}/path` | `learningPathProvider`, `HomePage` | Integrated, contract/widget-tested | Hardcoded 17-unit roadmap removed. Lock, Premium lock, completion, score, and next lesson are mapped. |
| Lesson detail | `GET /api/v1/lessons/{lessonId}` | `LessonPage`, `lessonDetailProvider` | Integrated, contract-tested | Content blocks and safe answer options are rendered. |
| Submit lesson answer | `POST /api/v1/lessons/{lessonId}/exercises/{exerciseId}/answer` | `LessonPage`, learning repository | Integrated, contract/widget-tested | One exercise is shown at a time, matching the web flow. Choice, typed answer, `SENTENCE_ORDER`, and `MATCH_SIGN_MEANING` controls send the verified backend payload; correct answers are revealed only after server grading. |
| Complete lesson | `POST /api/v1/lessons/{lessonId}/complete` | `LessonPage` | Integrated | Uses a UUID idempotency key; invalidates learning/progress providers after success. |
| Dictionary search | `GET /api/v1/dictionary/search` | Dictionary datasource/provider/page | Integrated | Loading, empty, error, search history, and retry behavior retained. Hardcoded English business translations removed. |
| Dictionary topics | `GET /api/v1/dictionary/topics`, `GET /topics/{topic}/signs` | Dictionary datasource/provider/page | Integrated | No topic is silently removed; only empty topics are filtered. |
| Sign detail/media | `GET /api/v1/dictionary/signs/{id}`, media URLs | `SignDetailPage`, `SignVideoPlayer` | Integrated | Placeholder-video flags are respected. |
| Vocabulary trainer | `/api/v1/practice/vocabulary/*` | Legacy repository/provider | Backend-blocked | Draft spec lists endpoints, but no matching controller exists at `a64eacc`. Fake success/default sessions were removed; current navigation uses AI Practice. |
| Fingerspelling | `/api/v1/practice/fingerspell/*` | Legacy repository/provider | Backend-blocked | Same controller gap; old standalone screen was removed in `cd32e03`. |
| Number practice | `GET /api/v1/practice/numbers/session` | Legacy repository/provider | Backend-blocked | Same controller gap; no production mock fallback remains. |
| AI capabilities | `GET /api/v1/ai/capabilities?modelSize=30|400` | Practice datasource/repository/page | Integrated | Available model sizes are read from backend; unavailable 400-word option is disabled. |
| AI quota | `GET /api/v1/ai/quota` | Practice datasource/repository/page | Integrated | Remaining/unlimited quota is displayed. |
| AI session | `GET /api/v1/ai/practice/session?size=...&modelSize=...` | Practice datasource/repository/page | Integrated, widget-tested | Fixed missing `modelSize`, which previously allowed a 400 selection to use the default model. |
| AI attempt | `POST /api/v1/ai/attempts` | Practice datasource/page | Partially integrated | Numeric-only payload; no raw camera/video upload. Backend sync failures are shown and on-device inference remains available. Flutter currently synthesizes the 64×327 tensor from motion energy rather than extracting MediaPipe landmarks, so recognition accuracy is not verified and is a genuine blocker. |
| Progress overview/activity | `GET /api/v1/gamification/summary` | Gamification datasource/repository/pages | Integrated | Deprecated `/progress/*` calls fall back only to the real summary endpoint, never demo statistics. |
| Awards | `GET /api/v1/awards`, `POST /awards/{code}/celebrated` | Awards page | Backend-blocked / partial | Actual backend lacks both endpoints. Owned badge catalog is derived from real `gamification/store`; celebration mutation is unavailable. |
| Reward store | `GET /api/v1/gamification/store`, `POST /store/redeem` | `ShopPage`, gamification repository | Integrated, widget-tested | Hardcoded catalog fallback removed; API error and retry are visible. |
| Billing plans | `GET /api/v1/billing/plans` | Billing datasource/repository, Upgrade page | Integrated | Hardcoded prices and fake plan IDs removed. Empty/error states are explicit. |
| Checkout | `POST /api/v1/billing/checkout` | Billing repository/notifier | Integrated, not transaction-tested | Client sends only backend-supported `planId`; no payment secrets exist in Flutter. No real payment was initiated. |
| Payment status | `GET /api/v1/billing/status/{orderCode}` | Payment result page | Integrated, unit-tested | Fixed incorrect `/verify` path. Query-string `PAID` can no longer grant Premium; backend status is the source of truth. |
| Referral summary/code/reward | `GET /api/v1/referral/summary`, `POST /claim-code`, `POST /claim-reward` | `ReferralPage` | Integrated, widget-tested | Generated fake referral code/link fallback removed. |
| Notifications | `/api/v1/notifications*` | No current screen | Not applicable to existing UI | Backend supports it, but the latest Flutter UI commit removed `NotificationsPage`. |
| Push installation | `POST /api/v1/push/installations`, `/revoke` | No FCM client integration | Blocked | Requires Firebase Messaging/device-token lifecycle; Firebase Auth is not required. |

## Shared contract coverage

- Base URL is build-time configurable with `API_BASE_URL`; `/api/v1` remains part of endpoint constants, not the base URL.
- Every API request receives a UUID `X-Request-Id`; JSON maps receive `requestId` and `version: 1.0` when absent.
- A non-`00000` business code is rejected even when HTTP is 200.
- Malformed `/api/v1` responses without the standard envelope are rejected.
- Only idempotent requests are retried, once, for transient connection/502/503/504 failures.
- Refresh rotation is single-flight and cannot loop indefinitely.
- HTTP logs contain method, path, and status only—never query strings, headers, tokens, passwords, or bodies.

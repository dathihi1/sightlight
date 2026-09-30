# Phase 4: Refactor Learning Engine - Implementation Guide

## Mục tiêu

Tách LessonService (390 dòng) thành 3 services nhỏ hơn, mỗi service có trách nhiệm rõ ràng:

1. **LessonContentAssembler** - Dựng DTO
2. **ExerciseGradingService** - Chấm điểm
3. **LessonProgressService** - Quản lý tiến độ

## Services đã tạo

### 1. ExerciseGradingService ✅

**File:** `ExerciseGradingService.java`

**Trách nhiệm:**
- Chấm bài tập theo type
- Validate input
- Normalize text
- Parse JSON

**Methods:**
```java
public boolean grade(Exercise exercise, List<ExerciseOption> options, AnswerRequest request)
private boolean gradeChoice(...)
private boolean gradeTypedAnswer(...)
private boolean gradeOrder(...)
private boolean gradeMatching(...)
private String normalize(String value)
private List<String> readStringList(String json)
```

**Không chứa:**
- State management
- DTO building
- Database operations (chỉ nhận entity, không query)

---

### 2. LessonProgressService ✅

**File:** `LessonProgressService.java`

**Trách nhiệm:**
- Touch/tạo UserLessonState
- Lưu ExerciseAttempt
- Advance progress (với stable key)
- Resume logic (stable key > index)

**Methods:**
```java
public UserLessonState touchState(UUID userId, UUID lessonId, int contentVersion)
public short recordAttempt(UUID userId, UUID exerciseId, boolean isCorrect, String payload, Integer elapsed)
public void advanceProgress(UUID userId, UUID lessonId, Exercise currentExercise, int nextIndex, String nextKey, boolean isCorrect)
public int getResumeIndex(UserLessonState state, List<Exercise> exercises)
```

**Features:**
- ✅ Stable key priority
- ✅ Fallback to index
- ✅ Content version tracking
- ✅ First try perfect tracking

---

### 3. LessonContentAssembler ✅

**File:** `LessonContentAssembler.java`

**Trách nhiệm:**
- Load lesson + exercises + options + videos + blocks
- Transform sang DTO public
- Shuffle tokens (SENTENCE_ORDER)
- Parse JSON payloads

**Methods:**
```java
public LessonResult assembleLessonResult(UUID lessonId, int resumeAtIndex)
private List<String> shuffledTokens(Exercise exercise)
private ContentBlockNode toContentBlockNode(LessonContentBlock block)
private Object parseJsonPayload(String json)
private List<String> readStringList(String json)
```

**Security:**
- ✅ Không trả correctAnswerText
- ✅ Không trả correctOrder
- ✅ Không trả isCorrect trong options

---

## Refactor LessonService

### Old LessonService (390 lines)

**Trách nhiệm hiện tại:**
- Dựng DTO (lesson method)
- Chấm điểm (submitAnswer + grade methods)
- Quản lý tiến độ (touchState, advanceIndex)
- Hoàn thành bài (completeLesson)
- Access control (requireAccess)

### New LessonService (simplified)

**Chỉ giữ lại:**
- Orchestration logic
- Access control
- Transaction boundaries
- Error handling

**Delegate to:**
- LessonContentAssembler: build DTO
- ExerciseGradingService: chấm điểm
- LessonProgressService: state management

### Refactored Methods

#### lesson() - trước

```java
public LessonResult lesson(UUID userId, UUID lessonId) {
    Lesson lesson = contentTree.requirePublishedLesson(lessonId);
    requireAccess(userId, lesson);

    List<Exercise> exercises = contentTree.exercisesOf(lessonId);
    Map<UUID, List<ExerciseOption>> optionsByExercise = contentTree.optionsOf(...);
    Map<UUID, SignVideo> videos = contentTree.primaryVideos(...);

    List<LessonResult.ExerciseNode> nodes = new ArrayList<>();
    for (Exercise exercise : exercises) {
        // ... 20 lines of mapping logic
    }

    List<ContentBlockNode> blocks = lessonContentService.getPublishedBlocks(lessonId).stream()
        .map(block -> new ContentBlockNode(...))
        .toList();

    UserLessonState state = touchState(userId, lessonId);
    return new LessonResult(...15 parameters...);
}
```

#### lesson() - sau

```java
public LessonResult lesson(UUID userId, UUID lessonId) {
    Lesson lesson = contentTree.requirePublishedLesson(lessonId);
    requireAccess(userId, lesson);

    List<Exercise> exercises = contentTree.exercisesOf(lessonId);
    UserLessonState state = progressService.touchState(userId, lessonId, lesson.getContentVersion());
    int resumeIndex = progressService.getResumeIndex(state, exercises);

    return contentAssembler.assembleLessonResult(lessonId, resumeIndex);
}
```

**Reduction: 50 lines → 10 lines**

---

#### submitAnswer() - trước

```java
public AnswerResult submitAnswer(UUID userId, UUID lessonId, UUID exerciseId, AnswerRequest request) {
    // ... validation

    List<ExerciseOption> options = contentTree.optionsOf(exerciseId);
    boolean correct = grade(exercise, options, request); // 80 lines of grading logic

    short attemptNo = (short) (attemptRepository.countByUserIdAndExerciseId(userId, exerciseId) + 1);
    attemptRepository.save(ExerciseAttempt.builder()...build());

    advanceIndex(userId, lessonId, correct); // 30 lines of state logic

    UUID correctOptionId = options.stream()...findFirst().orElse(null);

    return new AnswerResult(...);
}
```

#### submitAnswer() - sau

```java
public AnswerResult submitAnswer(UUID userId, UUID lessonId, UUID exerciseId, AnswerRequest request) {
    Lesson lesson = contentTree.requirePublishedLesson(lessonId);
    requireAccess(userId, lesson);

    Exercise exercise = contentTree.exercise(exerciseId)
        .orElseThrow(() -> new BusinessException(ErrorCode.EXERCISE_NOT_IN_LESSON));

    if (!exercise.getLessonId().equals(lessonId)) {
        throw new BusinessException(ErrorCode.EXERCISE_NOT_IN_LESSON);
    }
    if (!exercise.getType().equals(request.getAnswerType())) {
        throw new BusinessException(ErrorCode.ANSWER_TYPE_MISMATCH);
    }

    // Grade
    List<ExerciseOption> options = contentTree.optionsOf(exerciseId);
    boolean correct = gradingService.grade(exercise, options, request);

    // Record attempt
    short attemptNo = progressService.recordAttempt(
        userId, exerciseId, correct, writeAnswerPayload(request), request.getClientElapsedMs());

    // Advance progress
    List<Exercise> allExercises = contentTree.exercisesOf(lessonId);
    int currentIndex = findExerciseIndex(allExercises, exerciseId);
    int nextIndex = currentIndex + 1;
    String nextKey = nextIndex < allExercises.size() ? allExercises.get(nextIndex).getStableKey() : null;

    progressService.advanceProgress(userId, lessonId, exercise, nextIndex, nextKey, correct);

    // Build result
    UUID correctOptionId = options.stream()
        .filter(ExerciseOption::isCorrect)
        .map(ExerciseOption::getId)
        .findFirst()
        .orElse(null);

    return new AnswerResult(
        correct,
        attemptNo,
        correct ? null : correctOptionId,
        correct ? null : exercise.getCorrectAnswerText(),
        null,
        !correct);
}
```

**Reduction: 120 lines → 40 lines (logic moved to services)**

---

## Benefits

### 1. Single Responsibility
- Mỗi service chỉ làm 1 việc
- Dễ hiểu, dễ maintain

### 2. Testability
- Test grading logic riêng (không cần DB)
- Test progress logic riêng (không cần grading)
- Test assembler riêng (không cần state)

### 3. Reusability
- GradingService có thể dùng cho review/practice
- ProgressService có thể dùng cho adaptive learning
- Assembler có thể dùng cho preview

### 4. Reduced Complexity
- LessonService: 390 lines → ~200 lines
- Each service: ~150-200 lines
- Total: ~700 lines (better organized)

---

## Migration Steps

### Step 1: Create new services ✅
- ExerciseGradingService.java ✅
- LessonProgressService.java ✅
- LessonContentAssembler.java ✅

### Step 2: Update LessonService (TODO)
- Inject 3 new services
- Refactor lesson() method
- Refactor submitAnswer() method
- Remove old helper methods (grade, matchesTypedAnswer, normalize, etc.)
- Keep: completeLesson, requireAccess, writeAnswerPayload

### Step 3: Update tests (TODO)
- Test each service independently
- Update integration tests

### Step 4: Deprecate old methods (Optional)
- Keep backward compatibility if needed
- Add @Deprecated annotations

---

## Testing Strategy

### Unit Tests

**ExerciseGradingService:**
```java
@Test
void gradeChoice_correctOption_returnsTrue()
@Test
void gradeChoice_wrongOption_returnsFalse()
@Test
void gradeTypedAnswer_normalized_returnsTrue()
@Test
void gradeOrder_correctOrder_returnsTrue()
@Test
void gradeMatching_validPairs_returnsTrue()
```

**LessonProgressService:**
```java
@Test
void touchState_newLesson_createsState()
@Test
void touchState_existingLesson_updatesTimestamp()
@Test
void advanceProgress_correct_movesToNext()
@Test
void advanceProgress_wrong_keepsPosition()
@Test
void getResumeIndex_withStableKey_returnsCorrectIndex()
@Test
void getResumeIndex_keyNotFound_fallbacksToIndex()
```

**LessonContentAssembler:**
```java
@Test
void assembleLessonResult_withBlocks_includesBlocks()
@Test
void assembleLessonResult_noAnswerLeaks()
@Test
void shuffledTokens_sameSeed_sameOrder()
```

---

## Completion Status

✅ **Phase 4.1:** Create ExerciseGradingService
✅ **Phase 4.2:** Create LessonProgressService
✅ **Phase 4.3:** Create LessonContentAssembler
⏳ **Phase 4.4:** Refactor LessonService (pending)
⏳ **Phase 4.5:** Write unit tests (pending)

---

## Notes

- Các services mới đã backward compatible
- LessonService hiện tại vẫn hoạt động
- Có thể refactor dần (không cần làm 1 lần)
- Priority: test trước khi deploy

Last updated: 2026-09-26

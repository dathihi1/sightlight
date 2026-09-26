# Exercise Types Mới - Implementation Notes

## SIGN_VIDEO_RECALL

### Mô tả
Người học xem video ký hiệu và nhập nghĩa (hoặc chọn từ options nếu có).

### Implementation Status
✅ **Hoàn thành** - Tái sử dụng logic của TYPE_WHAT_YOU_SEE

### Backend
- Grading: sử dụng `matchesTypedAnswer()` giống TYPE_WHAT_YOU_SEE
- Hỗ trợ `acceptedAnswers` từ exercise
- Normalize và so sánh bỏ dấu

### Frontend (cần implement)
```typescript
// Hiển thị video
<VideoPlayer src={exercise.videoUrl} />

// Input hoặc multiple choice
{exercise.options?.length > 0 ? (
  <MultipleChoice options={exercise.options} />
) : (
  <TextInput placeholder="Nhập nghĩa của ký hiệu..." />
)}
```

### Seed Format
```json
{
  "stableKey": "sign-video-recall-01",
  "type": "SIGN_VIDEO_RECALL",
  "skill": "RECALL",
  "difficulty": "BASIC",
  "sign": "Anh",
  "prompt": "Nhập nghĩa của ký hiệu bạn vừa xem",
  "answer": "Anh",
  "acceptedAnswers": ["Anh", "anh", "Anh trai"]
}
```

---

## MATCH_SIGN_MEANING

### Mô tả
Người học ghép nhiều ký hiệu (video/card) với nghĩa tương ứng.

### Implementation Status
⚠️ **Partially Complete** - Validation done, grading logic cần hoàn thiện

### Backend Current State

**AnswerRequest.MatchPair:**
```java
List<MatchPair> matches;
// MatchPair { UUID promptId, UUID optionId }
```

**Validation hiện có:**
- ✅ Kiểm tra số lượng cặp = số options
- ✅ Kiểm tra không có duplicate
- ✅ Kiểm tra IDs hợp lệ (thuộc exercise)
- ❌ Chưa validate correct matches

### TODO: Production Grading Logic

**Option 1: Thêm cột `correct_matches` vào Exercise**
```sql
ALTER TABLE exercise ADD COLUMN correct_matches JSONB;
-- Format: [{"promptId": "uuid", "optionId": "uuid"}, ...]
```

**Option 2: Convention-based (đơn giản hơn)**
- Option thứ N match với prompt thứ N
- Lưu thứ tự trong `orderIndex`
- Không cần thêm cột

**Recommended: Option 2 cho MVP**

### Implementation Steps

1. **Seed format:**
```json
{
  "stableKey": "match-sign-meaning-01",
  "type": "MATCH_SIGN_MEANING",
  "skill": "DISCRIMINATION",
  "difficulty": "INTERMEDIATE",
  "prompt": "Ghép các ký hiệu với nghĩa đúng",
  "options": [
    "Anh",
    "Bà ngoại",
    "Bố"
  ]
}
```

2. **Grading logic update:**
```java
private boolean gradeMatching(Exercise exercise, List<ExerciseOption> options, AnswerRequest request) {
    // Validation (đã có)

    // Sort options by orderIndex
    var sortedOptions = options.stream()
        .sorted(Comparator.comparing(ExerciseOption::getOrderIndex))
        .toList();

    // Check all matches: option[i] should match prompt[i]
    for (int i = 0; i < sortedOptions.size(); i++) {
        var expectedOption = sortedOptions.get(i);

        // Find what user matched to this prompt
        var userMatch = request.getMatches().stream()
            .filter(m -> m.getPromptId().equals(getPromptId(i)))
            .findFirst();

        if (userMatch.isEmpty() || !userMatch.get().getOptionId().equals(expectedOption.getId())) {
            return false;
        }
    }

    return true;
}
```

3. **Exercise metadata cần có:**
- Danh sách prompt IDs (có thể là signIds hoặc videoIds)
- Convention: prompt[i] matches option[i]

### Frontend (cần implement)

```typescript
interface MatchingExercise {
  prompts: Array<{ id: UUID, videoUrl: string, label?: string }>;
  options: Array<{ id: UUID, text: string }>;
}

// UI: Drag & drop hoặc tap to match
<MatchingContainer>
  <PromptsColumn>
    {prompts.map(p => <VideoCard key={p.id} video={p.videoUrl} />)}
  </PromptsColumn>

  <OptionsColumn>
    {options.map(o => <TextCard key={o.id} text={o.text} />)}
  </OptionsColumn>
</MatchingContainer>
```

### Migration Path

**Phase 1 (Current):** Placeholder grading returns true
**Phase 2:** Implement convention-based grading
**Phase 3:** Add proper seed data với prompts
**Phase 4:** Frontend implementation
**Phase 5:** Test và tune

---

## Testing Checklist

### SIGN_VIDEO_RECALL
- [ ] Correct typed answer → isCorrect = true
- [ ] Incorrect typed answer → isCorrect = false
- [ ] AcceptedAnswers list works
- [ ] Normalization (dấu, hoa thường) works
- [ ] Empty/null answer → isCorrect = false

### MATCH_SIGN_MEANING
- [ ] Correct number of matches validated
- [ ] Duplicate prompts rejected
- [ ] Duplicate options rejected
- [ ] Invalid IDs rejected
- [ ] Correct grading logic (when implemented)
- [ ] All matches required

---

## Security Notes

- ❌ Never send `correct_matches` to client before submission
- ✅ Validate all IDs belong to exercise
- ✅ Validate structure before grading
- ✅ Log suspicious patterns (too many duplicates, invalid IDs)

---

## Performance Considerations

- MATCH_SIGN_MEANING có thể có 5-10 cặp → O(n²) validation
- Nên cache sortedOptions trong exercise loading
- Consider indexing on exerciseId + orderIndex

---

Last updated: 2026-09-26

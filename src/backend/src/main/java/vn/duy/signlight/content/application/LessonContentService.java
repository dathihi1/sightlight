package vn.duy.signlight.content.application;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.content.domain.LessonContentBlock;
import vn.duy.signlight.content.repository.LessonContentBlockRepository;

/**
 * Service quản lý nội dung blocks của bài học.
 *
 * <p>Chịu trách nhiệm:
 * <ul>
 *   <li>Lấy blocks đã published theo thứ tự</li>
 *   <li>Đảm bảo không lộ dữ liệu internal</li>
 *   <li>Resolve references (sign, media)</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class LessonContentService {

    private static final String STATUS_PUBLISHED = "PUBLISHED";

    private final LessonContentBlockRepository blockRepository;

    public LessonContentService(LessonContentBlockRepository blockRepository) {
        this.blockRepository = blockRepository;
    }

    /**
     * Lấy tất cả blocks published của một bài học, sắp xếp theo orderIndex.
     *
     * @param lessonId ID của bài học
     * @return danh sách blocks đã published
     */
    public List<LessonContentBlock> getPublishedBlocks(UUID lessonId) {
        return blockRepository.findByLessonIdAndStatusOrderByOrderIndexAsc(lessonId, STATUS_PUBLISHED);
    }

    /**
     * Lấy tất cả blocks của một bài học (bao gồm draft), dùng cho admin/editor.
     *
     * @param lessonId ID của bài học
     * @return danh sách tất cả blocks
     */
    public List<LessonContentBlock> getAllBlocks(UUID lessonId) {
        return blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
    }

    /**
     * Kiểm tra xem một bài học có blocks hay không.
     *
     * @param lessonId ID của bài học
     * @return true nếu có ít nhất một block published
     */
    public boolean hasBlocks(UUID lessonId) {
        return !getPublishedBlocks(lessonId).isEmpty();
    }
}

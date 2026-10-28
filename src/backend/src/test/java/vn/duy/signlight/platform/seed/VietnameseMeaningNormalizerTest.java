package vn.duy.signlight.platform.seed;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class VietnameseMeaningNormalizerTest {

    @Test
    void replacesIncorrectGeneratedMeaningsWithReviewedVietnameseDefinitions() {
        assertThat(VietnameseMeaningNormalizer.normalize("Con gái", "Loài động vật quen thuộc: con gái"))
                .isEqualTo("Người con mang giới tính nữ trong gia đình.");
        assertThat(VietnameseMeaningNormalizer.normalize("Quả địa cầu", "Loại trái cây tươi ngon: quả địa cầu"))
                .isEqualTo("Mô hình thu nhỏ của Trái Đất, dùng để quan sát vị trí các khu vực địa lý.");
    }

    @Test
    void rewritesGeneratedCategoryTextIntoConsistentVietnamese() {
        assertThat(VietnameseMeaningNormalizer.normalize("Cái bàn", "Vật dụng, thiết bị sinh hoạt gia đình: cái bàn"))
                .isEqualTo("Tên đồ vật hoặc thiết bị dùng trong sinh hoạt: cái bàn.");
        assertThat(VietnameseMeaningNormalizer.normalize("Vui", "Cảm xúc, tâm trạng hoặc nhu cầu: vui"))
                .isEqualTo("Từ diễn tả cảm xúc, tâm trạng hoặc nhu cầu: vui.");
    }

    @Test
    void addsPunctuationToReviewedMeaning() {
        assertThat(VietnameseMeaningNormalizer.normalize("Bố", "Cha; bố"))
                .isEqualTo("Cha; bố.");
    }

    @Test
    void refreshesMeaningEmbeddedInExercisePrompt() {
        assertThat(VietnameseMeaningNormalizer.normalizePrompt(
                "Xem video (Gợi ý nghĩa: nghĩa cũ):",
                "Nghĩa tiếng Việt đã chuẩn hóa."))
                .isEqualTo("Xem video (Gợi ý nghĩa: Nghĩa tiếng Việt đã chuẩn hóa):");
    }
}

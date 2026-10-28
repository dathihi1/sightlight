package vn.duy.signlight.platform.seed;

import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Chuẩn hóa nghĩa từ VSL thành câu tiếng Việt rõ ràng, nhất quán. */
public final class VietnameseMeaningNormalizer {

    private static final Pattern EMBEDDED_MEANING = Pattern.compile("\\((Nghĩa|Gợi ý nghĩa):[^)]*\\)");

    private static final Map<String, String> CURATED_MEANINGS = Map.ofEntries(
            Map.entry("Anh", "Anh trai; cách xưng hô với người nam lớn tuổi hơn mình."),
            Map.entry("Cháu", "Con của anh, chị hoặc em; người thuộc thế hệ sau trong gia đình."),
            Map.entry("Chú", "Em trai của bố; cách gọi người đàn ông ít tuổi hơn bố."),
            Map.entry("Chồng", "Người đàn ông trong quan hệ hôn nhân với vợ."),
            Map.entry("Con gái", "Người con mang giới tính nữ trong gia đình."),
            Map.entry("Con trai", "Người con mang giới tính nam trong gia đình."),
            Map.entry("Cô", "Chị hoặc em gái của bố; cách gọi người phụ nữ lớn tuổi hơn mình."),
            Map.entry("Cậu", "Anh hoặc em trai của mẹ."),
            Map.entry("Dì", "Chị hoặc em gái của mẹ."),
            Map.entry("Vợ", "Người phụ nữ trong quan hệ hôn nhân với chồng."),
            Map.entry("Kế toán", "Người ghi chép, kiểm tra và quản lý thông tin tài chính."),
            Map.entry("Lễ tân", "Người đón tiếp, hướng dẫn khách tại cơ quan hoặc cơ sở dịch vụ."),
            Map.entry("Nhân viên phục vụ", "Người phục vụ khách tại nhà hàng, quán ăn hoặc cơ sở dịch vụ."),
            Map.entry("Nhân viên văn phòng", "Người làm các công việc hành chính hoặc chuyên môn tại văn phòng."),
            Map.entry("Sinh viên", "Người đang học tại trường đại học hoặc cao đẳng."),
            Map.entry("Thư ký", "Người hỗ trợ công việc hành chính, sắp xếp lịch và xử lý văn bản."),
            Map.entry("Đầu bếp", "Người chế biến món ăn trong gia đình hoặc cơ sở ăn uống."),
            Map.entry("Quả địa cầu", "Mô hình thu nhỏ của Trái Đất, dùng để quan sát vị trí các khu vực địa lý."),
            Map.entry("Quả đào", "Quả có vỏ mỏng, thịt mềm, thường có vị ngọt hoặc hơi chua."),
            Map.entry("Con trâu", "Động vật lớn thuộc họ bò, thường được nuôi để kéo cày."),
            Map.entry("Trung thu", "Tết Trung thu, diễn ra vào ngày rằm tháng Tám âm lịch."));

    private VietnameseMeaningNormalizer() {
    }

    public static String normalize(String word, String meaning) {
        String curated = CURATED_MEANINGS.get(word);
        if (curated != null) {
            return curated;
        }
        if (meaning == null || meaning.isBlank()) {
            return meaning;
        }

        String normalizedWord = lowerFirst(word == null ? "" : word.trim());
        if (meaning.startsWith("Tính từ miêu tả đặc điểm, tính chất:")) {
            return "Từ dùng để miêu tả đặc điểm hoặc trạng thái: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Hành động thực hiện trong đời sống:")) {
            return "Động từ chỉ hành động “" + normalizedWord + "” trong giao tiếp hoặc sinh hoạt hằng ngày.";
        }
        if (meaning.startsWith("Khái niệm chỉ thời gian, mốc lịch hoặc mùa:")) {
            return "Từ chỉ thời gian, mốc lịch hoặc mùa: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Vật dụng, thiết bị sinh hoạt gia đình:")) {
            return "Tên đồ vật hoặc thiết bị dùng trong sinh hoạt: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Món ăn hoặc thức uống truyền thống:")) {
            return "Tên món ăn hoặc thức uống: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Nơi chốn, địa điểm hoặc công trình:")) {
            return "Tên nơi chốn, địa điểm hoặc công trình: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Trang phục hoặc đồ dùng phụ kiện:")) {
            return "Tên trang phục hoặc phụ kiện: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Cảm xúc, tâm trạng hoặc nhu cầu:")) {
            return "Từ diễn tả cảm xúc, tâm trạng hoặc nhu cầu: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Môn thể thao hoặc hoạt động vui chơi giải trí:")) {
            return "Tên môn thể thao hoặc hoạt động giải trí: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Loài động vật quen thuộc:")) {
            return "Tên một loài động vật: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Loại trái cây tươi ngon:")) {
            return "Tên một loại trái cây: " + normalizedWord + ".";
        }
        if (meaning.startsWith("Ký hiệu biểu thị từ:")) {
            return "Từ vựng tiếng Việt: " + normalizedWord + ".";
        }

        String trimmed = meaning.trim();
        return trimmed.matches(".*[.!?…]$") ? trimmed : trimmed + ".";
    }

    public static String normalizePrompt(String prompt, String normalizedMeaning) {
        if (prompt == null || normalizedMeaning == null || normalizedMeaning.isBlank()) {
            return prompt;
        }
        String meaningWithoutFinalPunctuation = normalizedMeaning.replaceFirst("[.!?…]+$", "");
        Matcher matcher = EMBEDDED_MEANING.matcher(prompt);
        if (!matcher.find()) {
            return prompt;
        }
        String replacement = "(" + matcher.group(1) + ": " + meaningWithoutFinalPunctuation + ")";
        return matcher.replaceFirst(Matcher.quoteReplacement(replacement));
    }

    private static String lowerFirst(String value) {
        if (value.isEmpty()) {
            return value;
        }
        return value.substring(0, 1).toLowerCase(Locale.forLanguageTag("vi")) + value.substring(1);
    }
}

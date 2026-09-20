package vn.duy.signlight.common.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * Bộ test chung cho thuật toán chuẩn hoá nhãn (BR-A124, AC-44.2).
 *
 * <p>Đây là biện pháp giảm thiểu rủi ro <b>T-11</b>: nếu backend Java và dịch vụ AI Python chuẩn hoá
 * khác nhau dù chỉ một ký tự, nhãn sẽ thành mồ côi và người học nhận kết quả vô nghĩa mà không có
 * thông báo lỗi nào. Cùng bảng dữ liệu này được kiểm ở phía Python
 * ({@code src/ai/tests/test_labels.py}) — sửa một bên thì phải sửa cả hai.
 */
class StableSignIdTest {

    @DisplayName("Chuẩn hoá nhãn của mô hình thành khoá ổn định")
    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
        "Anh, anh",
        "Chị, chi",
        "Cháu, chau",
        "Cậu, cau",
        "Họ hàng, ho-hang",
        "Cái bàn, cai-ban",
        "Cái cửa, cai-cua",
        "Cái đèn, cai-den",
        "Cửa sổ, cua-so",
        "Giường, giuong",
        "Nồi cơm điện, noi-com-dien",
        "Máy điều hòa, may-dieu-hoa",
        "Quạt (đứng), quat-dung",
        "Trường Đại học, truong-dai-hoc",
        "Ngày Nhà giáo Việt Nam, ngay-nha-giao-viet-nam",
        "Ướt, uot",
        "Dễ, de",
    })
    void normalizesVietnameseLabels(String rawLabel, String expected) {
        assertEquals(expected, StableSignId.of(rawLabel));
    }

    @DisplayName("Chữ đ hoa và thường đều thành d — NFKD không tự tách được dấu gạch của đ")
    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
        "Đường, duong",
        "đường, duong",
        "ĐI ĐÂU, di-dau",
    })
    void handlesDStrokeSeparately(String rawLabel, String expected) {
        assertEquals(expected, StableSignId.of(rawLabel));
    }

    @DisplayName("Ký tự lạ và dấu cách thừa bị gom lại, không để lại gạch ngang ở hai đầu")
    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
        "'  Cái bàn  ', cai-ban",
        "'Cái---bàn', cai-ban",
        "'(Cái bàn)', cai-ban",
        "'Cái  bàn!!', cai-ban",
    })
    void collapsesSeparators(String rawLabel, String expected) {
        assertEquals(expected, StableSignId.of(rawLabel));
    }
}

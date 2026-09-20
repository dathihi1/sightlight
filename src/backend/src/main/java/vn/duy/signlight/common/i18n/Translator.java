package vn.duy.signlight.common.i18n;

import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

/**
 * Lấy {@code errorMessage} theo ngôn ngữ người dùng; {@code errorCode} không đổi theo ngôn ngữ.
 *
 * <p>GĐ1 hỗ trợ <b>vi</b> (mặc định) và <b>en</b>; locale khác rơi về tiếng Việt vì người dùng mục tiêu
 * ở Việt Nam (BRD §3).
 */
@Component
public class Translator {

    private static final Locale VIETNAMESE = Locale.forLanguageTag("vi");
    private static final List<String> SUPPORTED = List.of("vi", "en");

    private static MessageSource messageSource;

    @Autowired
    Translator(MessageSource messageSource) {
        Translator.messageSource = messageSource;
    }

    public static String toLocale(String key) {
        Locale locale = LocaleContextHolder.getLocale();
        Locale effective = SUPPORTED.contains(locale.getLanguage()) ? locale : VIETNAMESE;
        return messageSource.getMessage(key, null, effective);
    }
}

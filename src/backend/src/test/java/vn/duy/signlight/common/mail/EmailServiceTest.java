package vn.duy.signlight.common.mail;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender, new ObjectMapper());
        ReflectionTestUtils.setField(emailService, "mailEnabled", true);
        ReflectionTestUtils.setField(emailService, "fromAddress", "SignLight <signlight.forwork@gmail.com>");
        ReflectionTestUtils.setField(emailService, "resendApiKey", ""); // default disabled for unit test
    }

    @Test
    @DisplayName("Gửi OTP khi mailEnabled=false không ném ngoại lệ")
    void sendOtp_whenDisabled_doesNotThrow() {
        ReflectionTestUtils.setField(emailService, "mailEnabled", false);
        assertDoesNotThrow(() -> emailService.sendVerificationOtp("test@example.com", "123456"));
    }

    @Test
    @DisplayName("Gửi reset link khi mailEnabled=false không ném ngoại lệ")
    void sendPasswordReset_whenDisabled_doesNotThrow() {
        ReflectionTestUtils.setField(emailService, "mailEnabled", false);
        assertDoesNotThrow(() -> emailService.sendPasswordResetLink("test@example.com", "https://signlight.id.vn/reset?token=abc"));
    }
}

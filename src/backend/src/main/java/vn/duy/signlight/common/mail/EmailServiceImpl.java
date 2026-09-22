package vn.duy.signlight.common.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Implementation gui email qua JavaMailSender (SMTP).
 *
 * <p>Khi {@code signlight.mail.enabled=false} (moi truong local/dev), chi log OTP / URL ra console
 * ma khong gui that — giu nguyen API de Production co the bat len ma khong can sua code.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${signlight.mail.from:noreply@signlight.vn}")
    private String fromAddress;

    @Value("${signlight.mail.enabled:false}")
    private boolean mailEnabled;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendVerificationOtp(String toEmail, String otp) {
        String subject = "[SignLight] Ma xac nhan email cua ban";
        String body = String.join("\n",
                "Xin chao,",
                "",
                "Ma xac nhan email cua ban la: " + otp,
                "",
                "Ma co hieu luc trong 15 phut va chi dung duoc 1 lan.",
                "Neu ban khong thuc hien dang ky, hay bo qua email nay.",
                "",
                "Tran trong,",
                "Doi ngu SignLight"
        );
        send(toEmail, subject, body);
    }

    @Override
    public void sendPasswordResetLink(String toEmail, String resetUrl) {
        String subject = "[SignLight] Dat lai mat khau";
        String body = String.join("\n",
                "Xin chao,",
                "",
                "Chung toi da nhan duoc yeu cau dat lai mat khau cho tai khoan cua ban.",
                "",
                "Nhan vao lien ket duoi day de dat lai mat khau (hieu luc 60 phut):",
                resetUrl,
                "",
                "Neu ban khong yeu cau dat lai mat khau, hay bo qua email nay.",
                "Mat khau hien tai cua ban van an toan.",
                "",
                "Tran trong,",
                "Doi ngu SignLight"
        );
        send(toEmail, subject, body);
    }

    private void send(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("email_skipped_dev_mode to_domain={} subject={}",
                    maskDomain(to), subject);
            log.info("email_body_preview:\n{}", body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("email_sent to_domain={} subject={}", maskDomain(to), subject);
        } catch (Exception ex) {
            log.error("email_send_failed to_domain={} subject={} message={}",
                    maskDomain(to), subject, ex.getMessage());
        }
    }

    private String maskDomain(String email) {
        int at = email.indexOf('@');
        return at >= 0 ? email.substring(at) : "unknown";
    }
}

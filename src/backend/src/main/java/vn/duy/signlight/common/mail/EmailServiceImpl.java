package vn.duy.signlight.common.mail;

import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Implementation gửi email giao dịch qua JavaMailSender (SMTP) với giao diện HTML chuẩn thương hiệu SignLight.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${signlight.mail.from:SignLight <signlight.forwork@gmail.com>}")
    private String fromAddress;

    @Value("${signlight.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${signlight.mail.frontend-base-url:https://signlight.id.vn}")
    private String frontendBaseUrl;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendVerificationOtp(String toEmail, String otp) {
        String subject = "[SignLight] Mã xác nhận tài khoản của bạn: " + otp;
        String htmlContent = buildOtpEmailHtml(otp);
        sendHtml(toEmail, subject, htmlContent);
    }

    @Override
    public void sendPasswordResetLink(String toEmail, String resetUrl) {
        String subject = "[SignLight] Hướng dẫn đặt lại mật khẩu tài khoản";
        String htmlContent = buildPasswordResetEmailHtml(resetUrl);
        sendHtml(toEmail, subject, htmlContent);
    }

    private void sendHtml(String to, String subject, String htmlContent) {
        if (!mailEnabled) {
            log.info("email_skipped_dev_mode to_domain={} subject={}", maskDomain(to), subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("email_sent to_domain={} subject={}", maskDomain(to), subject);
        } catch (Exception ex) {
            log.error("email_send_failed to_domain={} subject={} error={}",
                    maskDomain(to), subject, ex.getMessage(), ex);
        }
    }

    private String buildOtpEmailHtml(String otp) {
        String template = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Mã xác nhận SignLight</title>
              <style>
                body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased; }
                .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 36px 0; }
                .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 540px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04); overflow: hidden; }
                .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center; }
                .brand-title { color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
                .brand-tagline { color: #bfdbfe; font-size: 13px; font-weight: 500; margin-top: 6px; }
                .content { padding: 36px 32px; }
                .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
                .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
                .otp-box { background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #93c5fd; border-radius: 16px; padding: 22px 16px; text-align: center; margin: 28px 0; }
                .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; margin-bottom: 8px; }
                .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #1e40af; margin: 0; line-height: 1.2; text-indent: 12px; }
                .notice-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px 8px 8px 4px; font-size: 13px; color: #92400e; line-height: 1.5; margin-bottom: 24px; }
                .footer { border-top: 1px solid #f1f5f9; padding: 24px 32px; background-color: #fafafa; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; }
                .footer a { color: #2563eb; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <table class="main" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td class="header">
                      <div style="font-size: 40px; line-height: 1; margin-bottom: 10px;">🤟</div>
                      <h1 class="brand-title">SignLight</h1>
                      <div class="brand-tagline">Nền tảng học Ngôn ngữ Ký hiệu tương tác AI</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <div class="greeting">Xin chào bạn,</div>
                      <div class="message">
                        Cảm ơn bạn đã đồng hành cùng <strong>SignLight</strong>! Để hoàn tất bước xác thực email và kích hoạt tài khoản của bạn, vui lòng nhập mã xác minh gồm 6 chữ số dưới đây:
                      </div>
                      <div class="otp-box">
                        <div class="otp-label">Mã xác nhận OTP</div>
                        <div class="otp-code">{{OTP}}</div>
                      </div>
                      <div class="notice-box">
                        ⚠️ <strong>Lưu ý bảo mật:</strong> Mã này có hiệu lực trong <strong>15 phút</strong> và chỉ sử dụng được 1 lần duy nhất. Tuyệt đối không chia sẻ mã cho bất kỳ ai.
                      </div>
                      <div class="message" style="margin-bottom: 0;">
                        Nếu bạn không thực hiện yêu cầu này tại SignLight, xin vui lòng bỏ qua email này.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="footer">
                      <div>Đội ngũ SignLight • Kết nối thế giới không khoảng cách</div>
                      <div style="margin-top: 6px;">
                        Website: <a href="https://signlight.id.vn" target="_blank">signlight.id.vn</a> • Hỗ trợ: <a href="mailto:signlight.forwork@gmail.com">signlight.forwork@gmail.com</a>
                      </div>
                      <div style="margin-top: 8px; color: #cbd5e1;">© 2026 SignLight. Tất cả quyền được bảo lưu.</div>
                    </td>
                  </tr>
                </table>
              </div>
            </body>
            </html>
            """;
        return template.replace("{{OTP}}", otp);
    }

    private String buildPasswordResetEmailHtml(String resetUrl) {
        String template = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Đặt lại mật khẩu SignLight</title>
              <style>
                body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased; }
                .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 36px 0; }
                .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 540px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04); overflow: hidden; }
                .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center; }
                .brand-title { color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
                .brand-tagline { color: #bfdbfe; font-size: 13px; font-weight: 500; margin-top: 6px; }
                .content { padding: 36px 32px; }
                .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
                .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
                .btn-container { text-align: center; margin: 32px 0; }
                .btn-reset { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; font-size: 16px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); text-align: center; }
                .notice-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px 8px 8px 4px; font-size: 13px; color: #92400e; line-height: 1.5; margin-bottom: 24px; }
                .url-fallback { font-size: 12px; color: #475569; line-height: 1.5; word-break: break-all; margin-top: 10px; background-color: #f1f5f9; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .footer { border-top: 1px solid #f1f5f9; padding: 24px 32px; background-color: #fafafa; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; }
                .footer a { color: #2563eb; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <table class="main" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td class="header">
                      <div style="font-size: 40px; line-height: 1; margin-bottom: 10px;">🔐</div>
                      <h1 class="brand-title">SignLight</h1>
                      <div class="brand-tagline">Nền tảng học Ngôn ngữ Ký hiệu tương tác AI</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <div class="greeting">Xin chào bạn,</div>
                      <div class="message">
                        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản SignLight của bạn. Hãy bấm vào nút bên dưới để tiến hành tạo mật khẩu mới:
                      </div>
                      <div class="btn-container">
                        <a href="{{RESET_URL}}" target="_blank" class="btn-reset">Đặt lại mật khẩu ngay</a>
                      </div>
                      <div class="notice-box">
                        ⏰ <strong>Thời hạn liên kết:</strong> Liên kết có hiệu lực trong <strong>60 phút</strong> và chỉ sử dụng được 1 lần. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email và mật khẩu hiện tại của bạn vẫn được bảo vệ an toàn.
                      </div>
                      <div style="font-size: 13px; color: #64748b; margin-top: 24px;">
                        Nếu nút bấm bên trên không hoạt động, bạn có thể sao chép và dán trực tiếp liên kết sau vào trình duyệt:
                        <div class="url-fallback">{{RESET_URL}}</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="footer">
                      <div>Đội ngũ SignLight • Kết nối thế giới không khoảng cách</div>
                      <div style="margin-top: 6px;">
                        Website: <a href="https://signlight.id.vn" target="_blank">signlight.id.vn</a> • Hỗ trợ: <a href="mailto:signlight.forwork@gmail.com">signlight.forwork@gmail.com</a>
                      </div>
                      <div style="margin-top: 8px; color: #cbd5e1;">© 2026 SignLight. Tất cả quyền được bảo lưu.</div>
                    </td>
                  </tr>
                </table>
              </div>
            </body>
            </html>
            """;
        return template.replace("{{RESET_URL}}", resetUrl);
    }

    private String maskDomain(String email) {
        int at = email.indexOf('@');
        return at >= 0 ? email.substring(at) : "unknown";
    }
}

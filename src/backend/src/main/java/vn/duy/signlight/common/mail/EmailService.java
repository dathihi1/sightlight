package vn.duy.signlight.common.mail;

/** Gui email giao dich (OTP xac nhan, dat lai mat khau). */
public interface EmailService {

    /**
     * Gui OTP 6 so xac nhan email.
     *
     * @param toEmail dia chi nguoi nhan
     * @param otp     ma OTP dang plaintext
     */
    void sendVerificationOtp(String toEmail, String otp);

    /**
     * Gui lien ket dat lai mat khau.
     *
     * @param toEmail  dia chi nguoi nhan
     * @param resetUrl URL day du co token embed
     */
    void sendPasswordResetLink(String toEmail, String resetUrl);
}

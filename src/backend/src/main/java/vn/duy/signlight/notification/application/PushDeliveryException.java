package vn.duy.signlight.notification.application;

public class PushDeliveryException extends RuntimeException {

    private final String errorCode;
    private final boolean invalidInstallation;

    public PushDeliveryException(String errorCode, boolean invalidInstallation, Throwable cause) {
        super(errorCode, cause);
        this.errorCode = errorCode;
        this.invalidInstallation = invalidInstallation;
    }

    public String errorCode() {
        return errorCode;
    }

    public boolean invalidInstallation() {
        return invalidInstallation;
    }
}

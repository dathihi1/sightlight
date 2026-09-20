package vn.duy.signlight.identity.domain;

/** Vòng đời tài khoản (LLD §1.2, FR-08). */
public enum UserStatus {

    PENDING_VERIFICATION,
    ACTIVE,
    SUSPENDED,
    PENDING_DELETION,
    DELETED;

    public String value() {
        return name();
    }
}

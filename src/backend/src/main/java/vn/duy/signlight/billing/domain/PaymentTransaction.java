package vn.duy.signlight.billing.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_transaction")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "plan_id", nullable = false, length = 32)
    private String planId;

    @Column(name = "order_code", nullable = false, unique = true)
    private long orderCode;

    @Column(name = "order_ref", nullable = false, length = 64, unique = true)
    private String orderRef;

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String provider = "PAYOS";

    @Column(nullable = false)
    private int amount;

    @Column(nullable = false, length = 24)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "payment_link_id", length = 128)
    private String paymentLinkId;

    @Column(name = "checkout_url", length = 1024)
    private String checkoutUrl;

    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode;

    @Column(name = "provider_transaction_no", length = 128)
    private String providerTransactionNo;

    @Column(name = "webhook_signature", length = 256)
    private String webhookSignature;

    @Column(name = "account_number", length = 64)
    private String accountNumber;

    @Column(name = "account_name", length = 128)
    private String accountName;

    @Column(name = "bin", length = 16)
    private String bin;

    @Column(name = "bank_name", length = 128)
    private String bankName;

    @Column(name = "description", length = 256)
    private String description;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}

package vn.duy.signlight.billing.web.dto;

public record CheckoutResult(
        long orderCode,
        String orderRef,
        int amount,
        String checkoutUrl,
        String qrCode,
        String status,
        String accountNumber,
        String accountName,
        String bin,
        String bankName,
        String description) {

    public CheckoutResult(long orderCode, String orderRef, int amount, String checkoutUrl, String qrCode, String status) {
        this(orderCode, orderRef, amount, checkoutUrl, qrCode, status, null, null, null, null, null);
    }
}

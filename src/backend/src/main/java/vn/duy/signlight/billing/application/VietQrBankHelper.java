package vn.duy.signlight.billing.application;

import java.util.Map;

public final class VietQrBankHelper {

    private static final Map<String, String> BIN_TO_NAME = Map.ofEntries(
            Map.entry("970418", "BIDV (Ngân hàng TMCP Đầu tư và Phát triển Việt Nam)"),
            Map.entry("970422", "MBBank (Ngân hàng TMCP Quân Đội)"),
            Map.entry("970436", "Vietcombank (Ngân hàng TMCP Ngoại thương Việt Nam)"),
            Map.entry("970415", "VietinBank (Ngân hàng TMCP Công Thương Việt Nam)"),
            Map.entry("970407", "Techcombank (Ngân hàng TMCP Kỹ Thương Việt Nam)"),
            Map.entry("970416", "ACB (Ngân hàng TMCP Á Châu)"),
            Map.entry("970423", "TPBank (Ngân hàng TMCP Tiên Phong)"),
            Map.entry("970432", "VPBank (Ngân hàng TMCP Việt Nam Thịnh Vượng)"),
            Map.entry("970441", "VIB (Ngân hàng TMCP Quốc tế Việt Nam)"),
            Map.entry("970405", "Agribank (Ngân hàng Nông nghiệp và PTNT Việt Nam)"),
            Map.entry("970403", "Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)"),
            Map.entry("970448", "OCB (Ngân hàng TMCP Phương Đông)"),
            Map.entry("970437", "HDBank (Ngân hàng TMCP Phát triển TP.HCM)"),
            Map.entry("970443", "SHB (Ngân hàng TMCP Sài Gòn - Hà Nội)"),
            Map.entry("970426", "MSB (Ngân hàng TMCP Hàng Hải Việt Nam)")
    );

    private VietQrBankHelper() {
    }

    public static String getBankName(String bin) {
        if (bin == null || bin.isBlank()) {
            return "BIDV (Ngân hàng TMCP Đầu tư và Phát triển Việt Nam)";
        }
        return BIN_TO_NAME.getOrDefault(bin, "Ngân hàng (BIN " + bin + ")");
    }
}

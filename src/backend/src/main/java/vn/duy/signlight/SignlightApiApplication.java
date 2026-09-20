package vn.duy.signlight;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Điểm khởi động dịch vụ API — modular monolith `vn.duy.signlight` (HLD §1). */
@SpringBootApplication
@EnableScheduling
public class SignlightApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SignlightApiApplication.class, args);
    }
}

package vn.duy.signlight.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI <b>sinh từ code</b> (springdoc) và được đối chiếu với {@code docs/sa/api-spec.md} ở GATE-4.
 * Không ai viết YAML tay; mâu thuẫn giữa code và api-spec thì api-spec (đã duyệt) thắng.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER = "bearerAuth";

    @Bean
    public OpenAPI signlightOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("SignLight API")
                        .version("0.1.0")
                        .description("Nền tảng học Ngôn ngữ Ký hiệu Việt Nam (VSL). "
                                + "Dữ liệu huấn luyện mô hình AI: VSL400 (Zenodo) — giấy phép CC BY 4.0."))
                .components(new Components().addSecuritySchemes(BEARER, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }
}

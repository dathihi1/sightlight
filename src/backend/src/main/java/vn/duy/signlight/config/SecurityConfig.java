package vn.duy.signlight.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.identity.application.JwtAuthenticationFilter;

/**
 * Cấu hình bảo mật — mọi endpoint yêu cầu Bearer JWT trừ danh sách công khai ở api-spec §1/§2.
 *
 * <p>Kiểm quyền luôn nằm ở backend kể cả khi giao diện đã ẩn nút (BR-A67, NFR-07).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/health",
            "/actuator/health",
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/google",
            "/api/v1/auth/email/verify",
            "/api/v1/auth/email/resend",
            "/api/v1/auth/password/forgot",
            "/api/v1/auth/password/reset",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/media/**",
            "/api/v1/onboarding/answers",
            "/api/v1/onboarding/answers/**",
            "/api/v1/courses/**",
            "/api/v1/dictionary/search",
            "/api/v1/dictionary/signs/**",
            "/api/v1/dictionary/topics",
            "/api/v1/billing/plans",
            "/api/v1/billing/ipn/**",
            "/api/v1/billing/return/**",
            "/api/v1/certificates/verify/**",
            "/api/v1/business-inquiries",
            "/api/v1/articles",
            "/api/v1/articles/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    private final ObjectMapper objectMapper;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(ObjectMapper objectMapper, JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.objectMapper = objectMapper;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /** Argon2id theo tham số OWASP đã chốt ở techstack: m = 19 MiB, t = 2, p = 1. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(16, 32, 1, 19 * 1024, 2);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
            // `mvcHandlerMappingIntrospector` của Spring MVC cũng là một CorsConfigurationSource,
            // nên phải chỉ đích danh bean của mình.
            @Qualifier("corsConfigurationSource") CorsConfigurationSource corsSource)
            throws Exception {
        http
                .csrf(csrf -> csrf.disable())   // API không dùng cookie phiên; refresh token có CSRF riêng
                .cors(cors -> cors.configurationSource(corsSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers("/api/v1/cms/content/*/approve").hasAnyRole("CONTENT_APPROVER", "ADMIN")
                        .requestMatchers("/api/v1/cms/**").hasAnyRole("CONTENT_CREATOR", "CONTENT_APPROVER", "ADMIN")
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, ex) ->
                                writeEnvelope(response, HttpServletResponse.SC_UNAUTHORIZED,
                                        ErrorCode.UNAUTHENTICATED))
                        .accessDeniedHandler((request, response, ex) ->
                                writeEnvelope(response, HttpServletResponse.SC_FORBIDDEN,
                                        ErrorCode.FORBIDDEN)))
                .headers(Customizer.withDefaults())
                .addFilterBefore(jwtAuthenticationFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @org.springframework.beans.factory.annotation.Value("${signlight.cors.allowed-origins}")
            List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE,
                RequestIdFilter.HEADER, HttpHeaders.ACCEPT_LANGUAGE, HttpHeaders.RANGE));
        config.setExposedHeaders(List.of(RequestIdFilter.HEADER, HttpHeaders.RETRY_AFTER,
                HttpHeaders.CONTENT_RANGE, HttpHeaders.ACCEPT_RANGES, HttpHeaders.CONTENT_LENGTH));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    /**
     * Lỗi 401/403 xảy ra <b>trước</b> controller nên không đi qua {@code @RestControllerAdvice};
     * phải tự ghi envelope ở đây để client luôn nhận cùng một cấu trúc.
     */
    private void writeEnvelope(HttpServletResponse response, int status, ErrorCode errorCode) {
        try {
            response.setStatus(status);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            objectMapper.writeValue(response.getOutputStream(),
                    ApiResponses.error(MDC.get(RequestIdFilter.MDC_KEY), errorCode.getCode()));
        } catch (java.io.IOException ignored) {
            // Kết nối đã đóng — không còn gì để trả lời.
        }
    }
}

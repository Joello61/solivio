package com.solivio.api.identity.infrastructure.security.cookie;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Origins autorises pour les requetes cross-origin du frontend.
 * Valeur unique separee par virgule ou valeur vide (CORS desactive).
 */
@ConfigurationProperties(prefix = "solivio.cors")
public class CorsProperties {

    private String allowedOrigins;

    public String getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public List<String> getAllowedOriginsList() {
        if (!StringUtils.hasText(allowedOrigins)) {
            return List.of();
        }
        return List.of(allowedOrigins.split(","));
    }
}

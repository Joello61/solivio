package com.solivio.api;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    KafkaContainer kafkaContainer() {
        return new KafkaContainer(DockerImageName.parse("apache/kafka-native:latest"));
    }

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer(DockerImageName.parse("postgres:latest"));
    }

    /**
     * Fournit un ClientRegistrationRepository avec des URIs explicites pour eviter
     * la decouverte OIDC automatique qui tenterait de joindre Keycloak au demarrage.
     */
    @Bean
    @Primary
    ClientRegistrationRepository testClientRegistrationRepository() {
        ClientRegistration keycloak = ClientRegistration
            .withRegistrationId("keycloak")
            .clientId("test-client")
            .clientSecret("test-secret")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .authorizationUri("http://localhost:9999/realms/test/protocol/openid-connect/auth")
            .tokenUri("http://localhost:9999/realms/test/protocol/openid-connect/token")
            .userInfoUri("http://localhost:9999/realms/test/protocol/openid-connect/userinfo")
            .jwkSetUri("http://localhost:9999/realms/test/protocol/openid-connect/certs")
            .scope("openid")
            .build();
        return new InMemoryClientRegistrationRepository(keycloak);
    }

    /**
     * Mock OAuth2AuthorizedClientManager : evite toute tentative de connexion
     * a Keycloak pendant les tests d'integration.
     */
    @Bean
    @Primary
    OAuth2AuthorizedClientManager testAuthorizedClientManager() {
        return authorizeRequest -> null;
    }

    /**
     * Remplace le decoder JWT auto-configure qui tenterait de joindre Keycloak.
     * En test, tout token est accepte ; la securite est testee separement.
     */
    @Bean
    @Primary
    JwtDecoder testJwtDecoder() {
        return token -> Jwt.withTokenValue(token)
            .header("alg", "none")
            .claim("sub", "test-user")
            .claim("email", "test@example.com")
            .claim("given_name", "Test")
            .claim("family_name", "User")
            .claim("realm_access", Map.of("roles", java.util.List.of("beneficiaire")))
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();
    }
}

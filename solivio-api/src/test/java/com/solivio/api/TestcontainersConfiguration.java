package com.solivio.api;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer(DockerImageName.parse("postgres:18-alpine"));
    }

    @Bean
    GenericContainer<?> mailpitContainer() {
        return new GenericContainer<>(DockerImageName.parse("axllent/mailpit:v1.31.4"))
            .withExposedPorts(1025, 8025)
            .waitingFor(Wait.forHttp("/api/v1/messages").forPort(8025));
    }

    /**
     * Enregistre les proprietes spring.mail apres le demarrage du container Mailpit.
     * DynamicPropertyRegistrar est evalue apres le cycle de vie des beans Testcontainers.
     */
    @Bean
    DynamicPropertyRegistrar mailpitProperties(GenericContainer<?> mailpitContainer) {
        return registry -> {
            registry.add("spring.mail.host", mailpitContainer::getHost);
            registry.add("spring.mail.port", () -> mailpitContainer.getMappedPort(1025));
            registry.add("solivio.test.mailpit.api.base-url",
                () -> "http://" + mailpitContainer.getHost() + ":" + mailpitContainer.getMappedPort(8025));
        };
    }

    /**
     * Fournit un ClientRegistrationRepository Google avec des URIs statiques
     * pour eviter tout appel reseau au demarrage des tests.
     */
    @Bean
    @Primary
    ClientRegistrationRepository testClientRegistrationRepository() {
        ClientRegistration google = ClientRegistration
            .withRegistrationId("google")
            .clientId("test-google-client-id")
            .clientSecret("test-google-client-secret")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://oauth2.googleapis.com/token")
            .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
            .userNameAttributeName("sub")
            .scope("openid", "profile", "email")
            .build();
        return new InMemoryClientRegistrationRepository(google);
    }
}

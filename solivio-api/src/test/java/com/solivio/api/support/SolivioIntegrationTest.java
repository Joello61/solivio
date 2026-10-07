package com.solivio.api.support;

import com.solivio.api.TestcontainersConfiguration;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Meta-annotation pour tous les tests d'integration : contexte Spring complet,
 * vraie base PostgreSQL (Testcontainers) videe avant chaque test.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(properties = {
        "solivio.cors.allowed-origins=http://localhost:3000",
        "solivio.auth.jwt-secret=test-jwt-secret-key-must-be-at-least-32-bytes-long",
        "solivio.auth.access-token-expiration-minutes=15",
        "solivio.auth.refresh-token-expiration-days=30"
    }
)
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@ExtendWith(NettoyageBaseExtension.class)
public @interface SolivioIntegrationTest {
}

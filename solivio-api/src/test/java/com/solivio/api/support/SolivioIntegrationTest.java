package com.solivio.api.support;

import com.solivio.api.TestcontainersConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Meta-annotation pour tous les tests d'integration.
 *
 * Desactive Spring Cloud Vault via les properties de @SpringBootTest,
 * seul moyen officiel de court-circuiter le ConfigDataEnvironmentPostProcessor
 * avant qu'il ne tente l'import Vault (les fichiers de profil arrivent trop tard).
 *
 * Reference : VaultConfigDisabledTests.java dans le projet Spring Cloud Vault.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(properties = {
        "spring.cloud.vault.enabled=false",
        "spring.config.import=optional:vault://",
        "solivio.cors.allowed-origins=http://localhost:3000",
        "solivio.auth.jwt-secret=test-jwt-secret-key-must-be-at-least-32-bytes-long",
        "solivio.auth.access-token-expiration-minutes=15",
        "solivio.auth.refresh-token-expiration-days=30"
    }
)
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public @interface SolivioIntegrationTest {
}

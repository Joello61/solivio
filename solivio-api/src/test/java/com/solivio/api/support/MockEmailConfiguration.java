package com.solivio.api.support;

import com.solivio.api.identity.application.EmailService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Remplace l'EmailService reel par un no-op pour eviter les appels SMTP dans les tests.
 */
@TestConfiguration
public class MockEmailConfiguration {

    @Bean
    @Primary
    public EmailService mockEmailService() {
        return new EmailService() {
            @Override public void envoyerBienvenue(Compte compte) {}
            @Override public void envoyerVerificationEmail(Compte compte, String code) {}
            @Override public void envoyerResetMotDePasse(Compte compte, String code) {}
            @Override public void envoyerConfirmationChangementMotDePasse(Compte compte) {}
            @Override public void envoyerInvitation(Invitation invitation) {}
        };
    }
}

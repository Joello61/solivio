package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import com.solivio.api.identity.SolivioUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordServiceTest {

    @Mock
    private CompteRepository compteRepository;
    @Mock
    private VerificationCodeService verificationCodeService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private PasswordService service;
    private Compte compte;

    @BeforeEach
    void setUp() {
        service = new PasswordService(compteRepository, verificationCodeService, passwordEncoder, emailService,
            refreshTokenRepository);
        compte = new Compte("alice@example.com", "old-hash", "Dupont", "Alice");
    }

    @Test
    void demanderReset_envoieEmailQuandCompteExiste() {
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(verificationCodeService.generer(any(), eq(VerificationCode.TYPE_PASSWORD_RESET)))
            .thenReturn(new com.solivio.api.identity.domain.VerificationCode(
                compte, "123456", VerificationCode.TYPE_PASSWORD_RESET,
                java.time.Instant.now().plusSeconds(900)));

        service.demanderReset("alice@example.com");

        verify(emailService).envoyerResetMotDePasse(any(), any());
    }

    @Test
    void demanderReset_nEnvoiePasEmailQuandCompteInexistant() {
        when(compteRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        service.demanderReset("unknown@example.com");

        verify(emailService, never()).envoyerResetMotDePasse(any(), any());
    }

    @Test
    void resetMotDePasse_lanceExceptionSiCodeInvalide() {
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(verificationCodeService.valider(any(), eq("badcode"), any())).thenReturn(false);

        assertThatThrownBy(() -> service.resetMotDePasse("alice@example.com", "badcode", "newPassword123!"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("invalide");
    }

    @Test
    void changerMotDePasse_lanceExceptionSiMotDePasseActuelIncorrect() {
        UUID id = UUID.randomUUID();
        compte = new Compte("alice@example.com", "correct-hash", "Dupont", "Alice");
        when(compteRepository.findById(id)).thenReturn(Optional.of(compte));
        when(passwordEncoder.matches("wrongpass", "correct-hash")).thenReturn(false);

        SolivioUserDetails userDetails = new SolivioUserDetails(
            id, "alice@example.com", "correct-hash", false, List.of(), true);

        assertThatThrownBy(() -> service.changerMotDePasse(userDetails, "wrongpass", "newpass123!"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Mot de passe actuel incorrect");
    }

    @Test
    void resetMotDePasse_revoqueLesSessionsOuvertes() {
        UUID id = UUID.randomUUID();
        compte.setId(id);
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(verificationCodeService.valider(compte, "654321", VerificationCode.TYPE_PASSWORD_RESET)).thenReturn(true);
        when(passwordEncoder.encode("nouveau-mdp-solide")).thenReturn("new-hash");

        service.resetMotDePasse("alice@example.com", "654321", "nouveau-mdp-solide");

        verify(refreshTokenRepository).revoquerTousParCompte(id);
        verify(emailService).envoyerConfirmationChangementMotDePasse(compte);
    }

    @Test
    void changerMotDePasse_revoqueLesSessionsOuvertes() {
        UUID id = UUID.randomUUID();
        compte = new Compte("alice@example.com", "correct-hash", "Dupont", "Alice");
        compte.setId(id);
        when(compteRepository.findById(id)).thenReturn(Optional.of(compte));
        when(passwordEncoder.matches("actuel", "correct-hash")).thenReturn(true);
        when(passwordEncoder.encode("nouveau-mdp-solide")).thenReturn("new-hash");
        SolivioUserDetails userDetails = new SolivioUserDetails(
            id, "alice@example.com", "correct-hash", false, List.of(), true);

        service.changerMotDePasse(userDetails, "actuel", "nouveau-mdp-solide");

        verify(refreshTokenRepository).revoquerTousParCompte(id);
    }
}

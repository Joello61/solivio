package com.solivio.api.identity.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegisterServiceTest {

    @Mock private CompteRepository compteRepository;
    @Mock private AssociationRepository associationRepository;
    @Mock private MembreAssociationRepository membreRepo;
    @Mock private InvitationRepository invitationRepository;
    @Mock private VerificationCodeService verificationCodeService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;

    private RegisterService service;

    @BeforeEach
    void setUp() {
        service = new RegisterService(compteRepository, associationRepository, membreRepo,
            invitationRepository, verificationCodeService, passwordEncoder, emailService);
    }

    @Test
    void inscrireBeneficiaire_lanceExceptionSiEmailDejaPris() {
        when(compteRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.inscrireBeneficiaire(
            "alice@example.com", "pass", "Dupont", "Alice", "PILOTE"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Un compte existe deja");
    }

    @Test
    void inscrireBeneficiaire_lanceExceptionSiCodeAssoInconnu() {
        when(compteRepository.existsByEmail(any())).thenReturn(false);
        when(associationRepository.findByCode("BADCODE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.inscrireBeneficiaire(
            "bob@example.com", "pass", "Martin", "Bob", "BADCODE"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Code association inconnu");
    }

    @Test
    void inscrireBeneficiaire_creerCompteEtMembre() {
        Association asso = new Association("pilote", "Pilote");
        Compte compte = new Compte("bob@example.com", "hash", "Martin", "Bob");
        when(compteRepository.existsByEmail("bob@example.com")).thenReturn(false);
        when(associationRepository.findByCode("PILOTE")).thenReturn(Optional.of(asso));
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(compteRepository.save(any())).thenReturn(compte);
        when(membreRepo.save(any())).thenReturn(null);
        VerificationCode vc = new VerificationCode(compte, "123456",
            VerificationCode.TYPE_EMAIL, Instant.now().plusSeconds(900));
        when(verificationCodeService.generer(any(), any())).thenReturn(vc);

        service.inscrireBeneficiaire("bob@example.com", "pass", "Martin", "Bob", "PILOTE");

        verify(compteRepository).save(any());
        verify(membreRepo).save(any());
        verify(emailService).envoyerVerificationEmail(any(), any());
    }

    @Test
    void verifierEmail_lanceExceptionSiCodeInvalide() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(verificationCodeService.valider(any(), any(), any())).thenReturn(false);

        assertThatThrownBy(() -> service.verifierEmail("alice@example.com", "000000"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("invalide");
    }

    @Test
    void verifierEmail_marqueEmailVerifie() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(verificationCodeService.valider(any(), any(), any())).thenReturn(true);
        when(compteRepository.save(any())).thenReturn(compte);

        service.verifierEmail("alice@example.com", "123456");

        verify(compteRepository).save(any());
        verify(emailService).envoyerBienvenue(any());
    }

    @Test
    void inscrireViaInvitation_lanceExceptionSiTokenInvalide() {
        UUID token = UUID.randomUUID();
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.inscrireViaInvitation(
            "guest@example.com", "pass", "Guest", "User", token))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invitation invalide");
    }

    @Test
    void inscrireViaInvitation_lanceExceptionSiEmailNeConcordePas() {
        UUID token = UUID.randomUUID();
        Association asso = new Association("pilote", "Pilote");
        Compte inviteur = new Compte("boss@example.com", "hash", "Boss", "B");
        Invitation invitation = new Invitation(
            "invited@example.com", asso, "benevole", inviteur,
            Instant.now().plusSeconds(3600));
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> service.inscrireViaInvitation(
            "wrong@example.com", "pass", "Wrong", "User", token))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("correspond pas");
    }

    @Test
    void renvoyerVerification_neRienFaitSiEmailDejaVerifie() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setEmailVerifie(true);
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));

        service.renvoyerVerification("alice@example.com");

        verify(emailService, never()).envoyerVerificationEmail(any(), any());
    }
}

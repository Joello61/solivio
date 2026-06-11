package com.solivio.api.identity.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.domain.MembreAssociation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    @Mock private PersonneProvisioningService personneProvisioningService;

    private RegisterService service;

    @BeforeEach
    void setUp() {
        service = new RegisterService(compteRepository, associationRepository, membreRepo,
            invitationRepository, verificationCodeService, passwordEncoder, emailService,
            personneProvisioningService);
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
        verify(personneProvisioningService).provisionner(
            eq(asso.getSlug()), eq("bob@example.com"), eq("Martin"), eq("Bob")
        );
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
    void lierAssociationGoogle_lanceExceptionSiCompteIntrouvable() {
        when(compteRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.lierAssociationGoogle(
            "unknown@example.com", "Nom", "Prenom", "PILOTE", null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("introuvable");
    }

    @Test
    void lierAssociationGoogle_lanceExceptionSiPasGoogleId() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));

        assertThatThrownBy(() -> service.lierAssociationGoogle(
            "alice@example.com", "Dupont", "Alice", "PILOTE", null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Google");
    }

    @Test
    void lierAssociationGoogle_lanceExceptionSiDejaAffilie() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setGoogleId("google-uid");
        Association asso = new Association("pilote", "Pilote");
        MembreAssociation membre = new MembreAssociation(compte, asso, "beneficiaire");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of(membre));

        assertThatThrownBy(() -> service.lierAssociationGoogle(
            "alice@example.com", "Dupont", "Alice", "PILOTE", null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("deja lie");
    }

    @Test
    void lierAssociationGoogle_lanceExceptionSiCodeAssoManquantSansInvitation() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setGoogleId("google-uid");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());

        assertThatThrownBy(() -> service.lierAssociationGoogle(
            "alice@example.com", "Dupont", "Alice", null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Code association requis");
    }

    @Test
    void lierAssociationGoogle_lanceExceptionSiCodeAssoInconnu() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setGoogleId("google-uid");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());
        when(associationRepository.findByCode("BADCODE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.lierAssociationGoogle(
            "alice@example.com", "Dupont", "Alice", "BADCODE", null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Code association inconnu");
    }

    @Test
    void lierAssociationGoogle_creerMembreViaCodeAsso() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setGoogleId("google-uid");
        Association asso = new Association("pilote", "Pilote");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());
        when(associationRepository.findByCode("PILOTE")).thenReturn(Optional.of(asso));

        Compte result = service.lierAssociationGoogle(
            "alice@example.com", "Dupont", "Alice", "PILOTE", null);

        assertThat(result).isSameAs(compte);
        verify(membreRepo).save(any());
        verify(personneProvisioningService).provisionner(
            eq(asso.getSlug()), eq("alice@example.com"), eq("Dupont"), eq("Alice"));
    }

    @Test
    void lierAssociationGoogle_creerMembreViaInvitation() {
        UUID tokenUUID = UUID.randomUUID();
        Compte inviteur = new Compte("boss@example.com", "hash", "Boss", "B");
        Association asso = new Association("pilote", "Pilote");
        Invitation invitation = new Invitation("alice@example.com", asso, "benevole", inviteur,
            Instant.now().plusSeconds(3600));
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setGoogleId("google-uid");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());
        when(invitationRepository.findByTokenWithDetails(tokenUUID)).thenReturn(Optional.of(invitation));

        Compte result = service.lierAssociationGoogle(
            "alice@example.com", "Dupont", "Alice", null, tokenUUID.toString());

        assertThat(result).isSameAs(compte);
        assertThat(invitation.getStatut()).isEqualTo("accepted");
        verify(membreRepo).save(any());
        verify(personneProvisioningService).provisionner(
            eq(asso.getSlug()), eq("alice@example.com"), eq("Dupont"), eq("Alice"));
    }

    @Test
    void lierAssociationGoogle_miseAJourNomPrenom() {
        Compte compte = new Compte("alice@example.com", "hash", "AncienNom", "AncienPrenom");
        compte.setGoogleId("google-uid");
        Association asso = new Association("pilote", "Pilote");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());
        when(associationRepository.findByCode("PILOTE")).thenReturn(Optional.of(asso));

        service.lierAssociationGoogle(
            "alice@example.com", "NouveauNom", "NouveauPrenom", "PILOTE", null);

        assertThat(compte.getNom()).isEqualTo("NouveauNom");
        assertThat(compte.getPrenom()).isEqualTo("NouveauPrenom");
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

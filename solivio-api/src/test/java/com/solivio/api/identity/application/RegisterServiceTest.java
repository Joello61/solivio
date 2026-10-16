package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegisterServiceTest {

    @Mock private CompteRepository compteRepository;
    @Mock private MembreAssociationRepository membreRepo;
    @Mock private InvitationRepository invitationRepository;
    @Mock private VerificationCodeService verificationCodeService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private PersonneProvisioningService personneProvisioningService;

    private RegisterService service;
    private final Compte inviteur = new Compte("resp@example.com", "hash", "Resp", "R");

    @BeforeEach
    void setUp() {
        service = new RegisterService(compteRepository, membreRepo, invitationRepository,
            verificationCodeService, passwordEncoder, emailService, personneProvisioningService);
    }

    @Test
    void inscrire_lanceExceptionSiEmailDejaPris() {
        when(compteRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.inscrire(
                "alice@example.com", "pass", "Dupont", "Alice", List.of("benevole"), false))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Un compte existe déjà");
        verify(membreRepo, never()).save(any());
    }

    @Test
    void inscrire_creeCompteMembreBeneficiaireEtPersonne() {
        Compte compte = new Compte("bob@example.com", "hashed", "Martin", "Bob");
        when(compteRepository.existsByEmail("bob@example.com")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("hashed");
        when(compteRepository.save(any())).thenReturn(compte);
        when(verificationCodeService.generer(any(), any())).thenReturn(codeVerification(compte));

        service.inscrire("bob@example.com", "pass", "Martin", "Bob", List.of("beneficiaire"), true);

        MembreAssociation membre = membreEnregistre();
        assertThat(membre.getRoles()).containsExactly("beneficiaire");
        assertThat(membre.getCompte()).isSameAs(compte);
        verify(personneProvisioningService).provisionner("bob@example.com", "Martin", "Bob");
        verify(emailService).envoyerVerificationEmail(compte, "123456");
    }

    @Test
    void inscrire_benevoleEtBeneficiaireALaFois() {
        Compte compte = new Compte("mixte@example.com", "hashed", "Martin", "Lea");
        when(compteRepository.save(any())).thenReturn(compte);
        when(verificationCodeService.generer(any(), any())).thenReturn(codeVerification(compte));

        service.inscrire("mixte@example.com", "pass", "Martin", "Lea", List.of("benevole", "beneficiaire"), true);

        assertThat(membreEnregistre().getRoles()).containsExactlyInAnyOrder("benevole", "beneficiaire");
    }

    @Test
    void inscrire_refuseBeneficiaireSansAttestationEtudiant() {
        assertThatThrownBy(() -> service.inscrire(
                "bob@example.com", "pass", "Martin", "Bob", List.of("beneficiaire"), false))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("étudiant inscrit");
        verify(compteRepository, never()).save(any());
    }

    @Test
    void inscrire_refuseSansRoleOuAvecUnRoleDeGestion() {
        assertThatThrownBy(() -> service.inscrire("bob@example.com", "pass", "M", "B", List.of(), false))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.inscrire("bob@example.com", "pass", "M", "B", List.of("coordinateur"), false))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.inscrire("bob@example.com", "pass", "M", "B", List.of("responsable"), false))
            .isInstanceOf(IllegalArgumentException.class);
        verify(compteRepository, never()).save(any());
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
    void verifierEmail_marqueEmailVerifieEtEnvoieBienvenue() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(verificationCodeService.valider(any(), any(), any())).thenReturn(true);

        service.verifierEmail("alice@example.com", "123456");

        assertThat(compte.isEmailVerifie()).isTrue();
        verify(emailService).envoyerBienvenue(compte);
    }

    @Test
    void renvoyerVerification_neRenvoiePasSiDejaVerifie() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setEmailVerifie(true);
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));

        service.renvoyerVerification("alice@example.com");

        verify(verificationCodeService, never()).generer(any(), any());
    }

    @Test
    void verifierEmail_adresseInconnue_memeErreurQuUnCodeInvalide() {
        when(compteRepository.findByEmail("inconnu@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifierEmail("inconnu@example.com", "123456"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Code de vérification invalide ou expiré");
    }

    @Test
    void renvoyerVerification_adresseInconnue_neFaitRienSansErreur() {
        when(compteRepository.findByEmail("inconnu@example.com")).thenReturn(Optional.empty());

        service.renvoyerVerification("inconnu@example.com");

        verify(verificationCodeService, never()).generer(any(), any());
        verify(emailService, never()).envoyerVerificationEmail(any(), any());
    }

    @Test
    void renvoyerVerification_envoieUnNouveauCodeSiNonVerifie() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(verificationCodeService.generer(compte, VerificationCode.TYPE_EMAIL))
            .thenReturn(codeVerification(compte));

        service.renvoyerVerification("alice@example.com");

        verify(emailService).envoyerVerificationEmail(compte, "123456");
    }

    @Test
    void inscrireViaInvitation_lanceExceptionSiTokenInvalide() {
        UUID token = UUID.randomUUID();
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.inscrireViaInvitation("guest@example.com", "pass", "Guest", "User", token))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invitation invalide");
    }

    @Test
    void inscrireViaInvitation_lanceExceptionSiEmailNeConcordePas() {
        UUID token = UUID.randomUUID();
        when(invitationRepository.findByTokenWithDetails(token))
            .thenReturn(Optional.of(invitation("invited@example.com", "benevole", null)));

        assertThatThrownBy(() -> service.inscrireViaInvitation("autre@example.com", "pass", "A", "B", token))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("ne correspond pas");
    }

    @Test
    void inscrireViaInvitation_attribueLeRoleDeLInvitationEtLAccepte() {
        UUID token = UUID.randomUUID();
        Invitation invitation = invitation("coord@example.com", "responsable", null);
        Compte compte = new Compte("coord@example.com", "hashed", "Coord", "C");
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.of(invitation));
        when(compteRepository.existsByEmail("coord@example.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(compteRepository.save(any())).thenReturn(compte);
        when(verificationCodeService.generer(any(), any())).thenReturn(codeVerification(compte));

        service.inscrireViaInvitation("coord@example.com", "pass", "Coord", "C", token);

        MembreAssociation membre = membreEnregistre();
        assertThat(membre.getRoles()).containsExactly("responsable");
        assertThat(membre.getInvitePar()).isSameAs(inviteur);
        assertThat(invitation.getStatut()).isEqualTo("accepted");
        verify(personneProvisioningService).provisionner("coord@example.com", "Coord", "C");
    }

    @Test
    void finaliserCompteGoogle_refuseUnCompteSansGoogle() {
        Compte compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));

        assertThatThrownBy(() -> service.finaliserCompteGoogle("alice@example.com", null, null, null, List.of("benevole"), false))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("pas un compte Google");
    }

    @Test
    void finaliserCompteGoogle_refuseUnCompteDejaMembre() {
        Compte compte = compteGoogle();
        when(compteRepository.findByEmail("g@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findByCompteId(compte.getId()))
            .thenReturn(Optional.of(new MembreAssociation(compte, "beneficiaire")));

        assertThatThrownBy(() -> service.finaliserCompteGoogle("g@example.com", null, null, null, List.of("benevole"), false))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("déjà membre");
    }

    @Test
    void finaliserCompteGoogle_creeLesRolesChoisisEtCorrigeLeNom() {
        Compte compte = compteGoogle();
        when(compteRepository.findByEmail("g@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findByCompteId(compte.getId())).thenReturn(Optional.empty());
        when(compteRepository.save(compte)).thenReturn(compte);

        service.finaliserCompteGoogle("g@example.com", "Nouveau", "Prenom", null, List.of("beneficiaire"), true);

        assertThat(membreEnregistre().getRoles()).containsExactly("beneficiaire");
        assertThat(compte.getNom()).isEqualTo("Nouveau");
        assertThat(compte.getPrenom()).isEqualTo("Prenom");
        verify(personneProvisioningService).provisionner("g@example.com", "Nouveau", "Prenom");
    }

    @Test
    void finaliserCompteGoogle_utiliseLeRoleDeLInvitation() {
        Compte compte = compteGoogle();
        UUID token = UUID.randomUUID();
        when(compteRepository.findByEmail("g@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findByCompteId(compte.getId())).thenReturn(Optional.empty());
        when(invitationRepository.findByTokenWithDetails(token))
            .thenReturn(Optional.of(invitation("g@example.com", "responsable", null)));
        when(compteRepository.save(compte)).thenReturn(compte);

        service.finaliserCompteGoogle("g@example.com", null, null, token.toString(), null, false);

        assertThat(membreEnregistre().getRoles()).containsExactly("responsable");
    }

    private MembreAssociation membreEnregistre() {
        ArgumentCaptor<MembreAssociation> captor = ArgumentCaptor.forClass(MembreAssociation.class);
        verify(membreRepo).save(captor.capture());
        return captor.getValue();
    }

    private Invitation invitation(String email, String role, String coordoType) {
        Invitation invitation = new Invitation(email, role, inviteur, Instant.now().plusSeconds(3600));
        invitation.setCoordoType(coordoType);
        return invitation;
    }

    private Compte compteGoogle() {
        Compte compte = new Compte("g@example.com", null, "Google", "User");
        compte.setId(UUID.randomUUID());
        compte.setGoogleId("google-123");
        return compte;
    }

    private VerificationCode codeVerification(Compte compte) {
        return new VerificationCode(compte, "123456", VerificationCode.TYPE_EMAIL, Instant.now().plusSeconds(900));
    }
}

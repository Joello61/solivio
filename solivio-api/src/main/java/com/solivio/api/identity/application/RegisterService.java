package com.solivio.api.identity.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Inscription de nouveaux comptes.
 * Deux chemins : beneficiaire autonome (code asso) ou utilisateur invite (token invitation).
 */
@Service
public class RegisterService {

    private final CompteRepository compteRepository;
    private final AssociationRepository associationRepository;
    private final MembreAssociationRepository membreRepo;
    private final InvitationRepository invitationRepository;
    private final VerificationCodeService verificationCodeService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PersonneProvisioningService personneProvisioningService;

    public RegisterService(
            CompteRepository compteRepository,
            AssociationRepository associationRepository,
            MembreAssociationRepository membreRepo,
            InvitationRepository invitationRepository,
            VerificationCodeService verificationCodeService,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            PersonneProvisioningService personneProvisioningService) {
        this.compteRepository = compteRepository;
        this.associationRepository = associationRepository;
        this.membreRepo = membreRepo;
        this.invitationRepository = invitationRepository;
        this.verificationCodeService = verificationCodeService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.personneProvisioningService = personneProvisioningService;
    }

    @Transactional
    public Compte inscrireBeneficiaire(String email, String motDePasse, String nom, String prenom,
                                       String codeAssociation) {
        if (compteRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un compte existe deja avec cet email");
        }

        Association association = associationRepository.findByCode(codeAssociation.toUpperCase())
            .orElseThrow(() -> new IllegalArgumentException("Code association inconnu : " + codeAssociation));

        Compte compte = new Compte(email, passwordEncoder.encode(motDePasse), nom, prenom);
        compteRepository.save(compte);

        MembreAssociation membre = new MembreAssociation(compte, association, "beneficiaire");
        membreRepo.save(membre);

        // Provision JIT : cree l'enregistrement Personne dans le schema tenant.
        personneProvisioningService.provisionner(association.getSlug(), email, nom, prenom);

        envoyerVerificationEmail(compte);
        return compte;
    }

    @Transactional
    public Compte inscrireViaInvitation(String email, String motDePasse, String nom, String prenom,
                                        UUID tokenInvitation) {
        Invitation invitation = invitationRepository.findByTokenWithDetails(tokenInvitation)
            .filter(Invitation::estValide)
            .orElseThrow(() -> new IllegalArgumentException("Invitation invalide ou expiree"));

        if (!invitation.getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("L'email ne correspond pas a l'invitation");
        }

        if (compteRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un compte existe deja avec cet email");
        }

        Compte compte = new Compte(email, passwordEncoder.encode(motDePasse), nom, prenom);
        compteRepository.save(compte);

        MembreAssociation membre = new MembreAssociation(compte, invitation.getAssociation(), invitation.getRole());
        membre.setCoordoType(invitation.getCoordoType());
        membre.setInvitePar(invitation.getInvitePar());
        membreRepo.save(membre);

        invitation.setStatut("accepted");
        invitationRepository.save(invitation);

        // Provision JIT : cree l'enregistrement Personne dans le schema tenant.
        personneProvisioningService.provisionner(
            invitation.getAssociation().getSlug(), email, nom, prenom
        );

        envoyerVerificationEmail(compte);
        return compte;
    }

    @Transactional
    public void verifierEmail(String email, String code) {
        Compte compte = compteRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));

        boolean valide = verificationCodeService.valider(
            compte, code, VerificationCode.TYPE_EMAIL);

        if (!valide) {
            throw new IllegalArgumentException("Code de verification invalide ou expire");
        }

        compte.setEmailVerifie(true);
        compteRepository.save(compte);
        emailService.envoyerBienvenue(compte);
    }

    @Transactional
    public void renvoyerVerification(String email) {
        Compte compte = compteRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));

        if (compte.isEmailVerifie()) {
            return;
        }

        envoyerVerificationEmail(compte);
    }

    /**
     * Lie un compte Google existant a une association.
     * Le compte doit avoir un google_id (cree via Google OAuth) et aucune affiliation.
     * L'utilisateur peut corriger son nom/prenom fournis par Google.
     */
    @Transactional
    public Compte lierAssociationGoogle(String email, String nom, String prenom,
                                        String codeAssociation, String tokenInvitationStr) {
        Compte compte = compteRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));

        if (compte.getGoogleId() == null) {
            throw new IllegalArgumentException("Ce compte n'est pas un compte Google");
        }

        List<MembreAssociation> existantes = membreRepo.findActivesByCompteId(compte.getId());
        if (!existantes.isEmpty()) {
            throw new IllegalArgumentException("Ce compte est deja lie a une association");
        }

        if (nom != null && !nom.isBlank()) {
            compte.setNom(nom);
        }
        if (prenom != null && !prenom.isBlank()) {
            compte.setPrenom(prenom);
        }

        if (tokenInvitationStr != null && !tokenInvitationStr.isBlank()) {
            UUID token = UUID.fromString(tokenInvitationStr);
            Invitation invitation = invitationRepository.findByTokenWithDetails(token)
                .filter(Invitation::estValide)
                .orElseThrow(() -> new IllegalArgumentException("Invitation invalide ou expiree"));

            if (!invitation.getEmail().equalsIgnoreCase(email)) {
                throw new IllegalArgumentException("L'email ne correspond pas a l'invitation");
            }

            MembreAssociation membre = new MembreAssociation(compte, invitation.getAssociation(), invitation.getRole());
            membre.setCoordoType(invitation.getCoordoType());
            membre.setInvitePar(invitation.getInvitePar());
            membreRepo.save(membre);

            invitation.setStatut("accepted");
            invitationRepository.save(invitation);

            personneProvisioningService.provisionner(
                invitation.getAssociation().getSlug(), email, compte.getNom(), compte.getPrenom());
        } else {
            if (codeAssociation == null || codeAssociation.isBlank()) {
                throw new IllegalArgumentException("Code association requis");
            }

            Association association = associationRepository.findByCode(codeAssociation.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Code association inconnu : " + codeAssociation));

            MembreAssociation membre = new MembreAssociation(compte, association, "beneficiaire");
            membreRepo.save(membre);

            personneProvisioningService.provisionner(
                association.getSlug(), email, compte.getNom(), compte.getPrenom());
        }

        compteRepository.save(compte);
        return compte;
    }

    private void envoyerVerificationEmail(Compte compte) {
        VerificationCode vc = verificationCodeService.generer(compte, VerificationCode.TYPE_EMAIL);
        emailService.envoyerVerificationEmail(compte, vc.getCode());
    }
}

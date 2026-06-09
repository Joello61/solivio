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

    private void envoyerVerificationEmail(Compte compte) {
        VerificationCode vc = verificationCodeService.generer(compte, VerificationCode.TYPE_EMAIL);
        emailService.envoyerVerificationEmail(compte, vc.getCode());
    }
}

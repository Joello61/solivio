package com.solivio.api.identity.application;

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
 * Deux chemins : beneficiaire autonome ou utilisateur invite (token invitation).
 */
@Service
public class RegisterService {

    private static final String ROLE_PAR_DEFAUT = "beneficiaire";

    private final CompteRepository compteRepository;
    private final MembreAssociationRepository membreRepo;
    private final InvitationRepository invitationRepository;
    private final VerificationCodeService verificationCodeService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PersonneProvisioningService personneProvisioningService;

    public RegisterService(
            CompteRepository compteRepository,
            MembreAssociationRepository membreRepo,
            InvitationRepository invitationRepository,
            VerificationCodeService verificationCodeService,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            PersonneProvisioningService personneProvisioningService) {
        this.compteRepository = compteRepository;
        this.membreRepo = membreRepo;
        this.invitationRepository = invitationRepository;
        this.verificationCodeService = verificationCodeService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.personneProvisioningService = personneProvisioningService;
    }

    /**
     * Inscription libre : le compte devient beneficiaire de l'association.
     * Les autres roles passent par une invitation.
     */
    @Transactional
    public Compte inscrireBeneficiaire(String email, String motDePasse, String nom, String prenom) {
        if (compteRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un compte existe deja avec cet email");
        }

        Compte compte = compteRepository.save(new Compte(email, passwordEncoder.encode(motDePasse), nom, prenom));
        membreRepo.save(new MembreAssociation(compte, ROLE_PAR_DEFAUT));
        personneProvisioningService.provisionner(email, nom, prenom);

        envoyerVerificationEmail(compte);
        return compte;
    }

    @Transactional
    public Compte inscrireViaInvitation(String email, String motDePasse, String nom, String prenom,
                                        UUID tokenInvitation) {
        Invitation invitation = invitationValide(tokenInvitation, email);
        if (compteRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un compte existe deja avec cet email");
        }

        Compte compte = compteRepository.save(new Compte(email, passwordEncoder.encode(motDePasse), nom, prenom));
        accepterInvitation(compte, invitation);
        personneProvisioningService.provisionner(email, nom, prenom);

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
     * Finalise un compte Google qui n'a pas encore de role : beneficiaire par
     * defaut, ou le role de l'invitation fournie. L'utilisateur peut corriger
     * le nom et le prenom transmis par Google.
     */
    @Transactional
    public Compte finaliserCompteGoogle(String email, String nom, String prenom, String tokenInvitationStr) {
        Compte compte = compteRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));

        if (compte.getGoogleId() == null) {
            throw new IllegalArgumentException("Ce compte n'est pas un compte Google");
        }
        if (membreRepo.findByCompteId(compte.getId()).isPresent()) {
            throw new IllegalArgumentException("Ce compte est deja membre de l'association");
        }

        if (nom != null && !nom.isBlank()) {
            compte.setNom(nom);
        }
        if (prenom != null && !prenom.isBlank()) {
            compte.setPrenom(prenom);
        }

        if (tokenInvitationStr != null && !tokenInvitationStr.isBlank()) {
            accepterInvitation(compte, invitationValide(UUID.fromString(tokenInvitationStr), email));
        } else {
            membreRepo.save(new MembreAssociation(compte, ROLE_PAR_DEFAUT));
        }
        personneProvisioningService.provisionner(email, compte.getNom(), compte.getPrenom());

        return compteRepository.save(compte);
    }

    private Invitation invitationValide(UUID token, String email) {
        Invitation invitation = invitationRepository.findByTokenWithDetails(token)
            .filter(Invitation::estValide)
            .orElseThrow(() -> new IllegalArgumentException("Invitation invalide ou expiree"));
        if (!invitation.getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("L'email ne correspond pas a l'invitation");
        }
        return invitation;
    }

    private void accepterInvitation(Compte compte, Invitation invitation) {
        MembreAssociation membre = new MembreAssociation(compte, invitation.getRole());
        membre.setCoordoType(invitation.getCoordoType());
        membre.setInvitePar(invitation.getInvitePar());
        membreRepo.save(membre);

        invitation.setStatut("accepted");
        invitationRepository.save(invitation);
    }

    private void envoyerVerificationEmail(Compte compte) {
        VerificationCode vc = verificationCodeService.generer(compte, VerificationCode.TYPE_EMAIL);
        emailService.envoyerVerificationEmail(compte, vc.getCode());
    }
}

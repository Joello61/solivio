package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.SolivioUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Gestion des invitations a rejoindre l'association.
 * Les admins et responsables peuvent inviter des membres via email.
 */
@Service
public class InvitationService {

    private static final int INVITATION_EXPIRATION_DAYS = 7;

    private final InvitationRepository invitationRepository;
    private final CompteRepository compteRepository;
    private final EmailService emailService;

    public InvitationService(
            InvitationRepository invitationRepository,
            CompteRepository compteRepository,
            EmailService emailService) {
        this.invitationRepository = invitationRepository;
        this.compteRepository = compteRepository;
        this.emailService = emailService;
    }

    @Transactional
    public Invitation inviter(SolivioUserDetails invitant, String email, String role, String coordoType) {
        return inviterParCompteId(invitant.getCompteId(), email, role, coordoType);
    }

    @Transactional
    public Invitation inviterParCompteId(UUID compteId, String email, String role, String coordoType) {
        if (invitationRepository.existsByEmailAndStatut(email, "pending")) {
            throw new IllegalArgumentException("Une invitation est déjà en attente pour cet email");
        }

        Compte inviteur = compteRepository.findById(compteId).orElseThrow();

        Invitation invitation = new Invitation(
            email, role, inviteur,
            Instant.now().plusSeconds(INVITATION_EXPIRATION_DAYS * 24L * 3600)
        );
        invitation.setCoordoType(coordoType);
        invitationRepository.save(invitation);

        emailService.envoyerInvitation(invitation);
        return invitation;
    }

    @Transactional(readOnly = true)
    public Invitation consulterInvitation(UUID token) {
        return invitationRepository.findByTokenWithDetails(token)
            .filter(Invitation::estValide)
            .orElseThrow(() -> new IllegalArgumentException("Invitation invalide ou expirée"));
    }
}

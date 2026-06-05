package com.solivio.api.identity.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Gestion des invitations a rejoindre une association.
 * Les admins et responsables peuvent inviter des membres via email.
 */
@Service
public class InvitationService {

    private static final int INVITATION_EXPIRATION_DAYS = 7;

    private final InvitationRepository invitationRepository;
    private final AssociationRepository associationRepository;
    private final CompteRepository compteRepository;
    private final EmailService emailService;

    public InvitationService(
            InvitationRepository invitationRepository,
            AssociationRepository associationRepository,
            CompteRepository compteRepository,
            EmailService emailService) {
        this.invitationRepository = invitationRepository;
        this.associationRepository = associationRepository;
        this.compteRepository = compteRepository;
        this.emailService = emailService;
    }

    @Transactional
    public Invitation inviter(SolivioUserDetails invitant, String email, String role,
                              String coordoType, String tenantSlug) {
        Association association = associationRepository.findBySlug(tenantSlug)
            .orElseThrow(() -> new IllegalArgumentException("Association inconnue"));

        if (invitationRepository.existsByEmailAndAssociationIdAndStatut(email, association.getId(), "pending")) {
            throw new IllegalArgumentException("Une invitation est deja en attente pour cet email");
        }

        Compte inviteur = compteRepository.findById(invitant.getCompteId()).orElseThrow();

        Invitation invitation = new Invitation(
            email, association, role, inviteur,
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
            .orElseThrow(() -> new IllegalArgumentException("Invitation invalide ou expiree"));
    }
}

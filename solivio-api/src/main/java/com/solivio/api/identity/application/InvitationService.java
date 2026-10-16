package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.domain.RolesMembre;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.shared.exception.ConflictException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Invitations a rejoindre l'association comme responsable (ADR-012). Les autres
 * roles se choisissent a l'inscription ou s'attribuent depuis la gestion des membres.
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
    public Invitation inviterResponsable(SolivioUserDetails invitant, String email) {
        if (compteRepository.existsByEmail(email)) {
            throw new ConflictException(
                "Cette personne a déjà un compte : nommez-la responsable depuis la liste des membres.");
        }
        if (invitationRepository.existsByEmailAndStatut(email, "pending")) {
            throw new IllegalArgumentException("Une invitation est déjà en attente pour cet email");
        }

        Compte inviteur = compteRepository.findById(invitant.getCompteId()).orElseThrow();

        Invitation invitation = new Invitation(
            email, RolesMembre.RESPONSABLE, inviteur,
            Instant.now().plusSeconds(INVITATION_EXPIRATION_DAYS * 24L * 3600)
        );
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

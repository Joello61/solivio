package com.solivio.api.identity.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.events.PersonneEffacee;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.persistence.ProfilBeneficiaireRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

/**
 * Droit a l'effacement (RGPD, modele de donnees section 334) : compte, profil
 * beneficiaire, jetons, invitations et avatar sont supprimes ; la personne et les
 * copies de son nom dans les autres modules sont anonymisees de facon irreversible,
 * pour garder l'historique et les compteurs sans donnee personnelle.
 * Distinct de la suppression d'un compte (section 114), ou la personne survit.
 */
@Service
@Transactional
public class EffacementService {

    private final CompteRepository compteRepository;
    private final PersonneRepository personneRepository;
    private final ProfilBeneficiaireRepository profilRepository;
    private final InvitationRepository invitationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AvatarService avatarService;
    private final GardeMembres garde;
    private final ApplicationEventPublisher events;
    private final Clock clock;
    private final AuditService auditService;

    public EffacementService(
        CompteRepository compteRepository,
        PersonneRepository personneRepository,
        ProfilBeneficiaireRepository profilRepository,
        InvitationRepository invitationRepository,
        RefreshTokenRepository refreshTokenRepository,
        AvatarService avatarService,
        GardeMembres garde,
        ApplicationEventPublisher events,
        Clock clock,
        AuditService auditService
    ) {
        this.compteRepository = compteRepository;
        this.personneRepository = personneRepository;
        this.profilRepository = profilRepository;
        this.invitationRepository = invitationRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.avatarService = avatarService;
        this.garde = garde;
        this.events = events;
        this.clock = clock;
        this.auditService = auditService;
    }

    public void effacer(UUID compteId) {
        Compte compte = compteRepository.findById(compteId)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + compteId));
        garde.garderUnResponsable(compteId);
        garde.garderUnSuperAdmin(compte);

        personneRepository.findByCompteEmail(compte.getEmail()).ifPresent(personne -> {
            profilRepository.findByPersonneId(personne.getId()).ifPresent(profilRepository::delete);
            personne.anonymiser(Instant.now(clock));
            personneRepository.saveAndFlush(personne);
            events.publishEvent(new PersonneEffacee(personne.getId()));
        });

        invitationRepository.deleteByEmail(compte.getEmail());
        refreshTokenRepository.revoquerTousParCompte(compteId);
        compteRepository.delete(compte);
        avatarService.supprimerAvatar(compteId);
        auditService.tracer("DONNEES_EFFACEES", "compte", compteId);
    }
}

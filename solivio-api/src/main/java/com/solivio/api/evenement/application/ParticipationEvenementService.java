package com.solivio.api.evenement.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.evenement.domain.Evenement;
import com.solivio.api.evenement.domain.ModeInscription;
import com.solivio.api.evenement.domain.ParticipationEvenement;
import com.solivio.api.evenement.domain.PresenceEvenement;
import com.solivio.api.evenement.domain.PublicCible;
import com.solivio.api.evenement.domain.RoleParticipation;
import com.solivio.api.evenement.domain.StatutEvenement;
import com.solivio.api.evenement.infrastructure.persistence.EvenementRepository;
import com.solivio.api.evenement.infrastructure.persistence.ParticipationEvenementRepository;
import com.solivio.api.evenement.infrastructure.web.dto.ParticipationEvenementResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneInfo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ParticipationEvenementService {

    private final EvenementRepository evenementRepository;
    private final ParticipationEvenementRepository participationRepository;
    private final PersonneQueryPort personneQueryPort;
    private final AuditService auditService;

    public ParticipationEvenementService(
        EvenementRepository evenementRepository,
        ParticipationEvenementRepository participationRepository,
        PersonneQueryPort personneQueryPort,
        AuditService auditService
    ) {
        this.evenementRepository = evenementRepository;
        this.participationRepository = participationRepository;
        this.personneQueryPort = personneQueryPort;
        this.auditService = auditService;
    }

    /**
     * Inscrit une personne a un evenement en tant que STAFF ou PARTICIPANT.
     * Les regles d'acces sont verifiees ici : aBesoiNStaff, publicParticipants, capacite.
     * userRoles contient les roles de l'utilisateur (benevole, beneficiaire...) en minuscules.
     */
    public ParticipationEvenementResponse inscrire(
        UUID evenementId, String emailUser, RoleParticipation role, List<String> userRoles
    ) {
        Evenement evenement = trouverOuEchouer(evenementId);
        if (evenement.getStatut() != StatutEvenement.PUBLIE
            && evenement.getStatut() != StatutEvenement.EN_COURS) {
            throw new ConflictException("Inscription impossible : l'événement n'est pas ouvert");
        }
        if (evenement.getModeInscription() == ModeInscription.SANS_INSCRIPTION) {
            throw new ConflictException("Inscription impossible : cet événement se fait sans inscription");
        }

        PersonneInfo personne = personneQueryPort.trouverPersonne(emailUser);

        if (participationRepository.existsByEvenementIdAndPersonneIdAndRole(
                evenementId, personne.id(), role)) {
            throw new ConflictException("Vous êtes déjà inscrit avec ce rôle");
        }

        verifierDroitInscription(evenement, role, userRoles);
        verifierCapacite(evenement, role);

        ParticipationEvenement participation =
            new ParticipationEvenement(evenementId, personne.id(), role);
        participationRepository.save(participation);
        auditService.tracer("EVENEMENT_INSCRIPTION", "evenement", evenementId);
        return toResponse(participation, evenement, personne.nom() + " " + personne.prenom());
    }

    public void seDesinscrire(UUID evenementId, String emailUser) {
        PersonneInfo personne = personneQueryPort.trouverPersonne(emailUser);
        List<ParticipationEvenement> participations =
            participationRepository.findByEvenementIdOrderByDateInscriptionAsc(evenementId);
        List<ParticipationEvenement> lesMinnes = participations.stream()
            .filter(p -> p.getPersonneId().equals(personne.id()))
            .toList();
        if (lesMinnes.isEmpty()) {
            throw new NotFoundException("Vous n'êtes pas inscrit à cet événement");
        }
        auditService.tracer("EVENEMENT_DESINSCRIPTION", "evenement", evenementId);
        participationRepository.deleteAll(lesMinnes);
    }

    @Transactional(readOnly = true)
    public List<ParticipationEvenementResponse> listerParticipants(UUID evenementId) {
        Evenement evenement = trouverOuEchouer(evenementId);
        return participationRepository.findByEvenementIdOrderByDateInscriptionAsc(evenementId)
            .stream()
            .map(p -> {
                try {
                    PersonneContactInfo info = personneQueryPort.trouverPersonneParId(p.getPersonneId());
                    return toResponse(p, evenement, info.nom() + " " + info.prenom());
                } catch (NotFoundException e) {
                    return toResponse(p, evenement, null);
                }
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ParticipationEvenementResponse> listerPourPointage(UUID evenementId, String terme) {
        Evenement evenement = trouverOuEchouer(evenementId);
        if (evenement.getModeInscription() != ModeInscription.OBLIGATOIRE) {
            throw new ConflictException("Le pointage n'est disponible que pour le mode OBLIGATOIRE");
        }
        List<ParticipationEvenement> participations =
            participationRepository.findByEvenementIdOrderByDateInscriptionAsc(evenementId);
        return participations.stream()
            .filter(p -> terme == null || terme.isBlank() || correspondAuTerme(p.getPersonneId(), terme))
            .map(p -> {
                try {
                    PersonneContactInfo info = personneQueryPort.trouverPersonneParId(p.getPersonneId());
                    return toResponse(p, evenement, info.nom() + " " + info.prenom());
                } catch (NotFoundException e) {
                    return toResponse(p, evenement, null);
                }
            })
            .toList();
    }

    public ParticipationEvenementResponse pointer(
        UUID evenementId, UUID participationId, String presenceStr
    ) {
        Evenement evenement = trouverOuEchouer(evenementId);
        if (evenement.getModeInscription() != ModeInscription.OBLIGATOIRE) {
            throw new ConflictException("Le pointage n'est disponible que pour le mode OBLIGATOIRE");
        }
        ParticipationEvenement participation = participationRepository.findById(participationId)
            .filter(p -> p.getEvenementId().equals(evenementId))
            .orElseThrow(() -> new NotFoundException("Participation introuvable"));
        participation.setPresence(PresenceEvenement.valueOf(presenceStr.toUpperCase()));
        participationRepository.save(participation);
        auditService.tracer("EVENEMENT_POINTAGE", "participation_evenement", participationId);
        try {
            PersonneContactInfo info = personneQueryPort.trouverPersonneParId(participation.getPersonneId());
            return toResponse(participation, evenement, info.nom() + " " + info.prenom());
        } catch (NotFoundException e) {
            return toResponse(participation, evenement, null);
        }
    }

    @Transactional(readOnly = true)
    public List<ParticipationEvenementResponse> mesEvenementsParticipations(String emailUser) {
        PersonneInfo personne = personneQueryPort.trouverPersonne(emailUser);
        return participationRepository.findByPersonneIdOrderByDateInscriptionDesc(personne.id())
            .stream()
            .map(p -> {
                Evenement e = evenementRepository.findById(p.getEvenementId()).orElse(null);
                return toResponse(p, e, personne.nom() + " " + personne.prenom());
            })
            .toList();
    }

    private void verifierDroitInscription(
        Evenement evenement, RoleParticipation role, List<String> userRoles
    ) {
        if (role == RoleParticipation.STAFF) {
            if (!evenement.isABesoiNStaff()) {
                throw new ConflictException("Cet événement ne recherche pas de staff bénévole");
            }
            if (!userRoles.contains("benevole")) {
                throw new ConflictException("Seuls les bénévoles peuvent s'inscrire comme staff");
            }
            return;
        }
        // role == PARTICIPANT
        if (!evenement.isOuvertParticipants() || evenement.getPublicParticipants() == null) {
            throw new ConflictException("Cet événement n'est pas ouvert aux participants");
        }
        PublicCible cible = evenement.getPublicParticipants();
        boolean autorise = switch (cible) {
            case BENEVOLES     -> userRoles.contains("benevole");
            case BENEFICIAIRES -> userRoles.contains("beneficiaire");
            case TOUS          -> true;
        };
        if (!autorise) {
            throw new ConflictException("Votre profil ne correspond pas au public cible de cet événement");
        }
    }

    private void verifierCapacite(Evenement evenement, RoleParticipation role) {
        if (role == RoleParticipation.STAFF && evenement.getCapaciteStaff() != null) {
            long actuel = participationRepository.countByEvenementIdAndRole(evenement.getId(), role);
            if (actuel >= evenement.getCapaciteStaff()) {
                throw new ConflictException("La capacité staff de cet événement est atteinte");
            }
        } else if (role == RoleParticipation.PARTICIPANT && evenement.getCapaciteParticipants() != null) {
            long actuel = participationRepository.countByEvenementIdAndRole(evenement.getId(), role);
            if (actuel >= evenement.getCapaciteParticipants()) {
                throw new ConflictException("La capacité participants de cet événement est atteinte");
            }
        }
    }

    private boolean correspondAuTerme(UUID personneId, String terme) {
        try {
            PersonneContactInfo info = personneQueryPort.trouverPersonneParId(personneId);
            String fullName = (info.nom() + " " + info.prenom()).toLowerCase();
            return fullName.contains(terme.toLowerCase());
        } catch (NotFoundException e) {
            return false;
        }
    }

    private Evenement trouverOuEchouer(UUID evenementId) {
        return evenementRepository.findById(evenementId)
            .orElseThrow(() -> new NotFoundException("Événement introuvable : " + evenementId));
    }

    static ParticipationEvenementResponse toResponse(ParticipationEvenement p, Evenement e, String nomComplet) {
        return new ParticipationEvenementResponse(
            p.getId(),
            p.getEvenementId(),
            e != null ? e.getTitre() : null,
            e != null ? e.getDateHeureDebut() : null,
            e != null ? e.getLieuAdresseFormatee() : null,
            p.getPersonneId(),
            nomComplet,
            p.getRole().name(),
            p.getPresence().name(),
            p.getDateInscription()
        );
    }
}

package com.solivio.api.evenement.application;

import com.solivio.api.evenement.domain.Evenement;
import com.solivio.api.evenement.domain.ModeInscription;
import com.solivio.api.evenement.domain.PublicCible;
import com.solivio.api.evenement.domain.StatutEvenement;
import com.solivio.api.evenement.domain.TypeEvenement;
import com.solivio.api.evenement.infrastructure.kafka.EvenementEventPublisher;
import com.solivio.api.evenement.infrastructure.persistence.EvenementRepository;
import com.solivio.api.evenement.infrastructure.persistence.ParticipationEvenementRepository;
import com.solivio.api.evenement.infrastructure.web.dto.AnnulerEvenementRequest;
import com.solivio.api.evenement.infrastructure.web.dto.CreateEvenementRequest;
import com.solivio.api.evenement.infrastructure.web.dto.EvenementResponse;
import com.solivio.api.evenement.infrastructure.web.dto.UpdateEvenementRequest;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneInfo;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class EvenementService {

    private final EvenementRepository evenementRepository;
    private final ParticipationEvenementRepository participationRepository;
    private final EvenementEventPublisher eventPublisher;
    private final PersonneQueryPort personneQueryPort;

    public EvenementService(
        EvenementRepository evenementRepository,
        ParticipationEvenementRepository participationRepository,
        EvenementEventPublisher eventPublisher,
        PersonneQueryPort personneQueryPort
    ) {
        this.evenementRepository = evenementRepository;
        this.participationRepository = participationRepository;
        this.eventPublisher = eventPublisher;
        this.personneQueryPort = personneQueryPort;
    }

    public EvenementResponse creer(CreateEvenementRequest request, String emailCreateur) {
        if (!request.dateHeureFin().isAfter(request.dateHeureDebut())) {
            throw new IllegalArgumentException("date_heure_fin doit etre apres date_heure_debut");
        }
        PersonneInfo createur = personneQueryPort.trouverPersonne(emailCreateur);
        Evenement evenement = new Evenement(
            Jsoup.clean(request.titre(), Safelist.none()),
            request.description() != null ? Jsoup.clean(request.description(), Safelist.none()) : null,
            parseType(request.type()),
            request.lieuPlaceId(),
            request.lieuAdresseFormatee(),
            request.lieuLatitude(),
            request.lieuLongitude(),
            request.dateHeureDebut(),
            request.dateHeureFin(),
            request.aBesoiNStaff() != null ? request.aBesoiNStaff() : true,
            request.ouvertParticipants() != null ? request.ouvertParticipants() : false,
            parsePublicCible(request.publicParticipants()),
            parseModeInscription(request.modeInscription()),
            request.capaciteStaff(),
            request.capaciteParticipants(),
            createur.id()
        );
        evenementRepository.save(evenement);
        return toResponse(evenement);
    }

    public EvenementResponse modifier(UUID evenementId, UpdateEvenementRequest request) {
        Evenement evenement = trouverOuEchouer(evenementId);
        if (evenement.getStatut() != StatutEvenement.BROUILLON) {
            throw new com.solivio.api.shared.exception.ConflictException(
                "Modification impossible : seul un evenement en BROUILLON peut etre modifie");
        }
        if (request.titre() != null) {
            evenement.setTitre(Jsoup.clean(request.titre(), Safelist.none()));
        }
        if (request.description() != null) {
            evenement.setDescription(Jsoup.clean(request.description(), Safelist.none()));
        }
        if (request.type() != null) {
            evenement.setType(parseType(request.type()));
        }
        if (request.lieuPlaceId() != null) {
            evenement.setLieuPlaceId(request.lieuPlaceId());
        }
        if (request.lieuAdresseFormatee() != null) {
            evenement.setLieuAdresseFormatee(request.lieuAdresseFormatee());
        }
        if (request.lieuLatitude() != null) {
            evenement.setLieuLatitude(request.lieuLatitude());
        }
        if (request.lieuLongitude() != null) {
            evenement.setLieuLongitude(request.lieuLongitude());
        }
        if (request.dateHeureDebut() != null) {
            evenement.setDateHeureDebut(request.dateHeureDebut());
        }
        if (request.dateHeureFin() != null) {
            evenement.setDateHeureFin(request.dateHeureFin());
        }
        if (request.aBesoiNStaff() != null) {
            evenement.setABesoiNStaff(request.aBesoiNStaff());
        }
        if (request.ouvertParticipants() != null) {
            evenement.setOuvertParticipants(request.ouvertParticipants());
        }
        if (request.publicParticipants() != null) {
            evenement.setPublicParticipants(parsePublicCible(request.publicParticipants()));
        }
        if (request.modeInscription() != null) {
            evenement.setModeInscription(parseModeInscription(request.modeInscription()));
        }
        if (request.capaciteStaff() != null) {
            evenement.setCapaciteStaff(request.capaciteStaff());
        }
        if (request.capaciteParticipants() != null) {
            evenement.setCapaciteParticipants(request.capaciteParticipants());
        }

        ZonedDateTime debut = evenement.getDateHeureDebut();
        ZonedDateTime fin = evenement.getDateHeureFin();
        if (debut != null && fin != null && !fin.isAfter(debut)) {
            throw new IllegalArgumentException("date_heure_fin doit etre apres date_heure_debut");
        }
        return toResponse(evenementRepository.save(evenement));
    }

    public EvenementResponse publier(UUID evenementId) {
        Evenement evenement = trouverOuEchouer(evenementId);
        evenement.transitionnerVers(StatutEvenement.PUBLIE, null);
        evenementRepository.save(evenement);
        eventPublisher.publierPublie(evenementId, evenement.getDateHeureDebut());
        return toResponse(evenement);
    }

    public EvenementResponse annuler(UUID evenementId, AnnulerEvenementRequest request) {
        Evenement evenement = trouverOuEchouer(evenementId);
        String raisonSaine = request.raison() != null ? Jsoup.clean(request.raison(), Safelist.none()) : null;
        evenement.transitionnerVers(StatutEvenement.ANNULE, raisonSaine);
        evenementRepository.save(evenement);
        eventPublisher.publierAnnule(evenementId, evenement.getDateHeureDebut());
        return toResponse(evenement);
    }

    @Transactional(readOnly = true)
    public List<EvenementResponse> lister(String statut, String type) {
        StatutEvenement statutEnum = statut != null ? StatutEvenement.valueOf(statut.toUpperCase()) : null;
        TypeEvenement typeEnum = type != null ? TypeEvenement.valueOf(type.toUpperCase()) : null;

        List<Evenement> evenements;
        if (statutEnum != null && typeEnum != null) {
            evenements = evenementRepository.findByStatutAndTypeOrderByDateHeureDebutAsc(statutEnum, typeEnum);
        } else if (statutEnum != null) {
            evenements = evenementRepository.findByStatutOrderByDateHeureDebutAsc(statutEnum);
        } else if (typeEnum != null) {
            evenements = evenementRepository.findByTypeOrderByDateHeureDebutAsc(typeEnum);
        } else {
            evenements = evenementRepository.findAllByOrderByDateHeureDebutAsc();
        }
        return evenements.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EvenementResponse detail(UUID evenementId) {
        return toResponse(trouverOuEchouer(evenementId));
    }

    Evenement trouverOuEchouer(UUID evenementId) {
        return evenementRepository.findById(evenementId)
            .orElseThrow(() -> new NotFoundException("Evenement introuvable : " + evenementId));
    }

    EvenementResponse toResponse(Evenement e) {
        long nbStaff = participationRepository.countByEvenementIdAndRole(
            e.getId(), com.solivio.api.evenement.domain.RoleParticipation.STAFF);
        long nbParticipants = participationRepository.countByEvenementIdAndRole(
            e.getId(), com.solivio.api.evenement.domain.RoleParticipation.PARTICIPANT);
        return new EvenementResponse(
            e.getId(),
            e.getTitre(),
            e.getDescription(),
            e.getType().name(),
            e.getLieuPlaceId(),
            e.getLieuAdresseFormatee(),
            e.getLieuLatitude(),
            e.getLieuLongitude(),
            e.getDateHeureDebut(),
            e.getDateHeureFin(),
            e.isABesoiNStaff(),
            e.isOuvertParticipants(),
            e.getPublicParticipants() != null ? e.getPublicParticipants().name() : null,
            e.getModeInscription().name(),
            e.getCapaciteStaff(),
            e.getCapaciteParticipants(),
            e.getStatut().name(),
            e.getRaisonAnnulation(),
            (int) nbStaff,
            (int) nbParticipants,
            e.getDateCreation()
        );
    }

    private static TypeEvenement parseType(String type) {
        if (type == null) {
            return TypeEvenement.AUTRE;
        }

        try {
            return TypeEvenement.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TypeEvenement.AUTRE;
        }
    }

    private static PublicCible parsePublicCible(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return PublicCible.valueOf(value.toUpperCase());
    }

    private static ModeInscription parseModeInscription(String value) {
        if (value == null || value.isBlank()) {
            return ModeInscription.OBLIGATOIRE;
        }
        return ModeInscription.valueOf(value.toUpperCase());
    }
}

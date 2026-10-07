package com.solivio.api.collecte.application;

import com.solivio.api.collecte.domain.MissionCollecte;
import com.solivio.api.collecte.domain.StatutMission;
import com.solivio.api.collecte.infrastructure.evenements.CollecteEventPublisher;
import com.solivio.api.collecte.infrastructure.persistence.MissionCollecteRepository;
import com.solivio.api.collecte.infrastructure.web.dto.AnnulerMissionRequest;
import com.solivio.api.collecte.infrastructure.web.dto.CreateMissionCollecteRequest;
import com.solivio.api.collecte.infrastructure.web.dto.LieuMissionRequest;
import com.solivio.api.collecte.infrastructure.web.dto.LieuMissionResponse;
import com.solivio.api.collecte.infrastructure.web.dto.MissionCollecteResponse;
import com.solivio.api.collecte.infrastructure.web.dto.UpdateMissionCollecteRequest;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneInfo;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static java.util.Arrays.asList;

@Service
@Transactional
public class MissionCollecteService {

    private static final List<StatutMission> STATUTS_ACTIFS =
        asList(StatutMission.PRISE_EN_CHARGE, StatutMission.COLLECTE_EFFECTUEE);

    private final MissionCollecteRepository missionRepository;
    private final CollecteEventPublisher eventPublisher;
    private final PersonneQueryPort personneQueryPort;

    public MissionCollecteService(
        MissionCollecteRepository missionRepository,
        CollecteEventPublisher eventPublisher,
        PersonneQueryPort personneQueryPort
    ) {
        this.missionRepository = missionRepository;
        this.eventPublisher = eventPublisher;
        this.personneQueryPort = personneQueryPort;
    }

    public MissionCollecteResponse creer(CreateMissionCollecteRequest request,
                                         String emailCreateur) {
        PersonneInfo createur = personneQueryPort.trouverPersonne(emailCreateur);
        int capacite = request.capacitePersonnes() != null ? request.capacitePersonnes() : 6;
        MissionCollecte mission = new MissionCollecte(
            Jsoup.clean(request.titre(), Safelist.none()),
            request.description() != null ? Jsoup.clean(request.description(), Safelist.none()) : null,
            placeId(request.lieuCollecte()),
            adresse(request.lieuCollecte()),
            latitude(request.lieuCollecte()),
            longitude(request.lieuCollecte()),
            placeId(request.lieuDepot()),
            adresse(request.lieuDepot()),
            latitude(request.lieuDepot()),
            longitude(request.lieuDepot()),
            request.dateHeure(),
            capacite,
            createur.id()
        );
        missionRepository.save(mission);
        eventPublisher.publierCreee(mission.getId(), mission.getDateHeure());
        return toResponse(mission, null);
    }

    public MissionCollecteResponse modifier(UUID missionId, UpdateMissionCollecteRequest request) {
        MissionCollecte mission = trouverOuEchouer(missionId);
        if (mission.getStatut() != StatutMission.DISPONIBLE) {
            throw new ConflictException("Modification impossible : la mission n'est pas disponible");
        }
        if (request.titre() != null) {
            mission.setTitre(Jsoup.clean(request.titre(), Safelist.none()));
        }
        if (request.description() != null) {
            mission.setDescription(Jsoup.clean(request.description(), Safelist.none()));
        }
        if (request.dateHeure() != null) {
            mission.setDateHeure(request.dateHeure());
        }
        if (request.capacitePersonnes() != null) {
            mission.setCapacitePersonnes(request.capacitePersonnes());
        }
        if (request.lieuCollecte() != null) {
            mission.setLieuCollectePlaceId(placeId(request.lieuCollecte()));
            mission.setLieuCollecteAdresse(adresse(request.lieuCollecte()));
            mission.setLieuCollecteLatitude(latitude(request.lieuCollecte()));
            mission.setLieuCollecteLongitude(longitude(request.lieuCollecte()));
        }
        if (request.lieuDepot() != null) {
            mission.setLieuDepotPlaceId(placeId(request.lieuDepot()));
            mission.setLieuDepotAdresse(adresse(request.lieuDepot()));
            mission.setLieuDepotLatitude(latitude(request.lieuDepot()));
            mission.setLieuDepotLongitude(longitude(request.lieuDepot()));
        }
        return toResponse(missionRepository.save(mission), null);
    }

    public MissionCollecteResponse annuler(UUID missionId, AnnulerMissionRequest request,
                                           String emailPar) {
        PersonneInfo par = personneQueryPort.trouverPersonne(emailPar);
        MissionCollecte mission = trouverOuEchouer(missionId);
        UUID benevoleAssigneId = mission.getBenevoleId();
        String raisonSaine = request.raison() != null ? Jsoup.clean(request.raison(), Safelist.none()) : null;
        mission.annuler(par.id(), raisonSaine);
        missionRepository.save(mission);
        eventPublisher.publierAnnulee(mission.getId(), mission.getDateHeure(), benevoleAssigneId);
        return toResponse(mission, null);
    }

    public MissionCollecteResponse prendre(UUID missionId, String emailBenevole) {
        MissionCollecte mission = trouverOuEchouer(missionId);
        if (mission.getStatut() != StatutMission.DISPONIBLE) {
            throw new ConflictException("Cette mission n'est plus disponible");
        }
        PersonneInfo benevole = personneQueryPort.trouverPersonne(emailBenevole);
        long actives = missionRepository.countByBenevoleIdAndStatutIn(benevole.id(), STATUTS_ACTIFS);
        if (actives > 0) {
            throw new ConflictException("Vous avez deja une mission en cours");
        }
        mission.prendreEnCharge(benevole.id());
        missionRepository.save(mission);
        PersonneContactInfo info = personneQueryPort.trouverPersonneParId(benevole.id());
        return toResponse(mission, info.nom() + " " + info.prenom());
    }

    public MissionCollecteResponse liberer(UUID missionId, String emailBenevole) {
        MissionCollecte mission = trouverOuEchouer(missionId);
        if (mission.getStatut() != StatutMission.PRISE_EN_CHARGE) {
            throw new ConflictException("Liberation impossible : la mission n'est pas en cours de prise en charge");
        }
        PersonneInfo benevole = personneQueryPort.trouverPersonne(emailBenevole);
        if (!benevole.id().equals(mission.getBenevoleId())) {
            throw new ConflictException("Vous n'etes pas le benevole assigne a cette mission");
        }
        mission.liberer();
        missionRepository.save(mission);
        return toResponse(mission, null);
    }

    public MissionCollecteResponse validerCollecte(UUID missionId) {
        MissionCollecte mission = trouverOuEchouer(missionId);
        mission.validerCollecte();
        missionRepository.save(mission);
        String benevoleNom = resolveBenevoleNom(mission.getBenevoleId());
        return toResponse(mission, benevoleNom);
    }

    public MissionCollecteResponse validerDepot(UUID missionId, String emailBenevole) {
        MissionCollecte mission = trouverOuEchouer(missionId);
        PersonneInfo benevole = personneQueryPort.trouverPersonne(emailBenevole);
        mission.validerDepot(benevole.id());
        missionRepository.save(mission);
        PersonneContactInfo info = personneQueryPort.trouverPersonneParId(benevole.id());
        return toResponse(mission, info.nom() + " " + info.prenom());
    }

    @Transactional(readOnly = true)
    public List<MissionCollecteResponse> lister(StatutMission statut) {
        List<MissionCollecte> missions = statut != null
            ? missionRepository.findByStatutOrderByDateHeureAsc(statut)
            : missionRepository.findAllByOrderByDateHeureAsc();
        return missions.stream()
            .map(m -> toResponse(m, resolveBenevoleNom(m.getBenevoleId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public MissionCollecteResponse detail(UUID missionId) {
        MissionCollecte mission = trouverOuEchouer(missionId);
        return toResponse(mission, resolveBenevoleNom(mission.getBenevoleId()));
    }

    @Transactional(readOnly = true)
    public List<MissionCollecteResponse> mesMissions(String emailBenevole) {
        PersonneInfo benevole = personneQueryPort.trouverPersonne(emailBenevole);
        PersonneContactInfo info = personneQueryPort.trouverPersonneParId(benevole.id());
        String nom = info.nom() + " " + info.prenom();
        return missionRepository.findByBenevoleIdOrderByDateHeureAsc(benevole.id()).stream()
            .map(m -> toResponse(m, nom))
            .toList();
    }

    MissionCollecte trouverOuEchouer(UUID missionId) {
        return missionRepository.findById(missionId)
            .orElseThrow(() -> new NotFoundException("Mission de collecte introuvable : " + missionId));
    }

    private String resolveBenevoleNom(UUID benevoleId) {
        if (benevoleId == null) {
            return null;
        }
        try {
            PersonneContactInfo info = personneQueryPort.trouverPersonneParId(benevoleId);
            return info.nom() + " " + info.prenom();
        } catch (NotFoundException e) {
            return null;
        }
    }

    static MissionCollecteResponse toResponse(MissionCollecte m, String benevoleNomComplet) {
        return new MissionCollecteResponse(
            m.getId(),
            m.getTitre(),
            m.getDescription(),
            toLieuResponse(m.getLieuCollectePlaceId(), m.getLieuCollecteAdresse(),
                m.getLieuCollecteLatitude(), m.getLieuCollecteLongitude()),
            toLieuResponse(m.getLieuDepotPlaceId(), m.getLieuDepotAdresse(),
                m.getLieuDepotLatitude(), m.getLieuDepotLongitude()),
            m.getDateHeure(),
            m.getCapacitePersonnes(),
            m.getStatut().name(),
            m.getBenevoleId(),
            benevoleNomComplet,
            m.getDatePriseEnCharge(),
            m.getDateCollecteEffectuee(),
            m.getDateDepotValide(),
            m.getRaisonAnnulation(),
            m.getDateCreation()
        );
    }

    private static LieuMissionResponse toLieuResponse(
        String placeId, String adresse, Double latitude, Double longitude
    ) {
        if (placeId == null && adresse == null && latitude == null && longitude == null) {
            return null;
        }
        return new LieuMissionResponse(placeId, adresse, latitude, longitude);
    }

    private static String placeId(LieuMissionRequest r) {
        return r != null ? r.placeId() : null;
    }

    private static String adresse(LieuMissionRequest r) {
        return r != null ? r.adresseFormatee() : null;
    }

    private static Double latitude(LieuMissionRequest r) {
        return r != null ? r.latitude() : null;
    }

    private static Double longitude(LieuMissionRequest r) {
        return r != null ? r.longitude() : null;
    }
}

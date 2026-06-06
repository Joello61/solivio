package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.StatutPresence;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.kafka.InscriptionEventPublisher;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.web.dto.InscriptionResponse;
import com.solivio.api.inscription.infrastructure.web.dto.PointageInfoResponse;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class InscriptionService {

    // RG1 : un beneficiaire ne peut pas s'inscrire plus d'une fois par semaine (7 jours).
    private static final int FREQUENCE_MAX_JOURS = 7;

    private final InscriptionRepository inscriptionRepository;
    private final DistributionQueryPort distributionQueryPort;
    private final PersonneQueryPort personneQueryPort;
    private final InscriptionEventPublisher eventPublisher;

    public InscriptionService(
        InscriptionRepository inscriptionRepository,
        DistributionQueryPort distributionQueryPort,
        PersonneQueryPort personneQueryPort,
        InscriptionEventPublisher eventPublisher
    ) {
        this.inscriptionRepository = inscriptionRepository;
        this.distributionQueryPort = distributionQueryPort;
        this.personneQueryPort = personneQueryPort;
        this.eventPublisher = eventPublisher;
    }

    public InscriptionResponse inscrire(
        UUID distributionId,
        String emailInscrit,
        String typeStr,
        UUID creneauId,
        String tenantSlug
    ) {
        DistributionQueryPort.DistributionInfo distrib =
            distributionQueryPort.trouverDistribution(distributionId);

        if (!"PUBLIEE".equals(distrib.statut()) && !"EN_COURS".equals(distrib.statut())) {
            throw new ConflictException(
                "Inscription impossible : la distribution n'est pas publiee (statut : " + distrib.statut() + ")"
            );
        }

        TypeInscription type = parseType(typeStr);
        PersonneQueryPort.PersonneInfo personne = personneQueryPort.trouverPersonne(emailInscrit);

        // RG2 : unicite par distribution
        verifierUnicite(distributionId, personne.id(), type);

        // RG1 : frequence (beneficiaires uniquement)
        if (type == TypeInscription.BENEFICIAIRE) {
            verifierFrequence(personne.id());
        }

        // Validation du creneau
        if (creneauId != null) {
            distributionQueryPort.trouverCreneau(creneauId, distributionId);
        } else if ("CRENEAUX_DECOUPES".equals(distrib.modeCreneau())) {
            throw new IllegalArgumentException("Un creneau est obligatoire pour ce mode de distribution.");
        }

        // Calcul de la capacite disponible
        boolean placeDisponible = verifierCapacite(distrib, distributionId, creneauId, type);

        Inscription inscription = new Inscription(
            distributionId, creneauId, personne.id(), personne.nom(), personne.prenom(), type
        );

        if (!placeDisponible) {
            // RG3 : liste d'attente
            int rang = calculerProchainRang(distributionId, type);
            inscription.placerEnListeAttente(rang);
        }

        inscriptionRepository.save(inscription);

        if (inscription.getStatut() == StatutInscription.CONFIRMEE) {
            eventPublisher.publierConfirmee(inscription, tenantSlug);
        }

        return toResponse(inscription);
    }

    public void desinscrire(UUID inscriptionId, String emailDemandeur, String tenantSlug) {
        Inscription inscription = trouverOuEchouer(inscriptionId);
        PersonneQueryPort.PersonneInfo demandeur = personneQueryPort.trouverPersonne(emailDemandeur);

        boolean estProprietaire = inscription.getPersonneId().equals(demandeur.id());
        if (!estProprietaire) {
            // La verification de role (coordinateur) est faite dans le controller via @PreAuthorize.
            // Ici on laisse passer si le controller autorise l'appel.
        }

        if (inscription.getStatut() == StatutInscription.ANNULEE) {
            throw new ConflictException("Cette inscription est deja annulee.");
        }

        boolean etaitConfirmee = inscription.getStatut() == StatutInscription.CONFIRMEE;
        inscription.annuler();
        inscriptionRepository.save(inscription);
        eventPublisher.publierAnnulee(inscription, tenantSlug);

        // RG3 : promotion automatique si une place confirmee se libere
        if (etaitConfirmee) {
            promouvoirSuivantEnAttente(
                inscription.getDistributionId(),
                inscription.getCreneauId(),
                inscription.getType(),
                tenantSlug
            );
        }
    }

    public InscriptionResponse pointer(
        UUID inscriptionId,
        String statutPresenceStr,
        String emailPointeur,
        String tenantSlug
    ) {
        Inscription inscription = trouverOuEchouer(inscriptionId);
        DistributionQueryPort.DistributionInfo distrib =
            distributionQueryPort.trouverDistribution(inscription.getDistributionId());

        if (!"EN_COURS".equals(distrib.statut()) && !"TERMINEE".equals(distrib.statut())) {
            throw new ConflictException(
                "Pointage impossible : la distribution n'est pas en cours (statut : " + distrib.statut() + ")"
            );
        }
        if (inscription.getStatut() != StatutInscription.CONFIRMEE) {
            throw new ConflictException("Seules les inscriptions confirmees peuvent etre pointees.");
        }

        PersonneQueryPort.PersonneInfo pointeur = personneQueryPort.trouverPersonne(emailPointeur);
        StatutPresence statutPresence = parsePresence(statutPresenceStr);
        inscription.pointer(statutPresence, pointeur.id());
        inscriptionRepository.save(inscription);
        return toResponse(inscription);
    }

    @Transactional(readOnly = true)
    public List<InscriptionResponse> listerInscritsDistribution(UUID distributionId) {
        List<Inscription> inscriptions =
            inscriptionRepository.findByDistributionIdOrderByNomAscPrenomAsc(distributionId);

        // RG4 : charger les absences passees des beneficiaires en une seule requete.
        List<UUID> idsBeneficiaires = inscriptions.stream()
            .filter(i -> i.getType() == TypeInscription.BENEFICIAIRE)
            .map(Inscription::getPersonneId)
            .distinct()
            .toList();

        Map<UUID, Long> absences = idsBeneficiaires.isEmpty()
            ? Map.of()
            : inscriptionRepository.compterAbsencesParPersonnes(idsBeneficiaires).stream()
                .collect(Collectors.toMap(
                    row -> (UUID) row[0],
                    row -> (Long) row[1]
                ));

        return inscriptions.stream()
            .map(i -> toResponse(i, absences.getOrDefault(i.getPersonneId(), 0L)))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<InscriptionResponse> mesinscriptions(String email, UUID distributionId) {
        // Un utilisateur authentifie peut ne pas encore avoir de personne dans ce tenant.
        try {
            PersonneQueryPort.PersonneInfo personne = personneQueryPort.trouverPersonne(email);
            return inscriptionRepository
                .findByPersonneIdAndDistributionIdOrderByDateInscriptionDesc(
                    personne.id(), distributionId
                )
                .stream()
                .map(this::toResponse)
                .toList();
        } catch (com.solivio.api.shared.exception.NotFoundException e) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<PointageInfoResponse> rechercherPourPointage(UUID distributionId, String recherche) {
        String terme = recherche == null ? "" : recherche.trim();
        return inscriptionRepository.rechercherPourPointage(distributionId, terme)
            .stream()
            .map(i -> new PointageInfoResponse(
                i.getId(), i.getNom(), i.getPrenom(),
                i.getType().name(), i.getStatut().name(), i.getPresence().name(),
                null, null
            ))
            .toList();
    }

    private void verifierUnicite(UUID distributionId, UUID personneId, TypeInscription type) {
        Optional<Inscription> existante =
            inscriptionRepository.findByDistributionIdAndPersonneIdAndType(distributionId, personneId, type);
        if (existante.isPresent() && existante.get().estActive()) {
            throw new ConflictException(
                "Vous etes deja inscrit(e) a cette distribution en tant que " + type.name().toLowerCase()
            );
        }
    }

    private void verifierFrequence(UUID personneId) {
        Instant debut = Instant.now().minus(FREQUENCE_MAX_JOURS, ChronoUnit.DAYS);
        long count = inscriptionRepository.compterInscriptionsConfirmeesPeriode(personneId, debut, Instant.now());
        if (count > 0) {
            throw new ConflictException(
                "Limite de frequence atteinte : une seule inscription confirmee par semaine est autorisee."
            );
        }
    }

    private boolean verifierCapacite(
        DistributionQueryPort.DistributionInfo distrib,
        UUID distributionId,
        UUID creneauId,
        TypeInscription type
    ) {
        if (type == TypeInscription.BENEVOLE && distrib.capaciteBenevoles() == null) {
            return true;
        }
        int capaciteMax = type == TypeInscription.BENEFICIAIRE
            ? distrib.capaciteBeneficiaires()
            : distrib.capaciteBenevoles();

        long inscritsConfirmes;
        if (creneauId != null && "CRENEAUX_DECOUPES".equals(distrib.modeCreneau())) {
            inscritsConfirmes = inscriptionRepository.countByDistributionIdAndCreneauIdAndTypeAndStatut(
                distributionId, creneauId, type, StatutInscription.CONFIRMEE
            );
        } else {
            inscritsConfirmes = inscriptionRepository.countByDistributionIdAndTypeAndStatut(
                distributionId, type, StatutInscription.CONFIRMEE
            );
        }
        return inscritsConfirmes < capaciteMax;
    }

    private int calculerProchainRang(UUID distributionId, TypeInscription type) {
        return inscriptionRepository.findMaxRangListeAttente(distributionId, type)
            .map(max -> max + 1)
            .orElse(1);
    }

    private void promouvoirSuivantEnAttente(
        UUID distributionId,
        UUID creneauId,
        TypeInscription type,
        String tenantSlug
    ) {
        Optional<Inscription> suivant = creneauId != null
            ? inscriptionRepository.findFirstByDistributionIdAndCreneauIdAndTypeAndStatutOrderByRangListeAttenteAsc(
                distributionId, creneauId, type, StatutInscription.LISTE_ATTENTE)
            : inscriptionRepository.findFirstByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
                distributionId, type, StatutInscription.LISTE_ATTENTE);

        suivant.ifPresent(i -> {
            i.promouvoir();
            inscriptionRepository.save(i);
            eventPublisher.publierPromue(i, tenantSlug);
        });
    }

    private Inscription trouverOuEchouer(UUID inscriptionId) {
        return inscriptionRepository.findById(inscriptionId)
            .orElseThrow(() -> new NotFoundException("Inscription introuvable : " + inscriptionId));
    }

    private TypeInscription parseType(String typeStr) {
        try {
            return TypeInscription.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Type d'inscription invalide : " + typeStr);
        }
    }

    private StatutPresence parsePresence(String presence) {
        try {
            return StatutPresence.valueOf(presence.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Statut de presence invalide : " + presence);
        }
    }

    InscriptionResponse toResponse(Inscription i) {
        return toResponse(i, 0L);
    }

    InscriptionResponse toResponse(Inscription i, long nombreAbsencesPassees) {
        List<com.solivio.api.inscription.infrastructure.web.dto.RoleBenevoleResponse> roles =
            i.getRoles().stream()
                .map(r -> new com.solivio.api.inscription.infrastructure.web.dto.RoleBenevoleResponse(
                    r.getId(),
                    r.getTypeRole() != null ? r.getTypeRole().getId() : null,
                    r.libelleEffectif()
                ))
                .toList();
        return new InscriptionResponse(
            i.getId(),
            i.getDistributionId(),
            i.getCreneauId(),
            i.getNom(),
            i.getPrenom(),
            i.getType().name(),
            i.getStatut().name(),
            i.getRangListeAttente(),
            roles,
            i.getPresence().name(),
            i.getDateInscription(),
            nombreAbsencesPassees
        );
    }
}

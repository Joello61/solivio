package com.solivio.api.inscription.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.events.PersonneEffacee;
import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.StatutPresence;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.evenements.InscriptionEventPublisher;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.web.dto.InscriptionPersonnelleResponse;
import com.solivio.api.inscription.infrastructure.web.dto.InscriptionResponse;
import com.solivio.api.inscription.infrastructure.web.dto.PointageInfoResponse;
import com.solivio.api.shared.association.AssociationQueryPort;
import com.solivio.api.shared.distribution.DistributionQueryPort.DistributionDetailInfo;
import com.solivio.api.shared.distribution.DistributionQueryPort.HoraireCreneau;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.temps.HorlogeAssociation;
import com.solivio.api.shared.verrou.VerrouDistribution;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class InscriptionService {

    // Limite hebdomadaire si l'association n'en a pas configure (RG1).
    private static final int FREQUENCE_PAR_DEFAUT = 1;
    static final String CODE_FREQUENCE_DEPASSEE = "FREQUENCY_LIMIT";

    private final InscriptionRepository inscriptionRepository;
    private final DistributionQueryPort distributionQueryPort;
    private final PersonneQueryPort personneQueryPort;
    private final AssociationQueryPort associationQueryPort;
    private final InscriptionEventPublisher eventPublisher;
    private final VerrouDistribution verrouDistribution;
    private final HorlogeAssociation horloge;
    private final AuditService auditService;

    public InscriptionService(
        InscriptionRepository inscriptionRepository,
        DistributionQueryPort distributionQueryPort,
        PersonneQueryPort personneQueryPort,
        AssociationQueryPort associationQueryPort,
        InscriptionEventPublisher eventPublisher,
        VerrouDistribution verrouDistribution,
        HorlogeAssociation horloge,
        AuditService auditService
    ) {
        this.inscriptionRepository = inscriptionRepository;
        this.distributionQueryPort = distributionQueryPort;
        this.personneQueryPort = personneQueryPort;
        this.associationQueryPort = associationQueryPort;
        this.eventPublisher = eventPublisher;
        this.verrouDistribution = verrouDistribution;
        this.horloge = horloge;
        this.auditService = auditService;
    }

    public InscriptionResponse inscrire(
        UUID distributionId,
        String emailInscrit,
        String typeStr,
        UUID creneauId,
        Set<String> rolesUtilisateur
    ) {
        TypeInscription type = parseType(typeStr);
        verifierRolePourType(type, rolesUtilisateur);

        DistributionQueryPort.DistributionInfo distrib =
            distributionQueryPort.trouverDistribution(distributionId);

        if (!"PUBLIEE".equals(distrib.statut()) && !"EN_COURS".equals(distrib.statut())) {
            throw new ConflictException(
                "Inscription impossible : la distribution n'est pas publiee (statut : " + distrib.statut() + ")"
            );
        }

        PersonneQueryPort.PersonneInfo personne = personneQueryPort.trouverPersonne(emailInscrit);
        verrouDistribution.verrouiller(distributionId);

        Optional<Inscription> existante = inscriptionRepository
            .findByDistributionIdAndPersonneIdAndType(distributionId, personne.id(), type);

        // RG2 : unicite par distribution - erreur si deja active, reinscription autorisee si ANNULEE
        if (existante.isPresent() && existante.get().estActive()) {
            throw new ConflictException(
                "Vous etes deja inscrit(e) a cette distribution en tant que " + type.name().toLowerCase()
            );
        }

        // RG1 : frequence (beneficiaires uniquement)
        if (type == TypeInscription.BENEFICIAIRE) {
            verifierFrequence(personne.id(), distrib);
        }

        DistributionQueryPort.CreneauInfo creneau = null;
        if (creneauId != null) {
            creneau = distributionQueryPort.trouverCreneau(creneauId, distributionId);
        } else if ("CRENEAUX_DECOUPES".equals(distrib.modeCreneau())) {
            throw new IllegalArgumentException("Un creneau est obligatoire pour ce mode de distribution.");
        }

        boolean placeDisponible = placeDisponible(distrib, creneau, type);

        Inscription inscription;
        if (existante.isPresent()) {
            // Reinscription apres annulation : reutilisation de la ligne existante
            inscription = existante.get();
            inscription.reinitialiser(creneauId, personne.nom(), personne.prenom());
        } else {
            inscription = new Inscription(
                distributionId, creneauId, personne.id(), personne.nom(), personne.prenom(), type
            );
        }

        if (!placeDisponible) {
            // RG3 : liste d'attente
            int rang = calculerProchainRang(distributionId, type);
            inscription.placerEnListeAttente(rang);
        }

        inscriptionRepository.save(inscription);

        if (inscription.getStatut() == StatutInscription.CONFIRMEE) {
            eventPublisher.publierConfirmee(inscription);
        }

        auditService.tracer("INSCRIPTION_CREEE", "inscription", inscription.getId());
        return toResponse(inscription);
    }

    // Spec 4.5 : chacun gere ses propres inscriptions, y compris face a un coordinateur.
    // Une inscription d'autrui repond comme une inscription inexistante.
    public void desinscrire(UUID distributionId, UUID inscriptionId, String emailDemandeur) {
        verrouDistribution.verrouiller(distributionId);
        Inscription inscription = trouverOuEchouer(inscriptionId, distributionId);
        PersonneQueryPort.PersonneInfo demandeur = personneQueryPort.trouverPersonne(emailDemandeur);
        if (!inscription.getPersonneId().equals(demandeur.id())) {
            throw inscriptionIntrouvable();
        }

        if (inscription.getStatut() == StatutInscription.ANNULEE) {
            throw new ConflictException("Cette inscription est deja annulee.");
        }
        if (inscription.getPresence() != StatutPresence.NON_POINTE) {
            throw new ConflictException("Desinscription impossible : votre presence a deja ete pointee.");
        }
        DistributionQueryPort.DistributionInfo distrib =
            distributionQueryPort.trouverDistribution(distributionId);
        if ("TERMINEE".equals(distrib.statut()) || "ANNULEE".equals(distrib.statut())) {
            throw new ConflictException(
                "Desinscription impossible : la distribution est " + distrib.statut().toLowerCase()
            );
        }

        boolean etaitConfirmee = inscription.getStatut() == StatutInscription.CONFIRMEE;
        boolean estBenevole = inscription.getType() == TypeInscription.BENEVOLE;
        inscription.annuler();
        inscriptionRepository.save(inscription);

        // Alerte desistement tardif : benevole confirme se desinscrit dans les 24h avant la distribution.
        if (etaitConfirmee && estBenevole) {
            if (distrib.date() != null && !distrib.date().isAfter(horloge.aujourdhui().plusDays(1))) {
                eventPublisher.publierDesistementTardifBenevole(inscription);
            }
        }

        // RG3 : promotion automatique si une place confirmee se libere
        if (etaitConfirmee) {
            promouvoirSuivantEnAttente(distrib, inscription.getType());
        }
        auditService.tracer("INSCRIPTION_ANNULEE", "inscription", inscriptionId);
    }

    // Apres une augmentation de capacite : promouvoir la liste d'attente tant qu'il
    // reste des places (RG3). Une seconde execution ne trouve plus de place.
    public void promouvoirSelonPlaces(UUID distributionId) {
        verrouDistribution.verrouiller(distributionId);
        DistributionQueryPort.DistributionInfo distrib = distributionQueryPort.trouverDistribution(distributionId);
        if (!"PUBLIEE".equals(distrib.statut())) {
            return;
        }
        for (TypeInscription type : TypeInscription.values()) {
            boolean placeAttribuee = true;
            while (placeAttribuee) {
                placeAttribuee = promouvoirSuivantEnAttente(distrib, type);
            }
        }
    }

    // RGPD : les inscriptions copient nom et prenom, anonymises comme la personne.
    // Idempotent, l'ecouteur pouvant etre rejoue.
    public void anonymiserPersonne(UUID personneId) {
        inscriptionRepository.remplacerNomPrenom(
            personneId, PersonneEffacee.NOM_ANONYME, PersonneEffacee.PRENOM_ANONYME);
    }

    // RG6 : une distribution annulee annule toutes ses inscriptions actives, sans
    // promotion. Une seconde execution ne trouve plus rien et ne publie rien.
    public void annulerToutesPourDistribution(UUID distributionId) {
        verrouDistribution.verrouiller(distributionId);
        List<Inscription> actives = inscriptionRepository.findByDistributionIdAndStatutIn(
            distributionId, List.of(StatutInscription.CONFIRMEE, StatutInscription.LISTE_ATTENTE));
        if (actives.isEmpty()) {
            return;
        }
        actives.forEach(Inscription::annulerParDistribution);
        inscriptionRepository.saveAll(actives);
        eventPublisher.publierAnnuleesParDistribution(distributionId, actives);
    }

    /**
     * Distribution reactivee : les inscriptions supprimees par l'annulation retrouvent leur
     * statut et leur rang, sauf celles d'une personne inscrite ailleurs la meme semaine
     * depuis (RG1). Les places laissees libres font avancer la liste d'attente.
     */
    public void retablirPourDistribution(UUID distributionId) {
        verrouDistribution.verrouiller(distributionId);
        List<Inscription> annulees = inscriptionRepository
            .findByDistributionIdAndStatutAvantAnnulationIsNotNull(distributionId);
        if (annulees.isEmpty()) {
            return;
        }
        DistributionQueryPort.DistributionInfo distrib = distributionQueryPort.trouverDistribution(distributionId);
        List<Inscription> retablies = new ArrayList<>();
        List<Inscription> nonRetablies = new ArrayList<>();
        for (Inscription inscription : annulees) {
            if (inscription.getType() == TypeInscription.BENEFICIAIRE
                && frequenceDepassee(inscription.getPersonneId(), distrib)) {
                inscription.renoncerAuRetablissement();
                nonRetablies.add(inscription);
            } else {
                inscription.retablir();
                retablies.add(inscription);
            }
        }
        inscriptionRepository.saveAll(annulees);
        promouvoirSelonPlaces(distributionId);
        eventPublisher.publierRetabliesParDistribution(distributionId, retablies, nonRetablies);
    }

    /**
     * RG4 : a la cloture, les beneficiaires confirmes non pointes sont enregistres absents.
     * Rejouable : un second passage ne trouve plus personne a marquer.
     */
    public void enregistrerAbsences(UUID distributionId, LocalDate date) {
        verrouDistribution.verrouiller(distributionId);
        List<Inscription> nonPointes = inscriptionRepository.findByDistributionIdAndTypeAndStatutAndPresence(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE, StatutPresence.NON_POINTE);
        nonPointes.forEach(Inscription::enregistrerAbsenceDeduite);
        inscriptionRepository.saveAll(nonPointes);
        eventPublisher.publierAbsencesEnregistrees(distributionId, date);
    }

    public InscriptionResponse pointer(
        UUID distributionId,
        UUID inscriptionId,
        String statutPresenceStr,
        String emailPointeur,
        boolean gestionnaire
    ) {
        PersonneQueryPort.PersonneInfo pointeur = personneQueryPort.trouverPersonne(emailPointeur);
        verifierAccesPointage(distributionId, pointeur.id(), gestionnaire);
        Inscription inscription = trouverOuEchouer(inscriptionId, distributionId);
        DistributionQueryPort.DistributionInfo distrib =
            distributionQueryPort.trouverDistribution(distributionId);

        if (!"EN_COURS".equals(distrib.statut()) && !"TERMINEE".equals(distrib.statut())) {
            throw new ConflictException(
                "Pointage impossible : la distribution n'est pas en cours (statut : " + distrib.statut() + ")"
            );
        }
        if (inscription.getStatut() != StatutInscription.CONFIRMEE) {
            throw new ConflictException("Seules les inscriptions confirmees peuvent etre pointees.");
        }

        StatutPresence statutPresence = parsePresence(statutPresenceStr);
        inscription.pointer(statutPresence, pointeur.id());
        inscriptionRepository.save(inscription);
        auditService.tracer("POINTAGE", "inscription", inscriptionId);
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
    public List<InscriptionPersonnelleResponse> toutesInscriptions(String email) {
        try {
            PersonneQueryPort.PersonneInfo personne = personneQueryPort.trouverPersonne(email);
            List<Inscription> inscriptions = inscriptionRepository
                .findByPersonneIdOrderByDateInscriptionDesc(personne.id());

            List<UUID> distributionIds = inscriptions.stream()
                .map(Inscription::getDistributionId)
                .distinct()
                .toList();

            Map<UUID, DistributionDetailInfo> detailsParId = distributionQueryPort
                .trouverDetailsParIds(distributionIds)
                .stream()
                .collect(Collectors.toMap(DistributionDetailInfo::id, Function.identity()));
            Map<UUID, List<HoraireCreneau>> horaires = distributionQueryPort
                .trouverHorairesCreneaux(distributionIds)
                .stream()
                .collect(Collectors.groupingBy(HoraireCreneau::distributionId));

            return inscriptions.stream()
                .map(i -> versPersonnelle(i, detailsParId.get(i.getDistributionId()),
                    horaires.getOrDefault(i.getDistributionId(), List.of())))
                .toList();
        } catch (com.solivio.api.shared.exception.NotFoundException e) {
            return List.of();
        }
    }

    private static InscriptionPersonnelleResponse versPersonnelle(
        Inscription i, DistributionDetailInfo dist, List<HoraireCreneau> creneaux
    ) {
        List<HoraireCreneau> retenus = creneaux.stream()
            .filter(c -> c.creneauId().equals(i.getCreneauId()))
            .findFirst()
            .map(List::of)
            .orElse(creneaux);
        LocalTime debut = retenus.stream().map(HoraireCreneau::heureDebut)
            .min(Comparator.naturalOrder()).orElse(null);
        LocalTime fin = retenus.stream().map(HoraireCreneau::heureFin)
            .max(Comparator.naturalOrder()).orElse(null);
        return new InscriptionPersonnelleResponse(
            i.getId(),
            i.getDistributionId(),
            dist != null ? dist.titre() : null,
            dist != null ? dist.date() : null,
            dist != null ? dist.lieu() : null,
            dist != null ? dist.lieuNom() : null,
            dist != null ? dist.statut() : null,
            debut,
            fin,
            i.getType().name(),
            i.getStatut().name(),
            i.getRangListeAttente(),
            i.getPresence().name(),
            i.isAbsenceDeduite(),
            i.getDateInscription()
        );
    }

    @Transactional(readOnly = true)
    public List<InscriptionResponse> mesinscriptions(String email, UUID distributionId) {
        // Un utilisateur authentifie peut ne pas encore avoir de personne provisionnee.
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
    public List<PointageInfoResponse> rechercherPourPointage(
        UUID distributionId,
        String recherche,
        String emailPointeur,
        boolean gestionnaire
    ) {
        if (!gestionnaire) {
            PersonneQueryPort.PersonneInfo pointeur = personneQueryPort.trouverPersonne(emailPointeur);
            verifierAccesPointage(distributionId, pointeur.id(), false);
        }
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

    // RG1 : au plus N distributions par semaine calendaire (lundi-dimanche) de la
    // distribution visee. Les inscriptions en attente comptent : on ne peut pas
    // attendre partout puis etre promu partout. Les distributions annulees non.
    private void verifierFrequence(UUID personneId, DistributionQueryPort.DistributionInfo distrib) {
        if (frequenceDepassee(personneId, distrib)) {
            int maxParSemaine = frequenceMaxParSemaine();
            throw new ConflictException(CODE_FREQUENCE_DEPASSEE, maxParSemaine == 1
                ? "Vous etes deja inscrit(e) a une distribution cette semaine."
                : "Vous etes deja inscrit(e) a " + maxParSemaine + " distributions cette semaine, "
                    + "la limite fixee par l'association.");
        }
    }

    private boolean frequenceDepassee(UUID personneId, DistributionQueryPort.DistributionInfo distrib) {
        int maxParSemaine = frequenceMaxParSemaine();
        LocalDate lundi = distrib.date().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<UUID> autresDistributions = distributionQueryPort
            .trouverIdsNonAnnuleesEntre(lundi, lundi.plusDays(6)).stream()
            .filter(id -> !id.equals(distrib.id()))
            .toList();
        return !autresDistributions.isEmpty()
            && inscriptionRepository.compterInscriptionsBeneficiaireActives(personneId, autresDistributions)
                >= maxParSemaine;
    }

    private int frequenceMaxParSemaine() {
        Integer configMax = associationQueryPort.frequenceMaxParSemaine();
        return (configMax != null && configMax > 0) ? configMax : FREQUENCE_PAR_DEFAUT;
    }

    // RG3 : un beneficiaire a besoin d'une place dans son creneau (mode decoupe)
    // et d'une place sur la distribution ; un benevole, d'une place sur la
    // distribution seulement, la capacite d'un creneau visant les beneficiaires.
    private boolean placeDisponible(
        DistributionQueryPort.DistributionInfo distrib,
        DistributionQueryPort.CreneauInfo creneau,
        TypeInscription type
    ) {
        if (type == TypeInscription.BENEVOLE) {
            return distrib.capaciteBenevoles() == null
                || compterConfirmes(distrib.id(), type) < distrib.capaciteBenevoles();
        }
        if (compterConfirmes(distrib.id(), type) >= distrib.capaciteBeneficiaires()) {
            return false;
        }
        if (creneau == null || !"CRENEAUX_DECOUPES".equals(distrib.modeCreneau())) {
            return true;
        }
        return inscriptionRepository.countByDistributionIdAndCreneauIdAndTypeAndStatut(
            distrib.id(), creneau.id(), type, StatutInscription.CONFIRMEE
        ) < creneau.capacite();
    }

    private long compterConfirmes(UUID distributionId, TypeInscription type) {
        return inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, type, StatutInscription.CONFIRMEE
        );
    }

    private int calculerProchainRang(UUID distributionId, TypeInscription type) {
        return inscriptionRepository.findMaxRangListeAttente(distributionId, type)
            .map(max -> max + 1)
            .orElse(1);
    }

    // Promeut, dans l'ordre de la liste d'attente, la premiere personne pour qui
    // une place existe : la place liberee peut ne pas etre dans son creneau.
    private boolean promouvoirSuivantEnAttente(DistributionQueryPort.DistributionInfo distrib, TypeInscription type) {
        List<Inscription> enAttente = inscriptionRepository
            .findByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
                distrib.id(), type, StatutInscription.LISTE_ATTENTE);
        for (Inscription candidate : enAttente) {
            DistributionQueryPort.CreneauInfo creneau = candidate.getCreneauId() == null
                ? null
                : distributionQueryPort.trouverCreneau(candidate.getCreneauId(), distrib.id());
            if (placeDisponible(distrib, creneau, type)) {
                candidate.promouvoir();
                inscriptionRepository.save(candidate);
                eventPublisher.publierPromue(candidate);
                return true;
            }
        }
        return false;
    }

    private Inscription trouverOuEchouer(UUID inscriptionId, UUID distributionId) {
        return inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId)
            .orElseThrow(InscriptionService::inscriptionIntrouvable);
    }

    private static NotFoundException inscriptionIntrouvable() {
        return new NotFoundException("Inscription introuvable.");
    }

    // Un benevole ne pointe que les distributions ou il est lui-meme inscrit et confirme.
    private void verifierAccesPointage(UUID distributionId, UUID pointeurId, boolean gestionnaire) {
        if (gestionnaire) {
            return;
        }
        boolean benevoleInscrit = inscriptionRepository.existsByDistributionIdAndPersonneIdAndTypeAndStatut(
            distributionId, pointeurId, TypeInscription.BENEVOLE, StatutInscription.CONFIRMEE
        );
        if (!benevoleInscrit) {
            throw new NotFoundException("Distribution introuvable.");
        }
    }

    // Une inscription beneficiaire est reservee au role beneficiaire ; une inscription
    // benevole est ouverte a tous les autres roles (decision du 10 octobre 2026).
    private static void verifierRolePourType(TypeInscription type, Set<String> roles) {
        boolean beneficiaire = roles.contains("beneficiaire");
        boolean autorise = type == TypeInscription.BENEFICIAIRE ? beneficiaire : !beneficiaire;
        if (!autorise) {
            throw new AuthorizationDeniedException(type == TypeInscription.BENEFICIAIRE
                ? "Seuls les beneficiaires peuvent s'inscrire en tant que beneficiaire."
                : "Les beneficiaires ne peuvent pas s'inscrire en tant que benevole.");
        }
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
            i.isAbsenceDeduite(),
            i.getDateInscription(),
            nombreAbsencesPassees
        );
    }
}

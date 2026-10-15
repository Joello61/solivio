package com.solivio.api.distribution.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.distribution.domain.BaseRepartition;
import com.solivio.api.distribution.domain.Creneau;
import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.ModeCreneauDistribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import com.solivio.api.distribution.infrastructure.evenements.DistributionEventPublisher;
import com.solivio.api.distribution.infrastructure.persistence.CreneauRepository;
import com.solivio.api.distribution.infrastructure.persistence.DistributionRepository;
import com.solivio.api.distribution.infrastructure.web.dto.AjouterCreneauRequest;
import com.solivio.api.distribution.infrastructure.web.dto.CreateDistributionRequest;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionPubliqueResponse;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.inscription.InscriptionQueryPort.Remplissage;
import com.solivio.api.shared.lieu.Lieu;
import com.solivio.api.shared.lieu.LieuRequest;
import com.solivio.api.shared.temps.HorlogeAssociation;
import com.solivio.api.shared.web.Assainissement;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class DistributionService {

    private static final int NOMBRE_DISTRIBUTIONS_PUBLIQUES = 6;
    private static final List<StatutDistribution> STATUTS_OUVERTS =
        List.of(StatutDistribution.PUBLIEE, StatutDistribution.EN_COURS);

    private final DistributionRepository distributionRepository;
    private final CreneauRepository creneauRepository;
    private final DistributionEventPublisher eventPublisher;
    private final PersonneQueryPort personneQueryPort;
    private final HorlogeAssociation horloge;
    private final AuditService auditService;
    private final ReponseDistribution reponses;

    public DistributionService(
        DistributionRepository distributionRepository,
        CreneauRepository creneauRepository,
        DistributionEventPublisher eventPublisher,
        PersonneQueryPort personneQueryPort,
        HorlogeAssociation horloge,
        AuditService auditService,
        ReponseDistribution reponses
    ) {
        this.distributionRepository = distributionRepository;
        this.creneauRepository = creneauRepository;
        this.eventPublisher = eventPublisher;
        this.personneQueryPort = personneQueryPort;
        this.horloge = horloge;
        this.auditService = auditService;
        this.reponses = reponses;
    }

    public DistributionResponse creer(CreateDistributionRequest request, String emailCreateur) {
        if (request.date().isBefore(horloge.aujourdhui())) {
            throw new IllegalArgumentException("La date de la distribution est deja passee.");
        }
        ModeCreneauDistribution mode = parseModeCreneauDistribution(request.modeCreneau());
        validerCreneaux(request.creneaux(), mode);
        PersonneQueryPort.PersonneInfo createur = personneQueryPort.trouverPersonne(emailCreateur);

        Distribution distribution = new Distribution(
            Assainissement.nettoyer(request.titre()),
            Assainissement.nettoyer(request.description()),
            toLieu(request.lieu()),
            request.date(),
            request.capaciteBeneficiaires(),
            request.capaciteBenevoles(),
            mode,
            createur.id()
        );
        distributionRepository.save(distribution);

        List<Creneau> creneaux = request.creneaux().stream()
            .map(c -> creneauRepository.save(
                new Creneau(distribution.getId(), c.heureDebut(), c.heureFin(), c.capacite())
            ))
            .toList();

        auditService.tracer("DISTRIBUTION_CREEE", "distribution", distribution.getId());
        return reponses.une(distribution, creneaux, true);
    }

    public DistributionResponse publier(UUID distributionId) {
        Distribution d = trouverOuEchouer(distributionId);
        d.transitionnerVers(StatutDistribution.PUBLIEE, null);
        distributionRepository.save(d);
        auditService.tracer("DISTRIBUTION_PUBLIEE", "distribution", distributionId);
        return reponses.une(d, creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId), true);
    }

    public DistributionResponse demarrer(UUID distributionId) {
        Distribution d = trouverOuEchouer(distributionId);
        if (d.getDate().isAfter(horloge.aujourdhui())) {
            throw new ConflictException(
                "La distribution ne peut pas etre demarree avant sa date : " + d.getDate()
            );
        }
        d.transitionnerVers(StatutDistribution.EN_COURS, null);
        auditService.tracer("DISTRIBUTION_DEMARREE", "distribution", distributionId);
        return reponses.une(distributionRepository.save(d),
            creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId), true);
    }

    /** RG8 : nombre de beneficiaires retenu pour la repartition, choisi par le coordinateur. */
    public DistributionResponse changerBaseRepartition(UUID distributionId, String base) {
        Distribution d = trouverOuEchouer(distributionId);
        if (d.getStatut() == StatutDistribution.ANNULEE) {
            throw new ConflictException("La repartition d'une distribution annulee ne se modifie plus.");
        }
        d.setBaseRepartition(BaseRepartition.valueOf(base));
        auditService.tracer("DISTRIBUTION_BASE_REPARTITION", "distribution", distributionId);
        return reponses.une(distributionRepository.save(d),
            creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId), true);
    }

    public DistributionResponse terminer(UUID distributionId) {
        Distribution d = trouverOuEchouer(distributionId);
        d.transitionnerVers(StatutDistribution.TERMINEE, null);
        distributionRepository.save(d);
        eventPublisher.publierTerminee(distributionId, d.getDate());
        auditService.tracer("DISTRIBUTION_TERMINEE", "distribution", distributionId);
        return reponses.une(d, creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId), true);
    }

    public DistributionResponse annuler(UUID distributionId, String motif) {
        Distribution d = trouverOuEchouer(distributionId);
        String motifSain = Assainissement.nettoyer(motif);
        d.transitionnerVers(StatutDistribution.ANNULEE, motifSain);
        distributionRepository.save(d);
        eventPublisher.publierAnnulee(distributionId, d.getDate());
        auditService.tracer("DISTRIBUTION_ANNULEE", "distribution", distributionId);
        return reponses.une(d, creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId), true);
    }

    @Transactional(readOnly = true)
    public List<DistributionResponse> lister() {
        return avecCreneaux(distributionRepository.findAllByOrderByDateDesc(), true);
    }

    @Transactional(readOnly = true)
    // Vue des membres qui ne gerent pas : distributions a venir ou du jour, en cours
    // comprises, de la plus proche a la plus lointaine. L'historique passe par
    // "Mes inscriptions".
    public List<DistributionResponse> listerPubliees() {
        return avecCreneaux(distributionsOuvertesAVenir(), false);
    }

    private List<DistributionResponse> avecCreneaux(List<Distribution> distributions, boolean vueGestion) {
        return reponses.plusieurs(distributions, creneauxParDistribution(distributions), vueGestion);
    }

    /**
     * Page publique : les prochaines distributions ouvertes, reduites a la date, aux
     * horaires, au lieu et a un indicateur "complet". Aucun effectif n'est expose.
     */
    @Transactional(readOnly = true)
    public List<DistributionPubliqueResponse> prochainesPubliques() {
        List<Distribution> distributions = distributionsOuvertesAVenir().stream()
            .limit(NOMBRE_DISTRIBUTIONS_PUBLIQUES)
            .toList();
        Map<UUID, List<Creneau>> creneaux = creneauxParDistribution(distributions);
        Map<UUID, Remplissage> remplissages = reponses.remplissages(
            distributions.stream().map(Distribution::getId).toList());
        return distributions.stream()
            .map(d -> versPublique(d, creneaux.getOrDefault(d.getId(), List.of()),
                remplissages.getOrDefault(d.getId(), Remplissage.VIDE)))
            .toList();
    }

    private List<Distribution> distributionsOuvertesAVenir() {
        return distributionRepository.findByStatutInAndDateGreaterThanEqualOrderByDateAsc(
            STATUTS_OUVERTS, horloge.aujourdhui());
    }

    // Une requete pour les creneaux de toute la liste, au lieu d'une par distribution.
    private Map<UUID, List<Creneau>> creneauxParDistribution(List<Distribution> distributions) {
        return creneauRepository
            .findByDistributionIdInOrderByHeureDebut(distributions.stream().map(Distribution::getId).toList())
            .stream()
            .collect(Collectors.groupingBy(Creneau::getDistributionId));
    }

    private static DistributionPubliqueResponse versPublique(Distribution d, List<Creneau> creneaux, Remplissage r) {
        LocalTime debut = creneaux.stream().map(Creneau::getHeureDebut).min(Comparator.naturalOrder()).orElse(null);
        LocalTime fin = creneaux.stream().map(Creneau::getHeureFin).max(Comparator.naturalOrder()).orElse(null);
        Lieu lieu = d.getLieu();
        return new DistributionPubliqueResponse(
            d.getDate(),
            debut,
            fin,
            lieu == null ? null : lieu.getNom(),
            lieu == null ? null : lieu.getAdresseFormatee(),
            ReponseDistribution.placesRestantesBeneficiaires(d, r) == 0
        );
    }

    @Transactional(readOnly = true)
    public DistributionResponse detail(UUID distributionId, boolean gestionnaire) {
        Distribution d = trouverOuEchouer(distributionId);
        // Un brouillon n'existe pas pour qui ne gere pas les distributions (404, pas 403).
        if (!gestionnaire && d.getStatut() == StatutDistribution.BROUILLON) {
            throw new NotFoundException("Distribution introuvable : " + distributionId);
        }
        return reponses.une(d, creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId),
            gestionnaire);
    }

    @Transactional(readOnly = true)
    public Distribution trouverOuEchouer(UUID distributionId) {
        return distributionRepository.findById(distributionId)
            .orElseThrow(() -> new NotFoundException("Distribution introuvable : " + distributionId));
    }

    static void validerCreneaux(List<AjouterCreneauRequest> creneaux, ModeCreneauDistribution mode) {
        if (creneaux == null || creneaux.isEmpty()) {
            throw new IllegalArgumentException("Au moins un creneau est requis.");
        }
        if (mode == ModeCreneauDistribution.CRENEAU_UNIQUE && creneaux.size() > 1) {
            throw new IllegalArgumentException("Une distribution en creneau unique n'a qu'un seul creneau.");
        }
        for (AjouterCreneauRequest c : creneaux) {
            LocalTime debut = c.heureDebut();
            LocalTime fin = c.heureFin();
            if (debut == null || fin == null || !fin.isAfter(debut)) {
                throw new IllegalArgumentException(
                    "heure_fin doit etre apres heure_debut pour chaque creneau."
                );
            }
        }
    }

    static ModeCreneauDistribution parseModeCreneauDistribution(String modeCreneau) {
        if (modeCreneau == null || modeCreneau.isBlank()) {
            return ModeCreneauDistribution.CRENEAU_UNIQUE;
        }
        try {
            return ModeCreneauDistribution.valueOf(modeCreneau.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Mode de creneau invalide : " + modeCreneau);
        }
    }

    static Lieu toLieu(LieuRequest r) {
        if (r == null) {
            return null;
        }
        return new Lieu(r.placeId(), r.nom(), r.adresseFormatee(), r.latitude(), r.longitude(),
            r.numeroRue(), r.voie(), r.codePostal(), r.ville());
    }
}

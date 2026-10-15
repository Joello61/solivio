package com.solivio.api.distribution.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.distribution.domain.Creneau;
import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.ModeCreneauDistribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import com.solivio.api.distribution.infrastructure.evenements.DistributionEventPublisher;
import com.solivio.api.distribution.infrastructure.persistence.CreneauRepository;
import com.solivio.api.distribution.infrastructure.persistence.DistributionRepository;
import com.solivio.api.distribution.infrastructure.web.dto.AjouterCreneauRequest;
import com.solivio.api.distribution.infrastructure.web.dto.CreneauModifieRequest;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionResponse;
import com.solivio.api.distribution.infrastructure.web.dto.UpdateDistributionRequest;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import com.solivio.api.shared.inscription.InscriptionQueryPort.ComptesCreneau;
import com.solivio.api.shared.lieu.Lieu;
import com.solivio.api.shared.temps.HorlogeAssociation;
import com.solivio.api.shared.verrou.VerrouDistribution;
import com.solivio.api.shared.web.Assainissement;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Modification d'une distribution avant son demarrage, et suppression d'un
 * brouillon. Les places deja attribuees sont protegees : capacites jamais sous
 * les inscrits confirmes, creneau avec inscriptions jamais supprime.
 */
@Service
@Transactional
public class ModificationDistributionService {

    private static final DateTimeFormatter HEURE = DateTimeFormatter.ofPattern("HH:mm");
    private static final String BENEFICIAIRE = "BENEFICIAIRE";
    private static final String BENEVOLE = "BENEVOLE";

    private final DistributionRepository distributionRepository;
    private final CreneauRepository creneauRepository;
    private final DistributionEventPublisher eventPublisher;
    private final InscriptionQueryPort inscriptionQueryPort;
    private final VerrouDistribution verrou;
    private final HorlogeAssociation horloge;
    private final AuditService auditService;
    private final ReponseDistribution reponses;

    public ModificationDistributionService(
        DistributionRepository distributionRepository,
        CreneauRepository creneauRepository,
        DistributionEventPublisher eventPublisher,
        InscriptionQueryPort inscriptionQueryPort,
        VerrouDistribution verrou,
        HorlogeAssociation horloge,
        AuditService auditService,
        ReponseDistribution reponses
    ) {
        this.distributionRepository = distributionRepository;
        this.creneauRepository = creneauRepository;
        this.eventPublisher = eventPublisher;
        this.inscriptionQueryPort = inscriptionQueryPort;
        this.verrou = verrou;
        this.horloge = horloge;
        this.auditService = auditService;
        this.reponses = reponses;
    }

    public DistributionResponse modifier(UUID distributionId, UpdateDistributionRequest request) {
        // Meme verrou que les inscriptions : les comptes lus ci-dessous ne bougent plus.
        verrou.verrouiller(distributionId);
        Distribution distribution = trouverOuEchouer(distributionId);
        boolean publiee = distribution.getStatut() == StatutDistribution.PUBLIEE;
        if (!publiee && distribution.getStatut() != StatutDistribution.BROUILLON) {
            throw new ConflictException("Une distribution demarree, terminee ou annulee ne peut plus etre modifiee.");
        }
        if (request.date().isBefore(horloge.aujourdhui())) {
            throw new IllegalArgumentException("La date de la distribution est deja passee.");
        }
        ModeCreneauDistribution mode = DistributionService.parseModeCreneauDistribution(request.modeCreneau());
        if (publiee && mode != distribution.getModeCreneau()) {
            throw new ConflictException("Le mode de creneau ne peut plus changer une fois la distribution publiee.");
        }
        DistributionService.validerCreneaux(request.creneaux().stream()
            .map(c -> new AjouterCreneauRequest(c.heureDebut(), c.heureFin(), c.capacite()))
            .toList(), mode);
        verifierCapacites(distributionId, request);

        List<Creneau> existants = creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId);
        Map<UUID, Creneau> existantsParId = existants.stream()
            .collect(Collectors.toMap(Creneau::getId, Function.identity()));
        verifierCreneaux(distributionId, request.creneaux(), existants, existantsParId);

        Lieu nouveauLieu = DistributionService.toLieu(request.lieu());
        boolean changementPratique = !request.date().equals(distribution.getDate())
            || lieuChange(distribution.getLieu(), nouveauLieu)
            || horairesChanges(request.creneaux(), existantsParId);
        boolean capaciteAugmentee = capaciteAugmentee(distribution, request, existantsParId);

        distribution.setTitre(Assainissement.nettoyer(request.titre()));
        distribution.setDescription(Assainissement.nettoyer(request.description()));
        distribution.setLieu(nouveauLieu);
        distribution.setDate(request.date());
        distribution.setCapaciteBeneficiaires(request.capaciteBeneficiaires());
        distribution.setCapaciteBenevoles(request.capaciteBenevoles());
        distribution.setModeCreneau(mode);
        distributionRepository.save(distribution);
        List<Creneau> creneaux = appliquerCreneaux(distributionId, request.creneaux(), existants, existantsParId);

        // Un brouillon n'a pas d'inscrit : rien a prevenir ni a promouvoir.
        if (publiee && (changementPratique || capaciteAugmentee)) {
            eventPublisher.publierModifiee(distributionId, changementPratique, capaciteAugmentee);
        }
        auditService.tracer("DISTRIBUTION_MODIFIEE", "distribution", distributionId);
        return reponses.une(distribution, creneaux, true);
    }

    public void supprimer(UUID distributionId) {
        Distribution distribution = trouverOuEchouer(distributionId);
        if (distribution.getStatut() != StatutDistribution.BROUILLON) {
            throw new ConflictException("Seul un brouillon peut etre supprime ; une distribution publiee s'annule.");
        }
        // Les creneaux et d'eventuelles denrees saisies partent en cascade (contraintes
        // ON DELETE CASCADE) ; un brouillon ne peut pas avoir d'inscription.
        distributionRepository.delete(distribution);
        auditService.tracer("DISTRIBUTION_SUPPRIMEE", "distribution", distributionId);
    }

    /** Demarrage accidentel : retour a publiee tant que personne n'a ete pointe. */
    public DistributionResponse annulerDemarrage(UUID distributionId) {
        verrou.verrouiller(distributionId);
        Distribution distribution = trouverOuEchouer(distributionId);
        if (distribution.getStatut() != StatutDistribution.EN_COURS) {
            throw new ConflictException("Seule une distribution en cours peut revenir a l'etat publiee.");
        }
        if (inscriptionQueryPort.compterPointages(distributionId) > 0) {
            throw new ConflictException(
                "Des presences ont deja ete pointees : la distribution ne peut plus revenir a l'etat publiee.");
        }
        distribution.annulerDemarrage();
        distributionRepository.save(distribution);
        auditService.tracer("DISTRIBUTION_DEMARRAGE_ANNULE", "distribution", distributionId);
        return reponses.une(distribution,
            creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId), true);
    }

    /**
     * Annulation par erreur : la distribution retrouve son statut d'avant et, si elle
     * etait publiee, ses inscriptions sont retablies (module inscription).
     */
    public DistributionResponse reactiver(UUID distributionId) {
        verrou.verrouiller(distributionId);
        Distribution distribution = trouverOuEchouer(distributionId);
        if (distribution.getStatut() != StatutDistribution.ANNULEE) {
            throw new ConflictException("Seule une distribution annulee peut etre reactivee.");
        }
        if (distribution.getDate().isBefore(horloge.aujourdhui())) {
            throw new ConflictException("La date de cette distribution est passee : elle ne peut plus etre reactivee.");
        }
        StatutDistribution retrouve = distribution.reactiver();
        distributionRepository.save(distribution);
        if (retrouve == StatutDistribution.PUBLIEE) {
            eventPublisher.publierReactivee(distributionId);
        }
        auditService.tracer("DISTRIBUTION_REACTIVEE", "distribution", distributionId);
        return reponses.une(distribution,
            creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId), true);
    }

    private void verifierCapacites(UUID distributionId, UpdateDistributionRequest request) {
        int beneficiaires = inscriptionQueryPort.compterConfirmes(distributionId, BENEFICIAIRE);
        if (request.capaciteBeneficiaires() < beneficiaires) {
            throw new ConflictException("La capacite beneficiaires ne peut pas etre inferieure aux "
                + beneficiaires + " inscrits confirmes.");
        }
        int benevoles = inscriptionQueryPort.compterConfirmes(distributionId, BENEVOLE);
        if (request.capaciteBenevoles() != null && request.capaciteBenevoles() < benevoles) {
            throw new ConflictException("La capacite benevoles ne peut pas etre inferieure aux "
                + benevoles + " benevoles confirmes.");
        }
    }

    private void verifierCreneaux(UUID distributionId, List<CreneauModifieRequest> demandes,
                                  List<Creneau> existants, Map<UUID, Creneau> existantsParId) {
        Map<UUID, ComptesCreneau> comptes = inscriptionQueryPort.compterParCreneau(distributionId);
        Set<UUID> gardes = demandes.stream().map(CreneauModifieRequest::id).filter(Objects::nonNull)
            .collect(Collectors.toSet());
        if (!existantsParId.keySet().containsAll(gardes)) {
            throw new IllegalArgumentException("Un creneau ne fait pas partie de cette distribution.");
        }
        for (Creneau existant : existants) {
            ComptesCreneau compte = comptes.get(existant.getId());
            if (!gardes.contains(existant.getId()) && compte != null && compte.total() > 0) {
                throw new ConflictException("Le creneau de " + existant.getHeureDebut().format(HEURE)
                    + " a deja recu des inscriptions et ne peut pas etre supprime.");
            }
        }
        for (CreneauModifieRequest demande : demandes) {
            ComptesCreneau compte = demande.id() == null ? null : comptes.get(demande.id());
            if (compte != null && demande.capacite() < compte.confirmes()) {
                throw new ConflictException("Le creneau de " + demande.heureDebut().format(HEURE) + " compte "
                    + compte.confirmes() + " inscrits confirmes : sa capacite ne peut pas etre inferieure.");
            }
        }
    }

    private List<Creneau> appliquerCreneaux(UUID distributionId, List<CreneauModifieRequest> demandes,
                                            List<Creneau> existants, Map<UUID, Creneau> existantsParId) {
        Set<UUID> gardes = demandes.stream().map(CreneauModifieRequest::id).filter(Objects::nonNull)
            .collect(Collectors.toSet());
        creneauRepository.deleteAll(existants.stream().filter(c -> !gardes.contains(c.getId())).toList());
        return demandes.stream()
            .map(d -> {
                Creneau creneau = d.id() == null
                    ? new Creneau(distributionId, d.heureDebut(), d.heureFin(), d.capacite())
                    : existantsParId.get(d.id());
                creneau.setHeureDebut(d.heureDebut());
                creneau.setHeureFin(d.heureFin());
                creneau.setCapacite(d.capacite());
                return creneauRepository.save(creneau);
            })
            .sorted(Comparator.comparing(Creneau::getHeureDebut))
            .toList();
    }

    private static boolean lieuChange(Lieu avant, Lieu apres) {
        String adresseAvant = avant == null ? null : avant.getAdresseFormatee();
        String adresseApres = apres == null ? null : apres.getAdresseFormatee();
        String placeAvant = avant == null ? null : avant.getPlaceId();
        String placeApres = apres == null ? null : apres.getPlaceId();
        return !Objects.equals(adresseAvant, adresseApres) || !Objects.equals(placeAvant, placeApres);
    }

    // Seuls les creneaux gardes comptent : un creneau ajoute ne concerne aucun inscrit,
    // et un creneau supprime n'en avait pas.
    private static boolean horairesChanges(List<CreneauModifieRequest> demandes, Map<UUID, Creneau> existantsParId) {
        return demandes.stream()
            .filter(d -> d.id() != null)
            .anyMatch(d -> {
                Creneau avant = existantsParId.get(d.id());
                return !avant.getHeureDebut().equals(d.heureDebut()) || !avant.getHeureFin().equals(d.heureFin());
            });
    }

    private static boolean capaciteAugmentee(Distribution distribution, UpdateDistributionRequest request,
                                             Map<UUID, Creneau> existantsParId) {
        Integer benevolesAvant = distribution.getCapaciteBenevoles();
        boolean benevoles = benevolesAvant != null
            && (request.capaciteBenevoles() == null || request.capaciteBenevoles() > benevolesAvant);
        boolean creneaux = request.creneaux().stream()
            .anyMatch(d -> d.id() == null || d.capacite() > existantsParId.get(d.id()).getCapacite());
        return request.capaciteBeneficiaires() > distribution.getCapaciteBeneficiaires() || benevoles || creneaux;
    }

    private Distribution trouverOuEchouer(UUID distributionId) {
        return distributionRepository.findById(distributionId)
            .orElseThrow(() -> new NotFoundException("Distribution introuvable : " + distributionId));
    }
}

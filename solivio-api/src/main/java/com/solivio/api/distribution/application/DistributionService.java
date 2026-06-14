package com.solivio.api.distribution.application;

import com.solivio.api.distribution.domain.Creneau;
import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.Lieu;
import com.solivio.api.distribution.domain.ModeCreneauDistribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import com.solivio.api.distribution.infrastructure.kafka.DistributionEventPublisher;
import com.solivio.api.distribution.infrastructure.persistence.CreneauRepository;
import com.solivio.api.distribution.infrastructure.persistence.DistributionRepository;
import com.solivio.api.distribution.infrastructure.web.dto.AjouterCreneauRequest;
import com.solivio.api.distribution.infrastructure.web.dto.CreateDistributionRequest;
import com.solivio.api.distribution.infrastructure.web.dto.CreneauResponse;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionResponse;
import com.solivio.api.distribution.infrastructure.web.dto.LieuRequest;
import com.solivio.api.distribution.infrastructure.web.dto.LieuResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class DistributionService {

    private final DistributionRepository distributionRepository;
    private final CreneauRepository creneauRepository;
    private final DistributionEventPublisher eventPublisher;
    private final PersonneQueryPort personneQueryPort;

    public DistributionService(
        DistributionRepository distributionRepository,
        CreneauRepository creneauRepository,
        DistributionEventPublisher eventPublisher,
        PersonneQueryPort personneQueryPort
    ) {
        this.distributionRepository = distributionRepository;
        this.creneauRepository = creneauRepository;
        this.eventPublisher = eventPublisher;
        this.personneQueryPort = personneQueryPort;
    }

    public DistributionResponse creer(CreateDistributionRequest request, String emailCreateur) {
        validerCreneaux(request);
        PersonneQueryPort.PersonneInfo createur = personneQueryPort.trouverPersonne(emailCreateur);
        ModeCreneauDistribution mode = parseModeCreneauDistribution(request.modeCreneau());

        Distribution distribution = new Distribution(
            Jsoup.clean(request.titre(), Safelist.none()),
            request.description() != null ? Jsoup.clean(request.description(), Safelist.none()) : null,
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

        return toResponse(distribution, creneaux);
    }

    public DistributionResponse publier(UUID distributionId, String tenantSlug) {
        Distribution d = trouverOuEchouer(distributionId);
        d.transitionnerVers(StatutDistribution.PUBLIEE, null);
        distributionRepository.save(d);
        eventPublisher.publierPubliee(distributionId, tenantSlug, d.getDate());
        return toResponse(d, creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId));
    }

    public DistributionResponse demarrer(UUID distributionId) {
        Distribution d = trouverOuEchouer(distributionId);
        if (d.getDate().isAfter(LocalDate.now())) {
            throw new ConflictException(
                "La distribution ne peut pas etre demarree avant sa date : " + d.getDate()
            );
        }
        d.transitionnerVers(StatutDistribution.EN_COURS, null);
        return toResponse(distributionRepository.save(d),
            creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId));
    }

    public DistributionResponse terminer(UUID distributionId, String tenantSlug) {
        Distribution d = trouverOuEchouer(distributionId);
        d.transitionnerVers(StatutDistribution.TERMINEE, null);
        distributionRepository.save(d);
        eventPublisher.publierTerminee(distributionId, tenantSlug, d.getDate());
        return toResponse(d, creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId));
    }

    public DistributionResponse annuler(UUID distributionId, String motif, String tenantSlug) {
        Distribution d = trouverOuEchouer(distributionId);
        String motifSain = motif != null ? Jsoup.clean(motif, Safelist.none()) : null;
        d.transitionnerVers(StatutDistribution.ANNULEE, motifSain);
        distributionRepository.save(d);
        eventPublisher.publierAnnulee(distributionId, tenantSlug, d.getDate());
        return toResponse(d, creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId));
    }

    @Transactional(readOnly = true)
    public List<DistributionResponse> lister() {
        return distributionRepository.findAllByOrderByDateDesc().stream()
            .map(d -> toResponse(d, creneauRepository.findByDistributionIdOrderByHeureDebut(d.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<DistributionResponse> listerPubliees() {
        return distributionRepository.findByStatutOrderByDateDesc(StatutDistribution.PUBLIEE).stream()
            .map(d -> toResponse(d, creneauRepository.findByDistributionIdOrderByHeureDebut(d.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public DistributionResponse detail(UUID distributionId) {
        Distribution d = trouverOuEchouer(distributionId);
        return toResponse(d, creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId));
    }

    @Transactional(readOnly = true)
    public Distribution trouverOuEchouer(UUID distributionId) {
        return distributionRepository.findById(distributionId)
            .orElseThrow(() -> new NotFoundException("Distribution introuvable : " + distributionId));
    }

    private void validerCreneaux(CreateDistributionRequest request) {
        if (request.creneaux() == null || request.creneaux().isEmpty()) {
            throw new IllegalArgumentException("Au moins un creneau est requis.");
        }
        for (AjouterCreneauRequest c : request.creneaux()) {
            LocalTime debut = c.heureDebut();
            LocalTime fin = c.heureFin();
            if (debut == null || fin == null || !fin.isAfter(debut)) {
                throw new IllegalArgumentException(
                    "heure_fin doit etre apres heure_debut pour chaque creneau."
                );
            }
        }
    }

    private ModeCreneauDistribution parseModeCreneauDistribution(String modeCreneau) {
        if (modeCreneau == null || modeCreneau.isBlank()) {
            return ModeCreneauDistribution.CRENEAU_UNIQUE;
        }
        try {
            return ModeCreneauDistribution.valueOf(modeCreneau.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Mode de creneau invalide : " + modeCreneau);
        }
    }

    static DistributionResponse toResponse(Distribution d, List<Creneau> creneaux) {
        List<CreneauResponse> creneauxReponse = creneaux.stream()
            .map(c -> new CreneauResponse(c.getId(), c.getHeureDebut(), c.getHeureFin(), c.getCapacite()))
            .toList();
        return new DistributionResponse(
            d.getId(),
            d.getTitre(),
            d.getDescription(),
            toLieuResponse(d.getLieu()),
            d.getDate(),
            d.getStatut().name(),
            d.getCapaciteBeneficiaires(),
            d.getCapaciteBenevoles(),
            d.getModeCreneau().name(),
            d.getBaseRepartition().name(),
            d.getMotifAnnulation(),
            d.getDateCreation(),
            creneauxReponse
        );
    }

    private static Lieu toLieu(LieuRequest r) {
        if (r == null) {
            return null;
        }
        return new Lieu(r.placeId(), r.nom(), r.adresseFormatee(), r.latitude(), r.longitude(),
            r.numeroRue(), r.voie(), r.codePostal(), r.ville());
    }

    private static LieuResponse toLieuResponse(Lieu l) {
        if (l == null) {
            return null;
        }
        return new LieuResponse(l.getPlaceId(), l.getNom(), l.getAdresseFormatee(),
            l.getLatitude(), l.getLongitude(), l.getNumeroRue(), l.getVoie(),
            l.getCodePostal(), l.getVille());
    }
}

package com.solivio.api.repartition.application;

import com.solivio.api.repartition.domain.DenreeDistribution;
import com.solivio.api.repartition.domain.UniteConditionnement;
import com.solivio.api.repartition.infrastructure.persistence.DenreeDistributionRepository;
import com.solivio.api.repartition.infrastructure.web.dto.DenreeResponse;
import com.solivio.api.repartition.infrastructure.web.dto.DotationDenreeDto;
import com.solivio.api.repartition.infrastructure.web.dto.DotationResponse;
import com.solivio.api.repartition.infrastructure.web.dto.SaisirDenreeRequest;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import com.solivio.api.shared.web.Assainissement;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RepartitionService {

    private static final double PALIER_VRAC = 0.5;
    private static final double EPSILON = 1e-9;

    private final DenreeDistributionRepository denreeRepository;
    private final DistributionQueryPort distributionQueryPort;
    private final InscriptionQueryPort inscriptionQueryPort;
    private final CatalogueDenreeService catalogueDenreeService;

    public RepartitionService(
        DenreeDistributionRepository denreeRepository,
        DistributionQueryPort distributionQueryPort,
        InscriptionQueryPort inscriptionQueryPort,
        CatalogueDenreeService catalogueDenreeService
    ) {
        this.denreeRepository = denreeRepository;
        this.distributionQueryPort = distributionQueryPort;
        this.inscriptionQueryPort = inscriptionQueryPort;
        this.catalogueDenreeService = catalogueDenreeService;
    }

    public DenreeResponse saisirDenree(UUID distributionId, SaisirDenreeRequest request) {
        validerModifiable(distributionId);

        UniteConditionnement unite = parseUnite(request.unite());
        String libelle = Assainissement.nettoyer(request.libelle());

        DenreeDistribution denree = new DenreeDistribution(
            distributionId,
            libelle,
            unite,
            request.nombreContenants(),
            request.quantiteParContenant()
        );
        catalogueDenreeService.enregistrerSiInconnu(libelle);
        denreeRepository.save(denree);
        return toResponse(denree);
    }

    public DenreeResponse modifierDenree(UUID distributionId, UUID denreeId, SaisirDenreeRequest request) {
        validerModifiable(distributionId);
        DenreeDistribution denree = trouverOuEchouer(denreeId, distributionId);

        UniteConditionnement unite = parseUnite(request.unite());
        String libelle = Assainissement.nettoyer(request.libelle());
        boolean libelleChange = !denree.getLibelle().equalsIgnoreCase(libelle);
        denree.setLibelle(libelle);
        denree.setUnite(unite);
        denree.setNombreContenants(request.nombreContenants());
        denree.setQuantiteParContenant(request.quantiteParContenant());
        if (libelleChange) {
            catalogueDenreeService.enregistrerSiInconnu(libelle);
        }
        denreeRepository.save(denree);
        return toResponse(denree);
    }

    public void supprimerDenree(UUID distributionId, UUID denreeId) {
        validerModifiable(distributionId);
        DenreeDistribution denree = trouverOuEchouer(denreeId, distributionId);
        denreeRepository.delete(denree);
    }

    @Transactional(readOnly = true)
    public List<DenreeResponse> listerDenrees(UUID distributionId) {
        distributionQueryPort.trouverDistribution(distributionId);
        return denreeRepository.findByDistributionIdOrderByDateCreationAsc(distributionId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public DotationResponse calculerDotation(UUID distributionId, String baseParam) {
        DistributionQueryPort.DistributionInfo distrib =
            distributionQueryPort.trouverDistribution(distributionId);

        // Utilise la base specifiee en param ou celle de la distribution par defaut
        String base = (baseParam != null && !baseParam.isBlank())
            ? baseParam.toUpperCase()
            : distrib.baseRepartition();

        int nbBeneficiaires = "PRESENTS".equals(base)
            ? inscriptionQueryPort.compterBeneficiairesPresents(distributionId)
            : inscriptionQueryPort.compterBeneficiairesInscrits(distributionId);

        List<DenreeDistribution> denrees =
            denreeRepository.findByDistributionIdOrderByDateCreationAsc(distributionId);

        List<DotationDenreeDto> dotations = denrees.stream()
            .map(d -> calculerDotationDenree(d, nbBeneficiaires))
            .toList();

        return new DotationResponse(distributionId, base, nbBeneficiaires, dotations);
    }

    // RG8 : calcul de dotation par beneficiaire.
    // dotation = arrondi a l'inferieur au palier de total / nb, plancher d'un palier ;
    // penurie quand chacun ne peut pas recevoir un palier. Palier 1 a l'unite et a la piece,
    // 0,5 au poids et au volume (precision sur l'arrondi, section 4.7).
    static DotationDenreeDto calculerDotationDenree(DenreeDistribution denree, int nbBeneficiaires) {
        double total = denree.quantiteTotale();
        double palier = palier(denree.getUnite());

        // Personne a servir (aucun inscrit ou aucun present) : pas de penurie, tout reste.
        if (nbBeneficiaires <= 0) {
            return new DotationDenreeDto(
                denree.getId(),
                denree.getLibelle(),
                denree.getUnite().name(),
                denree.getNombreContenants(),
                denree.getQuantiteParContenant(),
                total,
                0,
                total,
                false,
                0
            );
        }

        double dotationBrute = arrondirAuPalier(total / nbBeneficiaires, palier);
        boolean penurie = dotationBrute < palier;

        if (penurie) {
            // Chaque personne pouvant etre servie recoit un palier (plancher)
            int nbPeutRecevoir = (int) arrondirAuPalier(total / palier, 1);
            double reste = arrondirQuantite(total - nbPeutRecevoir * palier);
            return new DotationDenreeDto(
                denree.getId(),
                denree.getLibelle(),
                denree.getUnite().name(),
                denree.getNombreContenants(),
                denree.getQuantiteParContenant(),
                total,
                palier,
                reste,
                true,
                nbPeutRecevoir
            );
        }

        double reste = arrondirQuantite(total - nbBeneficiaires * dotationBrute);
        return new DotationDenreeDto(
            denree.getId(),
            denree.getLibelle(),
            denree.getUnite().name(),
            denree.getNombreContenants(),
            denree.getQuantiteParContenant(),
            total,
            dotationBrute,
            reste,
            false,
            nbBeneficiaires
        );
    }

    static double palier(UniteConditionnement unite) {
        return unite == UniteConditionnement.KILOGRAMME || unite == UniteConditionnement.LITRE ? PALIER_VRAC : 1;
    }

    // Marge contre les erreurs d'arrondi des flottants (1.5 / 0.5 = 2.9999...).
    private static double arrondirAuPalier(double valeur, double palier) {
        return Math.floor(valeur / palier + EPSILON) * palier;
    }

    private static double arrondirQuantite(double valeur) {
        return Math.round(valeur * 1000) / 1000.0;
    }

    private void validerModifiable(UUID distributionId) {
        DistributionQueryPort.DistributionInfo distrib = distributionQueryPort.trouverDistribution(distributionId);
        String statut = distrib.statut();
        if ("TERMINEE".equals(statut) || "ANNULEE".equals(statut)) {
            throw new ConflictException(
                "Modification impossible : la distribution est "
                    + ("TERMINEE".equals(statut) ? "terminée." : "annulée.")
            );
        }
    }

    private DenreeDistribution trouverOuEchouer(UUID denreeId, UUID distributionId) {
        return denreeRepository.findByIdAndDistributionId(denreeId, distributionId)
            .orElseThrow(() -> new NotFoundException("Denrée introuvable : " + denreeId));
    }

    private UniteConditionnement parseUnite(String unite) {
        try {
            return UniteConditionnement.valueOf(unite.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Unité invalide : " + unite);
        }
    }

    private DenreeResponse toResponse(DenreeDistribution d) {
        return new DenreeResponse(
            d.getId(),
            d.getDistributionId(),
            d.getLibelle(),
            d.getUnite().name(),
            d.getNombreContenants(),
            d.getQuantiteParContenant(),
            d.quantiteTotale()
        );
    }
}

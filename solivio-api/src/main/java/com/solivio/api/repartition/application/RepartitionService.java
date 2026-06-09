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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RepartitionService {

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

        DenreeDistribution denree = new DenreeDistribution(
            distributionId,
            request.libelle(),
            unite,
            request.nombreContenants(),
            request.quantiteParContenant()
        );
        catalogueDenreeService.enregistrerSiInconnu(request.libelle());
        denreeRepository.save(denree);
        return toResponse(denree);
    }

    public DenreeResponse modifierDenree(UUID distributionId, UUID denreeId, SaisirDenreeRequest request) {
        validerModifiable(distributionId);
        DenreeDistribution denree = trouverOuEchouer(denreeId, distributionId);

        UniteConditionnement unite = parseUnite(request.unite());
        boolean libelleChange = !denree.getLibelle().equalsIgnoreCase(request.libelle());
        denree.setLibelle(request.libelle());
        denree.setUnite(unite);
        denree.setNombreContenants(request.nombreContenants());
        denree.setQuantiteParContenant(request.quantiteParContenant());
        if (libelleChange) {
            catalogueDenreeService.enregistrerSiInconnu(request.libelle());
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
    // dotation = floor(total / nb), plancher 1, penurie si total < nb.
    static DotationDenreeDto calculerDotationDenree(DenreeDistribution denree, int nbBeneficiaires) {
        double total = denree.quantiteTotale();

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
                true,
                0
            );
        }

        double dotationBrute = Math.floor(total / nbBeneficiaires);
        boolean penurie = dotationBrute < 1;

        if (penurie) {
            // Chaque personne pouvant etre servie recoit 1 unite (plancher 1)
            int nbPeutRecevoir = (int) Math.floor(total);
            double reste = total - nbPeutRecevoir;
            return new DotationDenreeDto(
                denree.getId(),
                denree.getLibelle(),
                denree.getUnite().name(),
                denree.getNombreContenants(),
                denree.getQuantiteParContenant(),
                total,
                1,
                reste,
                true,
                nbPeutRecevoir
            );
        }

        double reste = total - nbBeneficiaires * dotationBrute;
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

    private void validerModifiable(UUID distributionId) {
        DistributionQueryPort.DistributionInfo distrib = distributionQueryPort.trouverDistribution(distributionId);
        String statut = distrib.statut();
        if ("TERMINEE".equals(statut) || "ANNULEE".equals(statut)) {
            throw new ConflictException(
                "Modification impossible : la distribution est " + statut.toLowerCase()
            );
        }
    }

    private DenreeDistribution trouverOuEchouer(UUID denreeId, UUID distributionId) {
        return denreeRepository.findByIdAndDistributionId(denreeId, distributionId)
            .orElseThrow(() -> new NotFoundException("Denree introuvable : " + denreeId));
    }

    private UniteConditionnement parseUnite(String unite) {
        try {
            return UniteConditionnement.valueOf(unite.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Unite invalide : " + unite);
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

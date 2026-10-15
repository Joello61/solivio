package com.solivio.api.distribution.application;

import com.solivio.api.distribution.domain.Creneau;
import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.ModeCreneauDistribution;
import com.solivio.api.distribution.infrastructure.web.dto.CreneauResponse;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionResponse;
import com.solivio.api.distribution.infrastructure.web.dto.RemplissageResponse;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import com.solivio.api.shared.inscription.InscriptionQueryPort.Remplissage;
import com.solivio.api.shared.inscription.InscriptionQueryPort.RemplissageCreneau;
import com.solivio.api.shared.lieu.Lieu;
import com.solivio.api.shared.lieu.LieuResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Construit les reponses de distribution avec leur remplissage, lu dans le module inscription. */
@Component
public class ReponseDistribution {

    private static final RemplissageCreneau CRENEAU_VIDE = new RemplissageCreneau(0, 0);

    private final InscriptionQueryPort inscriptionQueryPort;

    public ReponseDistribution(InscriptionQueryPort inscriptionQueryPort) {
        this.inscriptionQueryPort = inscriptionQueryPort;
    }

    DistributionResponse une(Distribution d, List<Creneau> creneaux, boolean vueGestion) {
        return construire(d, creneaux, remplissage(d.getId()), vueGestion);
    }

    List<DistributionResponse> plusieurs(
        List<Distribution> distributions, Map<UUID, List<Creneau>> creneaux, boolean vueGestion
    ) {
        Map<UUID, Remplissage> remplissages = inscriptionQueryPort
            .compterRemplissage(distributions.stream().map(Distribution::getId).toList());
        return distributions.stream()
            .map(d -> construire(d, creneaux.getOrDefault(d.getId(), List.of()),
                remplissages.getOrDefault(d.getId(), Remplissage.VIDE), vueGestion))
            .toList();
    }

    Map<UUID, Remplissage> remplissages(List<UUID> distributionIds) {
        return inscriptionQueryPort.compterRemplissage(distributionIds);
    }

    private Remplissage remplissage(UUID distributionId) {
        return inscriptionQueryPort.compterRemplissage(List.of(distributionId))
            .getOrDefault(distributionId, Remplissage.VIDE);
    }

    static int placesRestantesBeneficiaires(Distribution d, Remplissage r) {
        return Math.max(0, d.getCapaciteBeneficiaires() - r.beneficiairesConfirmes());
    }

    private static DistributionResponse construire(
        Distribution d, List<Creneau> creneaux, Remplissage r, boolean vueGestion
    ) {
        int restantes = placesRestantesBeneficiaires(d, r);
        List<CreneauResponse> creneauxReponse = creneaux.stream()
            .map(c -> creneau(d, c, r.parCreneau().getOrDefault(c.getId(), CRENEAU_VIDE), restantes, vueGestion))
            .toList();
        Integer restantesBenevoles = d.getCapaciteBenevoles() == null
            ? null
            : Math.max(0, d.getCapaciteBenevoles() - r.benevolesConfirmes());
        RemplissageResponse remplissage = vueGestion
            ? new RemplissageResponse(restantes, restantesBenevoles, r.beneficiairesConfirmes(),
                r.beneficiairesEnAttente(), r.benevolesConfirmes(), r.benevolesEnAttente())
            : new RemplissageResponse(restantes, restantesBenevoles, null, null, null, null);
        return new DistributionResponse(
            d.getId(),
            d.getTitre(),
            d.getDescription(),
            lieu(d.getLieu()),
            d.getDate(),
            d.getStatut().name(),
            d.getCapaciteBeneficiaires(),
            d.getCapaciteBenevoles(),
            d.getModeCreneau().name(),
            d.getBaseRepartition().name(),
            d.getMotifAnnulation(),
            d.getDateCreation(),
            creneauxReponse,
            remplissage
        );
    }

    // En creneau unique, la capacite du creneau n'est pas controlee (RG3) : seule
    // compte celle de la distribution.
    private static CreneauResponse creneau(
        Distribution d, Creneau c, RemplissageCreneau r, int restantesDistribution, boolean vueGestion
    ) {
        int restantes = d.getModeCreneau() == ModeCreneauDistribution.CRENEAUX_DECOUPES
            ? Math.min(restantesDistribution, Math.max(0, c.getCapacite() - r.confirmes()))
            : restantesDistribution;
        return new CreneauResponse(c.getId(), c.getHeureDebut(), c.getHeureFin(), c.getCapacite(), restantes,
            vueGestion ? r.confirmes() : null, vueGestion ? r.enAttente() : null);
    }

    private static LieuResponse lieu(Lieu l) {
        if (l == null) {
            return null;
        }
        return new LieuResponse(l.getPlaceId(), l.getNom(), l.getAdresseFormatee(),
            l.getLatitude(), l.getLongitude(), l.getNumeroRue(), l.getVoie(),
            l.getCodePostal(), l.getVille());
    }
}

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RepartitionServiceTest {

    @Mock private DenreeDistributionRepository denreeRepository;
    @Mock private DistributionQueryPort distributionQueryPort;
    @Mock private InscriptionQueryPort inscriptionQueryPort;
    @Mock private CatalogueDenreeService catalogueDenreeService;

    private RepartitionService service;

    private UUID distributionId;

    private DistributionQueryPort.DistributionInfo distribInfo;

    @BeforeEach
    void setUp() {
        service = new RepartitionService(denreeRepository, distributionQueryPort, inscriptionQueryPort, catalogueDenreeService);
        distributionId = UUID.randomUUID();
        distribInfo = new DistributionQueryPort.DistributionInfo(
            distributionId, "EN_COURS", 50, null, "CRENEAU_UNIQUE", "INSCRITS",
            java.time.LocalDate.now()
        );
    }

    // === Tests de saisie ===

    @Test
    void saisirDenree_persisteEtRetourneLaReponse() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribInfo);
        when(denreeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SaisirDenreeRequest req = new SaisirDenreeRequest("Pommes", "KILOGRAMME", 3, 20.0);
        DenreeResponse res = service.saisirDenree(distributionId, req);

        assertThat(res.libelle()).isEqualTo("Pommes");
        assertThat(res.unite()).isEqualTo("KILOGRAMME");
        assertThat(res.nombreContenants()).isEqualTo(3);
        assertThat(res.quantiteParContenant()).isEqualTo(20.0);
        assertThat(res.quantiteTotale()).isCloseTo(60.0, within(0.001));
        verify(denreeRepository).save(any(DenreeDistribution.class));
    }

    @Test
    void saisirDenree_echoueAvecUniteInvalide() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribInfo);

        SaisirDenreeRequest req = new SaisirDenreeRequest("Pommes", "TONNE", 3, 20.0);
        assertThatThrownBy(() -> service.saisirDenree(distributionId, req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Unite invalide");
    }

    @Test
    void saisirDenree_echoueSiDistributionInexistante() {
        when(distributionQueryPort.trouverDistribution(distributionId))
            .thenThrow(new NotFoundException("Distribution introuvable"));

        assertThatThrownBy(() ->
            service.saisirDenree(distributionId, new SaisirDenreeRequest("P", "UNITE", 1, 1.0))
        ).isInstanceOf(NotFoundException.class);
    }

    @Test
    void supprimerDenree_echoueSiDenreeInexistante() {
        UUID denreeId = UUID.randomUUID();
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribInfo);
        when(denreeRepository.findByIdAndDistributionId(denreeId, distributionId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.supprimerDenree(distributionId, denreeId))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void saisirDenree_echoueSiDistributionTerminee() {
        DistributionQueryPort.DistributionInfo distribTerminee = new DistributionQueryPort.DistributionInfo(
            distributionId, "TERMINEE", 50, null, "CRENEAU_UNIQUE", "INSCRITS",
            java.time.LocalDate.now()
        );
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribTerminee);

        assertThatThrownBy(() ->
            service.saisirDenree(distributionId, new SaisirDenreeRequest("Pommes", "KILOGRAMME", 1, 5.0))
        ).isInstanceOf(ConflictException.class)
            .hasMessageContaining("terminee");
    }

    @Test
    void modifierDenree_echoueSiDistributionAnnulee() {
        DistributionQueryPort.DistributionInfo distribAnnulee = new DistributionQueryPort.DistributionInfo(
            distributionId, "ANNULEE", 50, null, "CRENEAU_UNIQUE", "INSCRITS",
            java.time.LocalDate.now()
        );
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribAnnulee);

        assertThatThrownBy(() ->
            service.modifierDenree(distributionId, UUID.randomUUID(),
                new SaisirDenreeRequest("Pommes", "KILOGRAMME", 1, 5.0))
        ).isInstanceOf(ConflictException.class)
            .hasMessageContaining("annulee");
    }

    @Test
    void supprimerDenree_echoueSiDistributionTerminee() {
        DistributionQueryPort.DistributionInfo distribTerminee = new DistributionQueryPort.DistributionInfo(
            distributionId, "TERMINEE", 50, null, "CRENEAU_UNIQUE", "INSCRITS",
            java.time.LocalDate.now()
        );
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribTerminee);

        assertThatThrownBy(() -> service.supprimerDenree(distributionId, UUID.randomUUID()))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("terminee");
    }

    // === Tests du calcul de dotation (RG8) ===

    @Test
    void calculerDotation_casNormal() {
        // 50 kg pour 10 beneficiaires : 5 kg chacun, reste 0
        DenreeDistribution d = denree("Pommes de terre", UniteConditionnement.KILOGRAMME, 2, 25.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 10);

        assertThat(dto.quantiteTotale()).isCloseTo(50.0, within(0.001));
        assertThat(dto.dotation()).isCloseTo(5.0, within(0.001));
        assertThat(dto.reste()).isCloseTo(0.0, within(0.001));
        assertThat(dto.penurie()).isFalse();
        assertThat(dto.nbPeutRecevoir()).isEqualTo(10);
    }

    @Test
    void calculerDotation_avecReste() {
        // 53 kg pour 10 beneficiaires : 5 kg chacun, reste 3
        DenreeDistribution d = denree("Carottes", UniteConditionnement.KILOGRAMME, 1, 53.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 10);

        assertThat(dto.dotation()).isCloseTo(5.0, within(0.001));
        assertThat(dto.reste()).isCloseTo(3.0, within(0.001));
        assertThat(dto.penurie()).isFalse();
    }

    @Test
    void calculerDotation_arrondiInferieur() {
        // 9 kg pour 4 beneficiaires : floor(9/4)=2, reste 1
        DenreeDistribution d = denree("Yaourts", UniteConditionnement.KILOGRAMME, 1, 9.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 4);

        assertThat(dto.dotation()).isCloseTo(2.0, within(0.001));
        assertThat(dto.reste()).isCloseTo(1.0, within(0.001));
        assertThat(dto.penurie()).isFalse();
    }

    @Test
    void calculerDotation_penurieExacte() {
        // 5 kg pour 10 beneficiaires : penurie, seulement 5 personnes servies
        DenreeDistribution d = denree("Oranges", UniteConditionnement.KILOGRAMME, 1, 5.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 10);

        assertThat(dto.penurie()).isTrue();
        assertThat(dto.dotation()).isCloseTo(1.0, within(0.001));
        assertThat(dto.nbPeutRecevoir()).isEqualTo(5);
        assertThat(dto.reste()).isCloseTo(0.0, within(0.001));
    }

    @Test
    void calculerDotation_penurieAvecFraction() {
        // 5.5 kg pour 10 beneficiaires : penurie, 5 personnes recoivent 1 kg, reste 0.5
        DenreeDistribution d = denree("Bananes", UniteConditionnement.KILOGRAMME, 1, 5.5);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 10);

        assertThat(dto.penurie()).isTrue();
        assertThat(dto.dotation()).isCloseTo(1.0, within(0.001));
        assertThat(dto.nbPeutRecevoir()).isEqualTo(5);
        assertThat(dto.reste()).isCloseTo(0.5, within(0.001));
    }

    @Test
    void calculerDotation_penurieUneSeuleUnite() {
        // 1 unite pour 10 beneficiaires : penurie, 1 personne servie
        DenreeDistribution d = denree("Gateau", UniteConditionnement.UNITE, 1, 1.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 10);

        assertThat(dto.penurie()).isTrue();
        assertThat(dto.dotation()).isCloseTo(1.0, within(0.001));
        assertThat(dto.nbPeutRecevoir()).isEqualTo(1);
        assertThat(dto.reste()).isCloseTo(0.0, within(0.001));
    }

    @Test
    void calculerDotation_unSeulBeneficiaire() {
        // 100 kg pour 1 beneficiaire : il recoit tout
        DenreeDistribution d = denree("Farine", UniteConditionnement.KILOGRAMME, 4, 25.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 1);

        assertThat(dto.dotation()).isCloseTo(100.0, within(0.001));
        assertThat(dto.reste()).isCloseTo(0.0, within(0.001));
        assertThat(dto.penurie()).isFalse();
        assertThat(dto.nbPeutRecevoir()).isEqualTo(1);
    }

    @Test
    void calculerDotation_divisionExacte() {
        // 100 kg pour 5 beneficiaires : 20 kg chacun, reste 0
        DenreeDistribution d = denree("Riz", UniteConditionnement.KILOGRAMME, 2, 50.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 5);

        assertThat(dto.dotation()).isCloseTo(20.0, within(0.001));
        assertThat(dto.reste()).isCloseTo(0.0, within(0.001));
        assertThat(dto.penurie()).isFalse();
    }

    @Test
    void calculerDotation_zeroBeneficiaire_nEstPasUnePenurie() {
        // Personne a servir : signaler un stock insuffisant ("0 personne sur 0") n'a pas de sens.
        DenreeDistribution d = denree("Conserves", UniteConditionnement.UNITE, 10, 1.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 0);

        assertThat(dto.penurie()).isFalse();
        assertThat(dto.reste()).isCloseTo(10.0, within(0.001));
        assertThat(dto.dotation()).isCloseTo(0.0, within(0.001));
        assertThat(dto.nbPeutRecevoir()).isEqualTo(0);
    }

    @Test
    void calculerDotation_plusieursCaisses() {
        // 3 caisses de 20 litres pour 9 beneficiaires : floor(60/9)=6, reste 6
        DenreeDistribution d = denree("Lait", UniteConditionnement.LITRE, 3, 20.0);
        DotationDenreeDto dto = RepartitionService.calculerDotationDenree(d, 9);

        assertThat(dto.quantiteTotale()).isCloseTo(60.0, within(0.001));
        assertThat(dto.dotation()).isCloseTo(6.0, within(0.001));
        assertThat(dto.reste()).isCloseTo(6.0, within(0.001));
        assertThat(dto.penurie()).isFalse();
    }

    // === Tests du service calculerDotation avec base ===

    @Test
    void calculerDotation_utiliseBaseInscritsParDefaut() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribInfo);
        when(inscriptionQueryPort.compterBeneficiairesInscrits(distributionId)).thenReturn(20);
        when(denreeRepository.findByDistributionIdOrderByDateCreationAsc(distributionId))
            .thenReturn(List.of());

        DotationResponse res = service.calculerDotation(distributionId, null);

        assertThat(res.base()).isEqualTo("INSCRITS");
        assertThat(res.nbBeneficiaires()).isEqualTo(20);
    }

    @Test
    void calculerDotation_basculeVersPresents() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribInfo);
        when(inscriptionQueryPort.compterBeneficiairesPresents(distributionId)).thenReturn(15);
        when(denreeRepository.findByDistributionIdOrderByDateCreationAsc(distributionId))
            .thenReturn(List.of());

        DotationResponse res = service.calculerDotation(distributionId, "PRESENTS");

        assertThat(res.base()).isEqualTo("PRESENTS");
        assertThat(res.nbBeneficiaires()).isEqualTo(15);
    }

    @Test
    void calculerDotation_retourneDotationsPourToutesDenrees() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribInfo);
        when(inscriptionQueryPort.compterBeneficiairesInscrits(distributionId)).thenReturn(10);
        when(denreeRepository.findByDistributionIdOrderByDateCreationAsc(distributionId))
            .thenReturn(List.of(
                denree("Pommes", UniteConditionnement.KILOGRAMME, 2, 25.0),
                denree("Yaourts", UniteConditionnement.PIECE, 5, 12.0)
            ));

        DotationResponse res = service.calculerDotation(distributionId, null);

        assertThat(res.denrees()).hasSize(2);
        assertThat(res.denrees().get(0).libelle()).isEqualTo("Pommes");
        assertThat(res.denrees().get(0).dotation()).isCloseTo(5.0, within(0.001));
        assertThat(res.denrees().get(1).libelle()).isEqualTo("Yaourts");
        assertThat(res.denrees().get(1).dotation()).isCloseTo(6.0, within(0.001));
    }

    // --- helpers ---

    private DenreeDistribution denree(
        String libelle, UniteConditionnement unite, int contenants, double qteParContenant
    ) {
        return new DenreeDistribution(distributionId, libelle, unite, contenants, qteParContenant);
    }
}

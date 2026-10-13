package com.solivio.api.distribution.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DistributionCycleTest {

    private static Distribution distribution() {
        return new Distribution("Distribution", null, null, LocalDate.now().plusDays(3), 10, null,
            ModeCreneauDistribution.CRENEAU_UNIQUE, UUID.randomUUID());
    }

    @Test
    void reactiver_rendLeStatutPublieEtEffaceLeMotif() {
        Distribution d = distribution();
        d.transitionnerVers(StatutDistribution.PUBLIEE, null);
        d.transitionnerVers(StatutDistribution.ANNULEE, "Erreur");

        assertThat(d.reactiver()).isEqualTo(StatutDistribution.PUBLIEE);
        assertThat(d.getMotifAnnulation()).isNull();
    }

    @Test
    void reactiver_unBrouillonAnnuleResteBrouillon() {
        Distribution d = distribution();
        d.transitionnerVers(StatutDistribution.ANNULEE, "Doublon");

        assertThat(d.reactiver()).isEqualTo(StatutDistribution.BROUILLON);
    }

    @Test
    void reactiver_uneDistributionDemarreeAnnuleeRedevientPubliee() {
        Distribution d = distribution();
        d.transitionnerVers(StatutDistribution.PUBLIEE, null);
        d.transitionnerVers(StatutDistribution.EN_COURS, null);
        d.transitionnerVers(StatutDistribution.ANNULEE, "Erreur");

        assertThat(d.reactiver()).isEqualTo(StatutDistribution.PUBLIEE);
    }

    @Test
    void annulerDemarrage_seulementDepuisEnCours() {
        Distribution d = distribution();
        d.transitionnerVers(StatutDistribution.PUBLIEE, null);
        assertThatThrownBy(d::annulerDemarrage).isInstanceOf(IllegalStateException.class);

        d.transitionnerVers(StatutDistribution.EN_COURS, null);
        d.annulerDemarrage();
        assertThat(d.getStatut()).isEqualTo(StatutDistribution.PUBLIEE);
        assertThatThrownBy(d::reactiver).isInstanceOf(IllegalStateException.class);
    }
}

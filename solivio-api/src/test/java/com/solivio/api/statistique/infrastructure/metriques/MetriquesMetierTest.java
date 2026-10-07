package com.solivio.api.statistique.infrastructure.metriques;

import com.solivio.api.distribution.events.DistributionTerminee;
import com.solivio.api.inscription.events.DesistementTardifBenevole;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MetriquesMetierTest {

    private final SimpleMeterRegistry registry = new SimpleMeterRegistry();
    private final MetriquesMetier metriques = new MetriquesMetier(registry);

    @Test
    void chaqueEvenement_incrementeSonCompteur() {
        metriques.on(new DistributionTerminee(UUID.randomUUID(), LocalDate.now()));
        metriques.on(new DistributionTerminee(UUID.randomUUID(), LocalDate.now()));
        metriques.on(new DesistementTardifBenevole(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));

        assertThat(registry.get("solivio.distributions.terminees").counter().count()).isEqualTo(2);
        assertThat(registry.get("solivio.desistements.tardifs").counter().count()).isEqualTo(1);
        assertThat(registry.get("solivio.inscriptions.confirmees").counter().count()).isZero();
    }
}

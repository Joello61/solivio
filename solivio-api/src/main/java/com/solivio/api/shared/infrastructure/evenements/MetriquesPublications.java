package com.solivio.api.shared.infrastructure.evenements;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Etat du registre des evenements internes, pour alerter quand des emails ou
 * des statistiques restent en attente : publications non terminees et en echec.
 * Les jauges sont evaluees a chaque collecte de Prometheus.
 */
@Component
public class MetriquesPublications {

    private final JdbcTemplate jdbcTemplate;

    public MetriquesPublications(JdbcTemplate jdbcTemplate, MeterRegistry registry) {
        this.jdbcTemplate = jdbcTemplate;
        Gauge.builder("solivio.evenements.publications.incompletes", this, MetriquesPublications::incompletes)
            .description("Publications d'evenements internes pas encore traitees")
            .register(registry);
        Gauge.builder("solivio.evenements.publications.echouees", this, MetriquesPublications::echouees)
            .description("Publications d'evenements internes en echec")
            .register(registry);
    }

    double incompletes() {
        return compter("SELECT count(*) FROM event_publication WHERE completion_date IS NULL");
    }

    double echouees() {
        return compter("SELECT count(*) FROM event_publication WHERE status = 'FAILED'");
    }

    private double compter(String sql) {
        Long nombre = jdbcTemplate.queryForObject(sql, Long.class);
        return nombre == null ? 0 : nombre;
    }
}

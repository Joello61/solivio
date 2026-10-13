package com.solivio.api.shared.verrou;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Serialise ce qui touche aux places d'une meme distribution : inscriptions,
 * desinscriptions, promotions (module inscription) et modification de la
 * distribution (module distribution). Sans verrou, deux operations simultanees
 * lisaient le meme nombre de places et depassaient la capacite.
 * Verrou consultatif PostgreSQL sur l'identifiant de la distribution, libere a
 * la fin de la transaction : aucun module ne touche aux tables de l'autre.
 */
@Component
public class VerrouDistribution {

    private final JdbcTemplate jdbcTemplate;

    public VerrouDistribution(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void verrouiller(UUID distributionId) {
        jdbcTemplate.query("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))",
            rs -> null, distributionId.toString());
    }
}

package com.solivio.api.inscription.infrastructure.persistence;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Serialise les inscriptions d'une meme distribution. Sans verrou, deux
 * inscriptions simultanees lisaient le meme nombre de places et depassaient la
 * capacite, ou recevaient le meme rang en liste d'attente.
 * Verrou consultatif PostgreSQL, libere a la fin de la transaction : il ne
 * touche pas aux tables du module distribution.
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

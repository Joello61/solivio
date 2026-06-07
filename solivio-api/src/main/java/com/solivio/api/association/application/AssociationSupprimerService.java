package com.solivio.api.association.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.shared.exception.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Suppression complete d'une association (RGPD - droit a l'effacement).
 * Supprime le schema tenant et la ligne public.association.
 * Operation irreversible : a declencher uniquement apres confirmation explicite.
 */
@Service
@Transactional
public class AssociationSupprimerService {

    private static final Logger log = LoggerFactory.getLogger(AssociationSupprimerService.class);

    private final AssociationRepository associationRepository;
    private final JdbcTemplate jdbcTemplate;

    public AssociationSupprimerService(
        AssociationRepository associationRepository,
        JdbcTemplate jdbcTemplate
    ) {
        this.associationRepository = associationRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public void supprimer(String tenantSlug) {
        Association asso = associationRepository.findBySlug(tenantSlug)
            .orElseThrow(() -> new NotFoundException("Association introuvable : " + tenantSlug));

        String schema = TenantProvisioningService.schemaName(tenantSlug);
        log.warn("Suppression complete de l'association {} (schema : {})", tenantSlug, schema);

        // Suppression du schema tenant et de toutes ses donnees
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");

        // Suppression de l'enregistrement global (cascade sur public.affiliation)
        associationRepository.delete(asso);
        log.info("Association {} supprimee.", tenantSlug);
    }
}

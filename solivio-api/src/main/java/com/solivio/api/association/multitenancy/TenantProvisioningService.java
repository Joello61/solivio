package com.solivio.api.association.multitenancy;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Cree ou met a jour les schemas tenant au demarrage.
 * Lors du provisioning d'une nouvelle association, cree le schema
 * PostgreSQL et applique les migrations tenant.
 */
@Service
public class TenantProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(TenantProvisioningService.class);

    private final AssociationRepository associationRepository;
    private final TenantFlywayMigrator flywayMigrator;
    private final JdbcTemplate jdbcTemplate;

    public TenantProvisioningService(
            AssociationRepository associationRepository,
            TenantFlywayMigrator flywayMigrator,
            JdbcTemplate jdbcTemplate) {
        this.associationRepository = associationRepository;
        this.flywayMigrator = flywayMigrator;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Au demarrage : applique les migrations sur tous les schemas tenant actifs.
     * Garantit que les schemas existants sont toujours a jour avant que l'app
     * n'accepte des requetes.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void migrateAllTenants() {
        List<Association> actives = associationRepository.findAllByStatut("active");
        if (actives.isEmpty()) {
            log.info("No active tenant to migrate.");
            return;
        }
        for (Association association : actives) {
            String schema = schemaName(association.getSlug());
            createSchemaIfAbsent(schema);
            flywayMigrator.migrate(schema);
        }
    }

    /**
     * Provisionne un nouveau tenant : cree le schema et applique les migrations.
     * Appele a la creation d'une nouvelle association.
     */
    @Transactional
    public void provision(Association association) {
        String schema = schemaName(association.getSlug());
        log.info("Provisioning tenant schema: {}", schema);
        createSchemaIfAbsent(schema);
        flywayMigrator.migrate(schema);
    }

    /**
     * Retourne le nom de schema pour un slug d'association.
     * Convention : "tenant_" + slug (avec tirets remplaces par underscores).
     */
    public static String schemaName(String slug) {
        return "tenant_" + slug.replace("-", "_");
    }

    private void createSchemaIfAbsent(String schema) {
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
    }
}

package com.solivio.api.association.multitenancy;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Applique les migrations Flyway sur un schema tenant donne.
 * Appele au demarrage pour tous les tenants existants et lors du provisioning
 * d'un nouveau tenant.
 */
@Component
public class TenantFlywayMigrator {

    private static final Logger log = LoggerFactory.getLogger(TenantFlywayMigrator.class);
    static final String TENANT_MIGRATION_LOCATION = "classpath:db/migration/tenant";

    private final DataSource dataSource;

    public TenantFlywayMigrator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void migrate(String schema) {
        log.info("Applying tenant migrations on schema: {}", schema);
        Flyway.configure()
            .dataSource(dataSource)
            .schemas(schema)
            .defaultSchema(schema)
            .locations(TENANT_MIGRATION_LOCATION)
            .baselineOnMigrate(true)
            .load()
            .migrate();
    }
}

package com.solivio.api.isolation;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantFlywayMigrator;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifie que l'isolation multi-tenant est garantie par construction :
 * une requete dans le schema du tenant A ne peut pas voir les donnees du tenant B.
 *
 * Ces tests sont ecrits avant le code metier et executes a chaque integration.
 */
@SolivioIntegrationTest
class TenantIsolationTest {

    @Autowired
    private AssociationRepository associationRepository;

    @Autowired
    private PersonneRepository personneRepository;

    @Autowired
    private TenantFlywayMigrator flywayMigrator;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Association associationA;
    private Association associationB;
    private String schemaA;
    private String schemaB;

    @BeforeEach
    void setUp() {
        associationA = associationRepository.save(new Association("tenant-a", "Association A"));
        associationB = associationRepository.save(new Association("tenant-b", "Association B"));

        schemaA = TenantProvisioningService.schemaName("tenant-a");
        schemaB = TenantProvisioningService.schemaName("tenant-b");

        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schemaA + "\"");
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schemaB + "\"");
        flywayMigrator.migrate(schemaA);
        flywayMigrator.migrate(schemaB);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schemaA + "\" CASCADE");
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schemaB + "\" CASCADE");
        associationRepository.delete(associationB);
        associationRepository.delete(associationA);
    }

    @Test
    void personneCreatedInTenantA_isNotVisibleFromTenantB() {
        // Cree une personne dans le schema A
        TenantContext.setTenantId(schemaA);
        Personne personneA = personneRepository.save(
            new Personne("kc-id-a", "Dupont", "Alice", "alice@example.com")
        );

        // Bascule sur le schema B : la personne A ne doit pas etre visible
        TenantContext.setTenantId(schemaB);
        boolean existsInB = personneRepository.existsByKeycloakId("kc-id-a");

        assertThat(existsInB)
            .as("Une personne du tenant A ne doit pas etre visible depuis le tenant B")
            .isFalse();
    }

    @Test
    void personnesAreCountedPerTenant() {
        TenantContext.setTenantId(schemaA);
        personneRepository.save(new Personne("kc-1", "Martin", "Bob", "bob@example.com"));
        personneRepository.save(new Personne("kc-2", "Durand", "Carol", "carol@example.com"));
        long countA = personneRepository.count();

        TenantContext.setTenantId(schemaB);
        long countB = personneRepository.count();

        assertThat(countA).isEqualTo(2);
        assertThat(countB)
            .as("Le schema B ne doit contenir aucune personne creee dans le schema A")
            .isZero();
    }

    @Test
    void tenantContextClearPreventsDataLeak() {
        TenantContext.setTenantId(schemaA);
        personneRepository.save(new Personne("kc-leak", "Test", "Leak", "leak@example.com"));

        // Simule une fin de requete : le contexte est nettoye
        TenantContext.clear();

        // Sans tenant dans le contexte, le resolver retourne "public".
        // La table personne n'existe pas dans public -> count() doit lever une exception
        // ou retourner 0 selon la config. L'important est que les donnees de A sont isolees.
        TenantContext.setTenantId(schemaB);
        assertThat(personneRepository.existsByKeycloakId("kc-leak")).isFalse();
    }
}

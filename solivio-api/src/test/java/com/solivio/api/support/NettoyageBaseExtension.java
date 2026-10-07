package com.solivio.api.support;

import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;

/**
 * Remet la base dans son etat initial avant chaque test d'integration.
 * Toutes les classes partagent un seul schema et un contexte Spring en cache :
 * sans ce nettoyage, les donnees d'un test fuiraient dans les suivants.
 */
public class NettoyageBaseExtension implements BeforeEachCallback {

    // association n'est pas videe : sa ligne unique est creee par la migration V2.
    private static final String TABLES_A_VIDER = """
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN ('flyway_schema_history', 'association')
        """;

    @Override
    public void beforeEach(ExtensionContext context) {
        JdbcTemplate jdbc = SpringExtension.getApplicationContext(context).getBean(JdbcTemplate.class);
        List<String> tables = jdbc.queryForList(TABLES_A_VIDER, String.class);
        if (!tables.isEmpty()) {
            jdbc.execute("TRUNCATE TABLE " + String.join(", ", tables) + " CASCADE");
        }
        jdbc.update("""
            UPDATE association SET nom = 'Linkee Toulouse', logo_url = NULL,
                couleur_primaire = '#16513F', couleur_secondaire = '#1E6B52',
                fuseau_horaire = 'Europe/Paris', frequence_max_par_semaine = NULL,
                contact_email = NULL, contact_telephone = NULL
            """);
    }
}

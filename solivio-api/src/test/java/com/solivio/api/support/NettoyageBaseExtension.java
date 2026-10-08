package com.solivio.api.support;

import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.context.ApplicationContext;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.time.Duration;
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

    private static final Duration ATTENTE_MAX_ASYNCHRONE = Duration.ofSeconds(10);
    private static final int ESSAIS_VIDAGE = 3;

    @Override
    public void beforeEach(ExtensionContext context) throws InterruptedException {
        ApplicationContext applicationContext = SpringExtension.getApplicationContext(context);
        JdbcTemplate jdbc = applicationContext.getBean(JdbcTemplate.class);
        attendreLesTraitementsAsynchrones(applicationContext);
        viderLesTables(jdbc);
        jdbc.update("""
            UPDATE association SET nom = 'Linkee Toulouse', logo_url = NULL,
                couleur_primaire = '#16513F', couleur_secondaire = '#1E6B52',
                fuseau_horaire = 'Europe/Paris', frequence_max_par_semaine = NULL,
                contact_email = NULL, contact_telephone = NULL
            """);
    }

    // Un ecouteur d'evenements internes lance par le test precedent peut encore tenir
    // une transaction : le TRUNCATE, qui exige un verrou exclusif sur toutes les tables,
    // finissait alors en interblocage (constate en CI).
    private static void attendreLesTraitementsAsynchrones(ApplicationContext applicationContext)
            throws InterruptedException {
        long limite = System.nanoTime() + ATTENTE_MAX_ASYNCHRONE.toNanos();
        for (ThreadPoolTaskExecutor executeur
                : applicationContext.getBeansOfType(ThreadPoolTaskExecutor.class).values()) {
            while (estOccupe(executeur) && System.nanoTime() < limite) {
                Thread.sleep(20);
            }
        }
    }

    private static boolean estOccupe(ThreadPoolTaskExecutor executeur) {
        return executeur.getActiveCount() > 0 || executeur.getQueueSize() > 0;
    }

    // Filet de securite : une tache planifiee peut aussi croiser le vidage.
    private static void viderLesTables(JdbcTemplate jdbc) throws InterruptedException {
        List<String> tables = jdbc.queryForList(TABLES_A_VIDER, String.class);
        if (tables.isEmpty()) {
            return;
        }
        String truncate = "TRUNCATE TABLE " + String.join(", ", tables) + " CASCADE";
        for (int essai = 1; ; essai++) {
            try {
                jdbc.execute(truncate);
                return;
            } catch (PessimisticLockingFailureException e) {
                if (essai == ESSAIS_VIDAGE) {
                    throw e;
                }
                Thread.sleep(100L * essai);
            }
        }
    }
}

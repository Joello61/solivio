package com.solivio.api.notification.application;

import com.solivio.api.notification.domain.Notification;
import com.solivio.api.notification.domain.TypeEvenementNotification;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SolivioIntegrationTest
class NotificationTraceurIntegrationTest {

    private static final TypeEvenementNotification TYPE = TypeEvenementNotification.RAPPEL_VEILLE;

    @Autowired private NotificationTraceur traceur;
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private JdbcTemplate jdbcTemplate;

    private final UUID personneId = UUID.randomUUID();
    private final UUID distributionId = UUID.randomUUID();
    private final String cle = "RAPPEL_VEILLE:" + distributionId;

    @Test
    void dejaEnvoyee_vraiSeulementApresUnEnvoiReussiPourLaMemePersonne() {
        traceur.tracer(Notification.echec(cle, personneId, distributionId, TYPE, "Rappel", "SMTP KO"));
        assertThat(dejaEnvoyee(cle, personneId)).isFalse();

        traceur.tracer(Notification.envoye(cle, personneId, distributionId, TYPE, "Rappel"));

        assertThat(dejaEnvoyee(cle, personneId)).isTrue();
        assertThat(dejaEnvoyee(cle, UUID.randomUUID())).isFalse();
        assertThat(dejaEnvoyee(null, personneId)).isFalse();
    }

    // L'ecouteur leve une exception en fin de traitement pour etre relance :
    // les traces deja ecrites ne doivent pas partir avec son rollback.
    @Test
    void tracer_survitAuRollbackDeLaTransactionAppelante() {
        transactionTemplate.executeWithoutResult(status -> {
            traceur.tracer(Notification.envoye(cle, personneId, distributionId, TYPE, "Rappel"));
            status.setRollbackOnly();
        });

        assertThat(jdbcTemplate.queryForObject(
            "SELECT count(*) FROM notification WHERE cle_idempotence = ?", Integer.class, cle)).isEqualTo(1);
    }

    @Test
    void indexUnique_refuseUnSecondEnvoiReussiPourLaMemeCle() {
        traceur.tracer(Notification.envoye(cle, personneId, distributionId, TYPE, "Rappel"));

        assertThatThrownBy(() -> traceur.tracer(Notification.envoye(cle, personneId, distributionId, TYPE, "Rappel")))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void dejaEnvoyee_exigeLaTransactionDeLEcouteur() {
        assertThatThrownBy(() -> traceur.dejaEnvoyee(cle, personneId))
            .isInstanceOf(IllegalTransactionStateException.class);
    }

    private boolean dejaEnvoyee(String cleIdempotence, UUID personne) {
        return Boolean.TRUE.equals(transactionTemplate.execute(status -> traceur.dejaEnvoyee(cleIdempotence, personne)));
    }
}

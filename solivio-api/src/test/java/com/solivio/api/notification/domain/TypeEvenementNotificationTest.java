package com.solivio.api.notification.domain;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class TypeEvenementNotificationTest {

    @Test
    void chaqueTypeTientDansLaColonne() {
        // Un type trop long faisait echouer l'insertion de la trace, donc l'envoi.
        assertThat(Arrays.stream(TypeEvenementNotification.values()).map(Enum::name))
            .allSatisfy(nom -> assertThat(nom).hasSizeLessThanOrEqualTo(Notification.LONGUEUR_TYPE_EVENEMENT));
    }
}

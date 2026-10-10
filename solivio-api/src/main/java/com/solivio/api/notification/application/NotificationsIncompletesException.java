package com.solivio.api.notification.application;

import com.solivio.api.notification.domain.TypeEvenementNotification;

import java.util.UUID;

/**
 * Levee en fin de traitement quand au moins un envoi a echoue : la publication
 * reste en echec dans le registre et MaintenancePublicationsJob la relance.
 * Les destinataires deja servis sont alors sautes grace a la cle d'idempotence.
 */
public class NotificationsIncompletesException extends RuntimeException {

    public NotificationsIncompletesException(TypeEvenementNotification type, UUID referenceId, int echecs) {
        super(echecs + " notification(s) " + type + " en echec pour " + referenceId);
    }
}

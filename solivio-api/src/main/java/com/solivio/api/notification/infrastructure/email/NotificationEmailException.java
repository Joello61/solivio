package com.solivio.api.notification.infrastructure.email;

/**
 * Levee quand l'envoi SMTP echoue, pour distinguer les echecs techniques
 * des erreurs de donnees dans NotificationService.
 */
public class NotificationEmailException extends RuntimeException {

    public NotificationEmailException(String destinataire, String sujet, Throwable cause) {
        super("Echec envoi email a " + destinataire + " (" + sujet + ")", cause);
    }
}

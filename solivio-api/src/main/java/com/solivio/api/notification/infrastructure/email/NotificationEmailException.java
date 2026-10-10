package com.solivio.api.notification.infrastructure.email;

import com.solivio.api.shared.journal.DonneesPersonnelles;

/**
 * Levee quand l'envoi SMTP echoue, pour distinguer les echecs techniques
 * des erreurs de donnees dans NotificationService. Le message est enregistre
 * dans notification.erreur : il ne contient ni le destinataire ni la cause
 * brute, qui le cite souvent.
 */
public class NotificationEmailException extends RuntimeException {

    public NotificationEmailException(Throwable cause) {
        super("Echec envoi email : " + DonneesPersonnelles.resumerErreur(cause));
    }
}

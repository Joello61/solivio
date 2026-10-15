package com.solivio.api.shared.exception;

/**
 * Connexion refusee tant que l'adresse email n'est pas verifiee : repondu en 403
 * avec un code dedie, pour que le client propose la saisie du code. Levee seulement
 * apres un mot de passe correct, sans quoi elle revelerait l'existence du compte.
 */
public class EmailNonVerifieException extends RuntimeException {

    public EmailNonVerifieException() {
        super("Votre adresse email n'a pas encore été vérifiée.");
    }
}

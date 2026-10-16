package com.solivio.api.shared.identity;

/**
 * Port pour envoyer a une personne sans compte le lien de creation de compte,
 * par exemple a un visiteur venu aider le jour d'une distribution.
 */
public interface LienInscriptionPort {

    void envoyerLienInscription(String email);
}

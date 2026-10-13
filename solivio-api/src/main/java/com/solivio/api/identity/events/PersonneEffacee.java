package com.solivio.api.identity.events;

import java.util.UUID;

/**
 * Les donnees d'une personne ont ete effacees (droit a l'effacement RGPD) : chaque
 * module remplace les copies de son nom par les valeurs anonymes ci-dessous.
 */
public record PersonneEffacee(UUID personneId) {

    public static final String NOM_ANONYME = "Personne";
    public static final String PRENOM_ANONYME = "supprimée";
}

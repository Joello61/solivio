package com.solivio.api.shared.identity;

import java.util.UUID;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface PersonneQueryPort {

    PersonneInfo trouverPersonne(String email);

    PersonneContactInfo trouverPersonneParId(UUID id);

    /**
     * Retourne les informations de contact des membres actifs ayant au moins un des
     * roles indiques, chaque personne une seule fois meme si elle cumule ces roles.
     */
    List<PersonneContactInfo> trouverContactsParRoles(String... nomsRoles);

    /**
     * Recherche de membres par nom ou prenom pour l'ajout ad hoc au pointage.
     * Limitee a 10 resultats. Exclut les personnes supprimees.
     */
    List<PersonneContactInfo> rechercherParNomOuPrenom(String terme);

    /**
     * Emails des personnes demandees, en une seule requete. Les identifiants
     * inconnus sont absents de la table retournee.
     */
    Map<UUID, String> trouverEmailsParIds(Collection<UUID> personneIds);

    record PersonneInfo(UUID id, String nom, String prenom) {}

    record PersonneContactInfo(UUID id, String email, String prenom, String nom) {}
}

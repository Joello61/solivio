package com.solivio.api.shared.identity;

import java.util.UUID;

import java.util.List;

public interface PersonneQueryPort {

    PersonneInfo trouverPersonne(String email);

    PersonneContactInfo trouverPersonneParId(UUID id);

    /**
     * Retourne les informations de contact de toutes les personnes ayant le role indique.
     * Utilise pour notifier les coordinateurs en cas de desistement tardif.
     */
    List<PersonneContactInfo> trouverContactsParRole(String nomRole);

    record PersonneInfo(UUID id, String nom, String prenom) {}

    record PersonneContactInfo(UUID id, String email, String prenom, String nom) {}
}

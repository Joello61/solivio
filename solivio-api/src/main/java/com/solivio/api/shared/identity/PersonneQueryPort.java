package com.solivio.api.shared.identity;

import java.util.UUID;

public interface PersonneQueryPort {

    PersonneInfo trouverPersonne(String email);

    PersonneContactInfo trouverPersonneParId(UUID id);

    record PersonneInfo(UUID id, String nom, String prenom) {}

    record PersonneContactInfo(UUID id, String email, String prenom, String nom) {}
}

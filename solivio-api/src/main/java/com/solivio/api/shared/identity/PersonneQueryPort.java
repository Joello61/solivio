package com.solivio.api.shared.identity;

import java.util.UUID;

public interface PersonneQueryPort {

    PersonneInfo trouverPersonne(String email);

    record PersonneInfo(UUID id, String nom, String prenom) {}
}

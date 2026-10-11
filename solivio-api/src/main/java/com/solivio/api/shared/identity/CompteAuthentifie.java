package com.solivio.api.shared.identity;

import java.util.UUID;

/**
 * Principal d'une requete authentifiee, vu des autres modules : seul l'identifiant
 * du compte est expose (par exemple au journal d'audit).
 */
public interface CompteAuthentifie {

    UUID getCompteId();
}

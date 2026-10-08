package com.solivio.api.shared.web;

import org.slf4j.MDC;

/**
 * Cles du contexte de journalisation d'une requete HTTP, alimente par
 * RequestIdFilter (identifiant de requete) et par l'authentification (compte).
 */
public final class ContexteRequete {

    public static final String HEADER_REQUEST_ID = "X-Request-Id";
    public static final String MDC_REQUEST_ID = "request_id";
    public static final String MDC_ACCOUNT_ID = "account_id";

    private ContexteRequete() {
    }

    public static String requestIdCourant() {
        return MDC.get(MDC_REQUEST_ID);
    }
}

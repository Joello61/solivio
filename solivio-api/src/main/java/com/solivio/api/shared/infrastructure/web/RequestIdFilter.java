package com.solivio.api.shared.infrastructure.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

import static com.solivio.api.shared.web.ContexteRequete.HEADER_REQUEST_ID;
import static com.solivio.api.shared.web.ContexteRequete.MDC_ACCOUNT_ID;
import static com.solivio.api.shared.web.ContexteRequete.MDC_REQUEST_ID;

/**
 * Attribue un identifiant a chaque requete, place dans le MDC des journaux,
 * renvoye dans l'en-tete de reponse et repris dans le corps des erreurs.
 * Execute avant la chaine de securite pour couvrir aussi ses refus.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    // Un identifiant fourni par le client n'est repris que s'il ne peut pas
    // polluer les journaux (pas d'espace, pas de retour a la ligne).
    private static final Pattern ID_ACCEPTABLE = Pattern.compile("[A-Za-z0-9-]{8,64}");

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String requestId = identifiant(request.getHeader(HEADER_REQUEST_ID));
        MDC.put(MDC_REQUEST_ID, requestId);
        response.setHeader(HEADER_REQUEST_ID, requestId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_REQUEST_ID);
            MDC.remove(MDC_ACCOUNT_ID);
        }
    }

    private static String identifiant(String fourni) {
        if (fourni != null && ID_ACCEPTABLE.matcher(fourni).matches()) {
            return fourni;
        }
        return UUID.randomUUID().toString();
    }
}

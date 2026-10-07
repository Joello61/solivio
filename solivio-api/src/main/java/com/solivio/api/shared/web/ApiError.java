package com.solivio.api.shared.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;

/**
 * Enveloppe unique des reponses d'erreur de l'API :
 * {"error": {"code", "message", "details", "request_id"}}.
 * Le code est stable et destine au client, le message est lisible par l'utilisateur.
 */
public record ApiError(Body error) {

    public record Body(
            String code,
            String message,
            @JsonInclude(JsonInclude.Include.NON_NULL) Object details,
            @JsonProperty("request_id") String requestId) {
    }

    public record ChampInvalide(String champ, String message) {
    }

    public static ApiError of(String code, String message) {
        return of(code, message, null);
    }

    public static ApiError of(String code, String message, Object details) {
        return new ApiError(new Body(code, message, details, ContexteRequete.requestIdCourant()));
    }

    // Pour les filtres de la chaine de securite, executes hors du DispatcherServlet
    // et donc hors de GlobalExceptionHandler.
    public static void ecrire(HttpServletResponse response, HttpStatus statut, String code, String message)
            throws IOException {
        response.setStatus(statut.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        JsonMapper.shared().writeValue(response.getWriter(), of(code, message));
    }
}

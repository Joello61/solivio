package com.solivio.api.shared.infrastructure.web;

import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.EmailNonVerifieException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.exception.TropDeTentativesException;
import com.solivio.api.shared.web.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

/**
 * Traduit les exceptions en reponses HTTP au format {@link ApiError}.
 * Un message d'erreur n'expose jamais de trace, de requete SQL ni de donnee personnelle.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
        return reponse(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email ou mot de passe incorrect.");
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabled(DisabledException ex) {
        return reponse(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Votre compte est desactive.");
    }

    @ExceptionHandler(EmailNonVerifieException.class)
    public ResponseEntity<ApiError> handleEmailNonVerifie(EmailNonVerifieException ex) {
        return reponse(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", ex.getMessage());
    }

    // Spring Security 7 : AuthorizationDeniedException est une RuntimeException qui echappe
    // a ExceptionTranslationFilter quand elle remonte via le DispatcherServlet.
    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ApiError> handleAuthorizationDenied(AuthorizationDeniedException ex) {
        return reponse(HttpStatus.FORBIDDEN, "FORBIDDEN",
            "Vous n'avez pas les droits necessaires pour cette operation.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        return reponse(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST",
            "Le corps de la requete est mal forme ou contient des valeurs invalides.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex) {
        log.debug("Echec d'authentification : {}", ex.getMessage());
        return reponse(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Authentification requise.");
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NotFoundException ex) {
        return reponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(TropDeTentativesException.class)
    public ResponseEntity<ApiError> handleTropDeTentatives(TropDeTentativesException ex) {
        return reponse(HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_ATTEMPTS", ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> handleConflict(ConflictException ex) {
        return reponse(HttpStatus.CONFLICT, ex.getCode(), ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        return reponse(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(MissingServletRequestParameterException ex) {
        return reponse(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER",
            "Parametre obligatoire manquant : " + ex.getParameterName());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        List<ApiError.ChampInvalide> champs = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> new ApiError.ChampInvalide(e.getField(), e.getDefaultMessage()))
            .toList();
        String message = champs.stream()
            .map(c -> c.champ() + " : " + c.message())
            .reduce((a, b) -> a + ", " + b)
            .orElse("Donnees invalides.");
        return ResponseEntity.badRequest().body(ApiError.of("VALIDATION_FAILED", message, champs));
    }

    // Exceptions du framework portant deja un statut : route inconnue, methode
    // non supportee, type de contenu refuse, ResponseStatusException.
    @ExceptionHandler({
        ErrorResponseException.class,
        HttpRequestMethodNotSupportedException.class,
        HttpMediaTypeNotSupportedException.class,
        MaxUploadSizeExceededException.class
    })
    public ResponseEntity<ApiError> handleFramework(Exception ex) {
        HttpStatusCode statut = ex instanceof ErrorResponse er ? er.getStatusCode() : HttpStatus.CONTENT_TOO_LARGE;
        if (statut.is5xxServerError()) {
            log.error("Erreur du framework", ex);
            return erreurInterne();
        }
        return ResponseEntity.status(statut).body(ApiError.of(codePourStatut(statut), messagePourStatut(statut)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        log.error("Erreur inattendue non geree", ex);
        return erreurInterne();
    }

    private static ResponseEntity<ApiError> erreurInterne() {
        return reponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Une erreur inattendue s'est produite.");
    }

    private static ResponseEntity<ApiError> reponse(HttpStatus statut, String code, String message) {
        return ResponseEntity.status(statut).body(ApiError.of(code, message));
    }

    private static String codePourStatut(HttpStatusCode statut) {
        return switch (statut.value()) {
            case 404 -> "NOT_FOUND";
            case 405 -> "METHOD_NOT_ALLOWED";
            case 413 -> "PAYLOAD_TOO_LARGE";
            case 415 -> "UNSUPPORTED_MEDIA_TYPE";
            default -> "INVALID_REQUEST";
        };
    }

    private static String messagePourStatut(HttpStatusCode statut) {
        return switch (statut.value()) {
            case 404 -> "Ressource introuvable.";
            case 405 -> "Méthode non autorisée pour cette ressource.";
            case 413 -> "Fichier ou requête trop volumineux.";
            case 415 -> "Type de contenu non supporté.";
            default -> "Requête invalide.";
        };
    }
}

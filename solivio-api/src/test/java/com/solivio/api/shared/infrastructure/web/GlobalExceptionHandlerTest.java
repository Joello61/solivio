package com.solivio.api.shared.infrastructure.web;

import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.web.ApiError;
import com.solivio.api.shared.web.ContexteRequete;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @AfterEach
    void nettoyerMdc() {
        MDC.clear();
    }

    @Test
    void handleBadCredentials_retourne401AvecCodeStable() {
        ResponseEntity<ApiError> reponse = handler.handleBadCredentials(new BadCredentialsException("wrong"));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(reponse.getBody().error().code()).isEqualTo("INVALID_CREDENTIALS");
    }

    @Test
    void handleDisabled_retourne403() {
        ResponseEntity<ApiError> reponse = handler.handleDisabled(new DisabledException("disabled"));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(reponse.getBody().error().message()).contains("desactive");
    }

    @Test
    void handleConflict_reprendLeCodeDuConflit() {
        assertThat(handler.handleConflict(new ConflictException("Deja fait")).getBody().error().code())
            .isEqualTo("CONFLICT");
        ResponseEntity<ApiError> reponse = handler.handleConflict(new ConflictException("FREQUENCY_LIMIT", "Limite"));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(reponse.getBody().error().code()).isEqualTo("FREQUENCY_LIMIT");
    }

    @Test
    void erreur_reprendLeRequestIdDuMdc() {
        MDC.put(ContexteRequete.MDC_REQUEST_ID, "req-12345678");

        ResponseEntity<ApiError> reponse = handler.handleIllegalArgument(new IllegalArgumentException("Date invalide"));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(reponse.getBody().error().message()).isEqualTo("Date invalide");
        assertThat(reponse.getBody().error().requestId()).isEqualTo("req-12345678");
    }

    @Test
    void handleValidation_listeLesChampsInvalides() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult binding = mock(BindingResult.class);
        when(ex.getBindingResult()).thenReturn(binding);
        when(binding.getFieldErrors()).thenReturn(List.of(new FieldError("req", "email", "ne doit pas etre vide")));

        ResponseEntity<ApiError> reponse = handler.handleValidation(ex);

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(reponse.getBody().error().code()).isEqualTo("VALIDATION_FAILED");
        assertThat(reponse.getBody().error().details())
            .isEqualTo(List.of(new ApiError.ChampInvalide("email", "ne doit pas etre vide")));
    }

    @Test
    void routeInconnue_retourne404EtNon500() {
        ResponseEntity<ApiError> reponse = handler.handleFramework(
            new NoResourceFoundException(HttpMethod.GET, "/api/inconnue", "api/inconnue"));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(reponse.getBody().error().code()).isEqualTo("NOT_FOUND");
    }

    @Test
    void fichierTropVolumineux_retourne413() {
        ResponseEntity<ApiError> reponse = handler.handleFramework(new MaxUploadSizeExceededException(2048));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.CONTENT_TOO_LARGE);
        assertThat(reponse.getBody().error().code()).isEqualTo("PAYLOAD_TOO_LARGE");
    }

    @Test
    void erreurServeurDuFramework_masqueLeDetail() {
        ResponseEntity<ApiError> reponse = handler.handleFramework(
            new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "detail interne"));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(reponse.getBody().error().message()).doesNotContain("detail interne");
    }

    @Test
    void erreurInattendue_retourne500SansDetailInterne() {
        ResponseEntity<ApiError> reponse = handler.handleUnexpected(new IllegalStateException("SELECT * FROM compte"));

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(reponse.getBody().error().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(reponse.getBody().error().message()).doesNotContain("SELECT");
    }
}

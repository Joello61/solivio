package com.solivio.api.shared.infrastructure.web;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleBadCredentials_retourne401() {
        ProblemDetail pd = handler.handleBadCredentials(new BadCredentialsException("wrong"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(pd.getTitle()).contains("Identifiants");
    }

    @Test
    void handleDisabled_retourne403() {
        ProblemDetail pd = handler.handleDisabled(new DisabledException("disabled"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(pd.getTitle()).contains("desactive");
    }

    @Test
    void handleIllegalArgument_retourne400AvecMessage() {
        ProblemDetail pd = handler.handleIllegalArgument(
            new IllegalArgumentException("Code association inconnu : BADCODE"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getDetail()).contains("Code association inconnu");
    }

    @Test
    void handleValidation_retourne400AvecDetails() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        org.springframework.validation.BindingResult binding = mock(org.springframework.validation.BindingResult.class);
        when(ex.getBindingResult()).thenReturn(binding);
        when(binding.getFieldErrors()).thenReturn(java.util.List.of());

        ProblemDetail pd = handler.handleValidation(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
    }
}

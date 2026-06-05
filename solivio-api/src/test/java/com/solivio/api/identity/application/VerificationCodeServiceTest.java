package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.VerificationCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VerificationCodeServiceTest {

    @Mock
    private VerificationCodeRepository repository;

    private VerificationCodeService service;
    private Compte compte;

    @BeforeEach
    void setUp() {
        service = new VerificationCodeService(repository);
        compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
    }

    @Test
    void generer_retourneCodeSixChiffres() {
        VerificationCode vc = new VerificationCode(
            compte, "123456", VerificationCode.TYPE_EMAIL,
            Instant.now().plusSeconds(900));
        when(repository.save(any())).thenReturn(vc);

        VerificationCode result = service.generer(compte, VerificationCode.TYPE_EMAIL);

        assertThat(result.getCode()).matches("\\d{6}");
    }

    @Test
    void valider_retourneTruePourCodeCorrect() {
        VerificationCode vc = new VerificationCode(
            compte, "654321", VerificationCode.TYPE_EMAIL,
            Instant.now().plusSeconds(900));
        when(repository.findTopByCompteIdAndTypeAndUtiliseFalseOrderByCreeADesc(
            any(), any())).thenReturn(Optional.of(vc));
        when(repository.save(any())).thenReturn(vc);

        boolean result = service.valider(compte, "654321", VerificationCode.TYPE_EMAIL);

        assertThat(result).isTrue();
    }

    @Test
    void valider_retourneFalsePourCodeIncorrect() {
        VerificationCode vc = new VerificationCode(
            compte, "654321", VerificationCode.TYPE_EMAIL,
            Instant.now().plusSeconds(900));
        when(repository.findTopByCompteIdAndTypeAndUtiliseFalseOrderByCreeADesc(
            any(), any())).thenReturn(Optional.of(vc));

        boolean result = service.valider(compte, "000000", VerificationCode.TYPE_EMAIL);

        assertThat(result).isFalse();
    }

    @Test
    void valider_retourneFalsePourCodeExpire() {
        VerificationCode vc = new VerificationCode(
            compte, "654321", VerificationCode.TYPE_EMAIL,
            Instant.now().minusSeconds(1)); // expire
        when(repository.findTopByCompteIdAndTypeAndUtiliseFalseOrderByCreeADesc(
            any(), any())).thenReturn(Optional.of(vc));

        boolean result = service.valider(compte, "654321", VerificationCode.TYPE_EMAIL);

        assertThat(result).isFalse();
    }

    @Test
    void valider_retourneFalseQuandAucunCode() {
        when(repository.findTopByCompteIdAndTypeAndUtiliseFalseOrderByCreeADesc(
            any(), any())).thenReturn(Optional.empty());

        boolean result = service.valider(compte, "123456", VerificationCode.TYPE_EMAIL);

        assertThat(result).isFalse();
    }
}

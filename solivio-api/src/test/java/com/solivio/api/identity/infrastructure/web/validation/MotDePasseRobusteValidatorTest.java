package com.solivio.api.identity.infrastructure.web.validation;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class MotDePasseRobusteValidatorTest {

    private final MotDePasseRobusteValidator validator = new MotDePasseRobusteValidator();

    @ParameterizedTest
    @ValueSource(strings = {"cheval-batterie-agrafe", "Linkee Toulouse 2026 !", "8carac!!"})
    void accepteUnMotDePasseLongEtPeuCourant(String motDePasse) {
        assertThat(validator.isValid(motDePasse, null)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"court1!", "password", "PASSWORD", "12345678", "Azertyuiop", "motdepasse123"})
    void refuseUnMotDePasseTropCourtOuCourant(String motDePasse) {
        assertThat(validator.isValid(motDePasse, null)).isFalse();
    }

    @Test
    void refuseAuDelaDeLaLongueurMaximale() {
        assertThat(validator.isValid("a".repeat(MotDePasseRobusteValidator.LONGUEUR_MAX + 1), null)).isFalse();
        assertThat(validator.isValid("a".repeat(MotDePasseRobusteValidator.LONGUEUR_MAX), null)).isTrue();
    }

    @Test
    void laisseLAbsenceDeValeurANotBlank() {
        assertThat(validator.isValid(null, null)).isTrue();
    }
}

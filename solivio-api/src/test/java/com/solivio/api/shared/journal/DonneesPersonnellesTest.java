package com.solivio.api.shared.journal;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DonneesPersonnellesTest {

    @Test
    void masquerEmails_remplaceChaqueAdresse() {
        String masque = DonneesPersonnelles.masquerEmails(
            "550 5.1.1 <marie.dupont+asso@exemple.fr>: user unknown, cc paul_m@test.com");

        assertThat(masque)
            .isEqualTo("550 5.1.1 <[email masque]>: user unknown, cc [email masque]")
            .doesNotContain("@");
    }

    @Test
    void masquerEmails_laisseUnTexteSansAdresseEtTolereNull() {
        assertThat(DonneesPersonnelles.masquerEmails("Connection refused")).isEqualTo("Connection refused");
        assertThat(DonneesPersonnelles.masquerEmails(null)).isNull();
    }

    @Test
    void resumerErreur_donneLaClasseEtLeMessageMasque() {
        assertThat(DonneesPersonnelles.resumerErreur(new IllegalStateException("refus pour a@b.fr")))
            .isEqualTo("IllegalStateException : refus pour [email masque]");
        assertThat(DonneesPersonnelles.resumerErreur(new IllegalStateException()))
            .isEqualTo("IllegalStateException");
    }
}

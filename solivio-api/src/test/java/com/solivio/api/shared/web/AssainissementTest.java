package com.solivio.api.shared.web;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AssainissementTest {

    @Test
    void nettoyer_retireLesBalisesEtTolereNull() {
        assertThat(Assainissement.nettoyer("<b>Riz</b><script>alert(1)</script>")).isEqualTo("Riz");
        assertThat(Assainissement.nettoyer("Pates completes")).isEqualTo("Pates completes");
        assertThat(Assainissement.nettoyer(null)).isNull();
    }
}

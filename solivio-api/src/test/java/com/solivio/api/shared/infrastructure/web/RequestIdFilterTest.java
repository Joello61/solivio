package com.solivio.api.shared.infrastructure.web;

import com.solivio.api.shared.web.ContexteRequete;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    @Test
    void sansEnTete_genereUnIdentifiantVisibleDansLeMdcEtLaReponse() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> pendantLaRequete = new AtomicReference<>();

        filter.doFilter(new MockHttpServletRequest(), response,
            (req, res) -> pendantLaRequete.set(MDC.get(ContexteRequete.MDC_REQUEST_ID)));

        assertThat(pendantLaRequete.get()).isNotBlank();
        assertThat(response.getHeader(ContexteRequete.HEADER_REQUEST_ID)).isEqualTo(pendantLaRequete.get());
    }

    @Test
    void enTeteValide_estRepris() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ContexteRequete.HEADER_REQUEST_ID, "trace-abc-12345");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> { });

        assertThat(response.getHeader(ContexteRequete.HEADER_REQUEST_ID)).isEqualTo("trace-abc-12345");
    }

    @Test
    void enTeteDangereux_estRemplace() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ContexteRequete.HEADER_REQUEST_ID, "abc\n{\"faux\":\"journal\"}");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> { });

        assertThat(response.getHeader(ContexteRequete.HEADER_REQUEST_ID)).doesNotContain("faux").hasSize(36);
    }

    @Test
    void apresLaRequete_leMdcEstVide() throws Exception {
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(),
            (req, res) -> MDC.put(ContexteRequete.MDC_ACCOUNT_ID, "compte"));

        assertThat(MDC.get(ContexteRequete.MDC_REQUEST_ID)).isNull();
        assertThat(MDC.get(ContexteRequete.MDC_ACCOUNT_ID)).isNull();
    }
}

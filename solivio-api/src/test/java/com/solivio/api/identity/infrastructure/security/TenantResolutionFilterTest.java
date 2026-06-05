package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantResolutionFilterTest {

    @Mock
    private AssociationRepository associationRepository;

    private TenantResolutionFilter filter;

    @BeforeEach
    void setUp() {
        filter = new TenantResolutionFilter(associationRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    @Test
    void setsTenantContextFromUserDetailsTenantSlug() throws Exception {
        Association association = new Association("pilote", "Association pilote");
        when(associationRepository.findBySlug("pilote")).thenReturn(Optional.of(association));
        setUserDetailsAuthentication("pilote");

        filter.doFilter(
            mock(HttpServletRequest.class),
            mock(HttpServletResponse.class),
            mock(FilterChain.class)
        );

        assertThat(TenantContext.getTenantId()).isNull();
    }

    @Test
    void clearsTenantContextAfterFilterChain() throws Exception {
        Association association = new Association("pilote", "Association pilote");
        when(associationRepository.findBySlug("pilote")).thenReturn(Optional.of(association));
        setUserDetailsAuthentication("pilote");

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(TenantContext.getTenantId()).isNull();
    }

    @Test
    void doesNotSetTenantWhenNoAuthentication() throws Exception {
        filter.doFilter(
            mock(HttpServletRequest.class),
            mock(HttpServletResponse.class),
            mock(FilterChain.class)
        );

        assertThat(TenantContext.getTenantId()).isNull();
    }

    @Test
    void doesNotSetTenantWhenTenantSlugIsNull() throws Exception {
        setUserDetailsAuthentication(null);

        filter.doFilter(
            mock(HttpServletRequest.class),
            mock(HttpServletResponse.class),
            mock(FilterChain.class)
        );

        assertThat(TenantContext.getTenantId()).isNull();
    }

    @Test
    void doesNotSetTenantWhenAssociationNotFound() throws Exception {
        when(associationRepository.findBySlug("unknown")).thenReturn(Optional.empty());
        setUserDetailsAuthentication("unknown");

        filter.doFilter(
            mock(HttpServletRequest.class),
            mock(HttpServletResponse.class),
            mock(FilterChain.class)
        );

        assertThat(TenantContext.getTenantId()).isNull();
    }

    private void setUserDetailsAuthentication(String tenantSlug) {
        SolivioUserDetails userDetails = new SolivioUserDetails(
            UUID.randomUUID(),
            "user@example.com",
            null,
            tenantSlug,
            false,
            List.of(),
            true
        );
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(userDetails, null, List.of())
        );
    }
}

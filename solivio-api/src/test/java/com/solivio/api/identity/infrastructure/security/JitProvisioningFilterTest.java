package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JitProvisioningFilterTest {

    @Mock
    private PersonneRepository personneRepository;

    private JitProvisioningFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JitProvisioningFilter(personneRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    @Test
    void createsPersonneOnFirstAuthenticatedCall() throws Exception {
        TenantContext.setTenantId("tenant_pilote");
        when(personneRepository.existsByKeycloakId("kc-123")).thenReturn(false);
        setJwtAuthentication("kc-123", "Alice", "Martin", "alice@example.com");

        filter.doFilter(mock(HttpServletRequest.class), mock(HttpServletResponse.class), mock(FilterChain.class));

        ArgumentCaptor<Personne> captor = ArgumentCaptor.forClass(Personne.class);
        verify(personneRepository).save(captor.capture());
        Personne saved = captor.getValue();
        assertThat(saved.getKeycloakId()).isEqualTo("kc-123");
        assertThat(saved.getPrenom()).isEqualTo("Alice");
        assertThat(saved.getNom()).isEqualTo("Martin");
        assertThat(saved.getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    void doesNotCreatePersonneWhenAlreadyExists() throws Exception {
        TenantContext.setTenantId("tenant_pilote");
        when(personneRepository.existsByKeycloakId("kc-123")).thenReturn(true);
        setJwtAuthentication("kc-123", "Alice", "Martin", "alice@example.com");

        filter.doFilter(mock(HttpServletRequest.class), mock(HttpServletResponse.class), mock(FilterChain.class));

        verify(personneRepository, never()).save(any());
    }

    @Test
    void doesNothingWhenNotAuthenticated() throws Exception {
        filter.doFilter(mock(HttpServletRequest.class), mock(HttpServletResponse.class), mock(FilterChain.class));

        verify(personneRepository, never()).existsByKeycloakId(any());
        verify(personneRepository, never()).save(any());
    }

    @Test
    void skipsProvisioningWhenNoTenantContext() throws Exception {
        // Cas d'un utilisateur Google sans association_id : TenantContext vide,
        // le filtre doit s'abstenir plutot que de requeter sans schema.
        setJwtAuthentication("kc-google", "Bob", "Dupont", "bob@gmail.com");

        filter.doFilter(mock(HttpServletRequest.class), mock(HttpServletResponse.class), mock(FilterChain.class));

        verify(personneRepository, never()).existsByKeycloakId(any());
        verify(personneRepository, never()).save(any());
    }

    @Test
    void usesFallbackEmailWhenClaimMissing() throws Exception {
        TenantContext.setTenantId("tenant_pilote");
        when(personneRepository.existsByKeycloakId("kc-no-email")).thenReturn(false);
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .subject("kc-no-email")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

        filter.doFilter(mock(HttpServletRequest.class), mock(HttpServletResponse.class), mock(FilterChain.class));

        ArgumentCaptor<Personne> captor = ArgumentCaptor.forClass(Personne.class);
        verify(personneRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).contains("kc-no-email");
    }

    @Test
    void propagatesFilterChainContinuation() throws Exception {
        TenantContext.setTenantId("tenant_pilote");
        when(personneRepository.existsByKeycloakId(any())).thenReturn(true);
        setJwtAuthentication("kc-any", "A", "B", "a@b.com");
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        verify(chain).doFilter(req, res);
    }

    private void setJwtAuthentication(String sub, String givenName, String familyName, String email) {
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .subject(sub)
            .claim("given_name", givenName)
            .claim("family_name", familyName)
            .claim("email", email)
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }
}

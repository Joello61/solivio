package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.association.domain.Association;
import com.solivio.api.identity.application.PersonneProvisioningService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.RedirectStrategy;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleOAuth2SuccessHandlerTest {

    @Mock private CompteRepository compteRepository;
    @Mock private MembreAssociationRepository membreRepo;
    @Mock private JwtService jwtService;
    @Mock private RefreshTokenRepository refreshTokenRepo;
    @Mock private PersonneProvisioningService personneProvisioningService;
    @Mock private RedirectStrategy redirectStrategy;

    private GoogleOAuth2SuccessHandler handler;
    private Compte compte;
    private Association asso;

    @BeforeEach
    void setUp() {
        handler = new GoogleOAuth2SuccessHandler(
            compteRepository, membreRepo, jwtService, refreshTokenRepo,
            personneProvisioningService, "http://localhost:3000");
        handler.setRedirectStrategy(redirectStrategy);

        compte = new Compte("alice@example.com", null, "Dupont", "Alice");
        compte.setId(UUID.randomUUID());
        compte.setGoogleId("google-uid");
        asso = new Association("pilote", "Pilote");
    }

    @Test
    void onAuthenticationSuccess_redirigeLinkMobileVersDeepLink() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("solivio_mobile_link", "1")});
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());

        handler.onAuthenticationSuccess(request, response, buildAuth("alice@example.com"));

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(redirectStrategy).sendRedirect(any(), any(), urlCaptor.capture());
        assertThat(urlCaptor.getValue()).isEqualTo("soliviomobile://auth?linked=true");
    }

    @Test
    void onAuthenticationSuccess_redirigeMobileNouveauCompteAvecEmailNomPrenom() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("solivio_mobile_auth", "1")});
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());

        handler.onAuthenticationSuccess(request, response, buildAuth("alice@example.com"));

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(redirectStrategy).sendRedirect(any(), any(), urlCaptor.capture());
        String url = urlCaptor.getValue();
        assertThat(url).startsWith("soliviomobile://auth?type=new_user");
        assertThat(url).contains("email=alice%40example.com");
        assertThat(url).contains("nom=Dupont");
        assertThat(url).contains("prenom=Alice");
    }

    @Test
    void onAuthenticationSuccess_redirigeWebNouveauCompteVersPageCompletion() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        // Pas de cookies => comportement web
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());

        handler.onAuthenticationSuccess(request, response, buildAuth("alice@example.com"));

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(redirectStrategy).sendRedirect(any(), any(), urlCaptor.capture());
        assertThat(urlCaptor.getValue())
            .startsWith("http://localhost:3000/complete-google-registration?email=")
            .contains("alice%40example.com");
    }

    @Test
    void onAuthenticationSuccess_redirigeMobileCompteLieVersDeepLinkAvecTokens() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("solivio_mobile_auth", "1")});
        MembreAssociation membre = new MembreAssociation(compte, asso, "beneficiaire");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of(membre));
        when(jwtService.genererAccessToken(any(), any(), any(), any(), any(), any(), any(), anyBoolean()))
            .thenReturn("access-token");
        when(jwtService.genererRefreshTokenBrut()).thenReturn("refresh-brut");
        when(jwtService.hasher("refresh-brut")).thenReturn("refresh-hash");
        when(refreshTokenRepo.save(any())).thenReturn(null);
        when(jwtService.refreshTokenExpiration()).thenReturn(Instant.now().plusSeconds(2592000));

        handler.onAuthenticationSuccess(request, response, buildAuth("alice@example.com"));

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(redirectStrategy).sendRedirect(any(), any(), urlCaptor.capture());
        String url = urlCaptor.getValue();
        assertThat(url).startsWith("soliviomobile://auth?accessToken=access-token");
        assertThat(url).contains("refreshToken=");
        assertThat(url).contains("tenants=");
    }

    @Test
    void onAuthenticationSuccess_redirigeWebCompteLieVersDashboard() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(request.isSecure()).thenReturn(false);
        MembreAssociation membre = new MembreAssociation(compte, asso, "beneficiaire");
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of(membre));
        when(jwtService.genererAccessToken(any(), any(), any(), any(), any(), any(), any(), anyBoolean()))
            .thenReturn("access-token");
        when(jwtService.genererRefreshTokenBrut()).thenReturn("refresh-brut");
        when(jwtService.hasher("refresh-brut")).thenReturn("refresh-hash");
        when(refreshTokenRepo.save(any())).thenReturn(null);
        when(jwtService.refreshTokenExpiration()).thenReturn(Instant.now().plusSeconds(2592000));
        when(jwtService.getRefreshTokenSeconds()).thenReturn(2592000L);

        handler.onAuthenticationSuccess(request, response, buildAuth("alice@example.com"));

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(redirectStrategy).sendRedirect(any(), any(), urlCaptor.capture());
        assertThat(urlCaptor.getValue())
            .isEqualTo("http://localhost:3000/dashboard#token=access-token");
    }

    @Test
    void detecteMobileAuth_effaceLeCookieApresDetection() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("solivio_mobile_auth", "1")});
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());

        handler.onAuthenticationSuccess(request, response, buildAuth("alice@example.com"));

        ArgumentCaptor<String> cookieCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(eq("Set-Cookie"), cookieCaptor.capture());
        assertThat(cookieCaptor.getValue())
            .contains("solivio_mobile_auth=")
            .contains("Max-Age=0");
    }

    private Authentication buildAuth(String email) {
        OAuth2User oAuth2User = mock(OAuth2User.class);
        when(oAuth2User.getAttribute("email")).thenReturn(email);
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(oAuth2User);
        return auth;
    }
}

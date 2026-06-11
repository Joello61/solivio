package com.solivio.api.identity.application;

import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.RefreshToken;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.MeResponse;
import com.solivio.api.identity.infrastructure.web.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private CompteRepository compteRepository;
    @Mock private MembreAssociationRepository membreRepo;
    @Mock private RefreshTokenRepository refreshTokenRepo;
    @Mock private JwtService jwtService;
    @Mock private AssociationRepository associationRepository;
    @Mock private PersonneProvisioningService personneProvisioningService;
    @Mock private PersonneRepository personneRepository;

    private AuthService service;
    private Compte compte;
    private UUID compteId;

    @BeforeEach
    void setUp() {
        service = new AuthService(authenticationManager, compteRepository, membreRepo,
            refreshTokenRepo, jwtService, associationRepository, personneProvisioningService,
            personneRepository);
        compteId = UUID.randomUUID();
        compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setId(compteId);
    }

    @Test
    void me_retourneInfosUtilisateur() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.empty());
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, "pilote", false,
            List.of(new SimpleGrantedAuthority("ROLE_BENEFICIAIRE")), true);

        MeResponse response = service.me(userDetails);

        assertThat(response.email()).isEqualTo("alice@example.com");
        assertThat(response.nom()).isEqualTo("Dupont");
        assertThat(response.tenantActif()).isEqualTo("pilote");
        assertThat(response.roles()).contains("beneficiaire");
        assertThat(response.telephone()).isNull();
        assertThat(response.photoUrl()).isNull();
        assertThat(response.dateCreation()).isNotNull();
        assertThat(response.dateModification()).isNotNull();
        assertThat(response.emailVerifie()).isFalse();
        assertThat(response.authMethod()).isEqualTo("password");
    }

    @Test
    void me_retourneAuthMethodGoogleSiCompteGoogle() {
        compte.setGoogleId("google-uid-123");
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        // tenantSlug null : personneRepository n'est pas appele
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, null, false,
            List.of(), true);

        MeResponse response = service.me(userDetails);

        assertThat(response.authMethod()).isEqualTo("google");
    }

    @Test
    void me_retourneTelephoneEtPhotoDepuisPersonneTenant() {
        compte.setPhotoUrl(null);
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        com.solivio.api.identity.domain.Personne personne = new com.solivio.api.identity.domain.Personne(
            "Dupont", "Alice", "alice@example.com");
        personne.setTelephone("0600000000");
        personne.setPhotoUrl("/api/public/avatar/" + compteId);
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, "pilote", false,
            List.of(new SimpleGrantedAuthority("ROLE_BENEFICIAIRE")), true);

        MeResponse response = service.me(userDetails);

        assertThat(response.telephone()).isEqualTo("0600000000");
        assertThat(response.photoUrl()).isEqualTo("/api/public/avatar/" + compteId);
    }

    @Test
    void logout_revoqueTokensEtSupprimeCookies() throws Exception {
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, "pilote", false, List.of(), true);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        service.logout(userDetails, request, response);

        verify(refreshTokenRepo).revoquerTousParCompte(compteId);
    }

    @Test
    void refreshToken_rotateEtRetourneNouveauToken() throws Exception {
        String tokenBrut = "old-refresh-token";
        String hash = "hashed-token";
        RefreshToken rt = new RefreshToken(compte, hash, "pilote", "Mozilla", "127.0.0.1",
            Instant.now().plusSeconds(3600), false);
        when(jwtService.hasher(tokenBrut)).thenReturn(hash);
        when(refreshTokenRepo.findByTokenHash(hash)).thenReturn(Optional.of(rt));
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of());
        when(jwtService.genererAccessToken(any(), any(), any(), any(), any(), any(), any(), org.mockito.ArgumentMatchers.anyBoolean()))
            .thenReturn("new-access-token");
        when(jwtService.genererRefreshTokenBrut()).thenReturn("new-refresh-brut");
        when(jwtService.hasher("new-refresh-brut")).thenReturn("new-hash");
        when(refreshTokenRepo.save(any())).thenReturn(rt);
        when(jwtService.refreshTokenExpiration()).thenReturn(Instant.now().plusSeconds(2592000));
        // longDuree=false : getRefreshTokenSeconds n'est pas appele (Max-Age=-1 directement)
        when(jwtService.getAccessTokenMinutes()).thenReturn(15L);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        TokenResponse result = service.refreshToken(tokenBrut, request, response);

        assertThat(result.accessToken()).isEqualTo("new-access-token");
        assertThat(result.refreshToken()).isEqualTo("new-refresh-brut");
        // save() est appele 2x : une fois pour revoquer l'ancien, une fois pour persister le nouveau
        verify(refreshTokenRepo, org.mockito.Mockito.times(2)).save(any());
    }

    @Test
    void refreshToken_lanceExceptionSiTokenRevoque() {
        String tokenBrut = "revoked-token";
        String hash = "revoked-hash";
        RefreshToken rt = new RefreshToken(compte, hash, "pilote", null, null,
            Instant.now().plusSeconds(3600), false);
        rt.setRevoque(true);

        when(jwtService.hasher(tokenBrut)).thenReturn(hash);
        when(refreshTokenRepo.findByTokenHash(hash)).thenReturn(Optional.of(rt));

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        assertThatThrownBy(() -> service.refreshToken(tokenBrut, request, response))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("expire ou revoque");
    }

    @Test
    void refreshToken_lanceExceptionSiTokenInconnu() {
        String tokenBrut = "unknown-token";
        when(jwtService.hasher(tokenBrut)).thenReturn("unknown-hash");
        when(refreshTokenRepo.findByTokenHash("unknown-hash")).thenReturn(Optional.empty());

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        assertThatThrownBy(() -> service.refreshToken(tokenBrut, request, response))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("invalide");
    }

    @Test
    void login_retourneTokenAvecTenantSiUnSeulTenant() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));

        com.solivio.api.association.domain.Association asso =
            new com.solivio.api.association.domain.Association("pilote", "Pilote");
        MembreAssociation membre = new MembreAssociation(compte, asso, "beneficiaire");
        when(membreRepo.findActivesByCompteId(any())).thenReturn(List.of(membre));
        when(jwtService.genererAccessToken(any(), any(), any(), any(), any(), any(), any(), org.mockito.ArgumentMatchers.anyBoolean()))
            .thenReturn("access-token");
        when(jwtService.genererRefreshTokenBrut()).thenReturn("refresh-brut");
        when(jwtService.hasher(any())).thenReturn("refresh-hash");
        when(refreshTokenRepo.save(any())).thenReturn(null);
        when(jwtService.refreshTokenExpiration()).thenReturn(Instant.now().plusSeconds(2592000));
        when(jwtService.getAccessTokenMinutes()).thenReturn(15L);
        // getRefreshTokenSeconds n'est pas appele quand rememberMe=false (short-circuit)

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        TokenResponse result = service.login("alice@example.com", "password123!", false,
            request, response);

        assertThat(result.accessToken()).isEqualTo("access-token");
        assertThat(result.refreshToken()).isEqualTo("refresh-brut");
        assertThat(result.tenants()).hasSize(1);
    }
}

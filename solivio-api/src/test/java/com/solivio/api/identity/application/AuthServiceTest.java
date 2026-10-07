package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.RefreshToken;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.identity.SolivioUserDetails;
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
import static org.mockito.ArgumentMatchers.isNull;
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
    @Mock private PersonneProvisioningService personneProvisioningService;
    @Mock private PersonneRepository personneRepository;
    @Mock private RegisterService registerService;
    @Mock private TentativesConnexionService tentativesConnexion;

    private AuthService service;
    private Compte compte;
    private UUID compteId;

    @BeforeEach
    void setUp() {
        service = new AuthService(authenticationManager, compteRepository, membreRepo,
            refreshTokenRepo, jwtService, personneProvisioningService,
            personneRepository, registerService, tentativesConnexion);
        compteId = UUID.randomUUID();
        compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        compte.setId(compteId);
    }

    @Test
    void me_retourneInfosUtilisateur() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.empty());
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, false,
            List.of(new SimpleGrantedAuthority("ROLE_BENEFICIAIRE")), true);

        MeResponse response = service.me(userDetails);

        assertThat(response.email()).isEqualTo("alice@example.com");
        assertThat(response.nom()).isEqualTo("Dupont");
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
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.empty());
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, false,
            List.of(), true);

        MeResponse response = service.me(userDetails);

        assertThat(response.authMethod()).isEqualTo("google");
    }

    @Test
    void me_retourneTelephoneEtPhotoDepuisPersonne() {
        compte.setPhotoUrl(null);
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        com.solivio.api.identity.domain.Personne personne = new com.solivio.api.identity.domain.Personne(
            "Dupont", "Alice", "alice@example.com");
        personne.setTelephone("0600000000");
        personne.setPhotoUrl("/api/public/avatar/" + compteId);
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, false,
            List.of(new SimpleGrantedAuthority("ROLE_BENEFICIAIRE")), true);

        MeResponse response = service.me(userDetails);

        assertThat(response.telephone()).isEqualTo("0600000000");
        assertThat(response.photoUrl()).isEqualTo("/api/public/avatar/" + compteId);
    }

    @Test
    void logout_revoqueTokensEtSupprimeCookies() throws Exception {
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, false, List.of(), true);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        service.logout(userDetails, request, response);

        verify(refreshTokenRepo).revoquerTousParCompte(compteId);
    }

    @Test
    void refreshToken_rotateEtRetourneNouveauToken() throws Exception {
        String tokenBrut = "old-refresh-token";
        String hash = "hashed-token";
        RefreshToken rt = new RefreshToken(compte, hash, "Mozilla", "127.0.0.1",
            Instant.now().plusSeconds(3600), false);
        when(jwtService.hasher(tokenBrut)).thenReturn(hash);
        when(refreshTokenRepo.findByTokenHash(hash)).thenReturn(Optional.of(rt));
        when(membreRepo.findActifByCompteId(any())).thenReturn(Optional.empty());
        when(jwtService.genererAccessToken(any(), any(), any(), any(), any(), any(), org.mockito.ArgumentMatchers.anyBoolean()))
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
        RefreshToken rt = new RefreshToken(compte, hash, null, null,
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
    void completerInscriptionGoogle_retourneTokenAvecLeRoleDuMembre() throws Exception {
        Compte googleCompte = new Compte("google@example.com", null, "Dupont", "Alice");
        UUID googleCompteId = UUID.randomUUID();
        googleCompte.setId(googleCompteId);
        googleCompte.setGoogleId("google-uid");

        when(registerService.finaliserCompteGoogle("google@example.com", "Dupont", "Alice", null))
            .thenReturn(googleCompte);
        when(membreRepo.findActifByCompteId(googleCompteId))
            .thenReturn(Optional.of(new MembreAssociation(googleCompte, "beneficiaire")));
        stubEmissionJetons();

        TokenResponse result = service.completerInscriptionGoogle(
            "google@example.com", "Dupont", "Alice", null, mock(HttpServletRequest.class),
            mock(HttpServletResponse.class));

        assertThat(result.accessToken()).isEqualTo("access-token");
        verify(jwtService).genererAccessToken(eq(googleCompteId), eq("google@example.com"), eq("Dupont"),
            eq("Alice"), eq(List.of("beneficiaire")), isNull(), eq(false));
    }

    @Test
    void completerInscriptionGoogle_propageLExceptionDeRegisterService() {
        when(registerService.finaliserCompteGoogle(any(), any(), any(), any()))
            .thenThrow(new IllegalArgumentException("Ce compte est deja membre de l'association"));

        assertThatThrownBy(() -> service.completerInscriptionGoogle(
            "google@example.com", "Dupont", "Alice", null, mock(HttpServletRequest.class),
            mock(HttpServletResponse.class)))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("deja membre");
    }

    @Test
    void login_emetUnJetonAvecLeRoleEtProvisionneLaPersonne() throws Exception {
        when(authenticationManager.authenticate(any())).thenReturn(mock(Authentication.class));
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        MembreAssociation membre = new MembreAssociation(compte, "coordinateur");
        membre.setCoordoType("coordo_sec");
        when(membreRepo.findActifByCompteId(compteId)).thenReturn(Optional.of(membre));
        stubEmissionJetons();

        TokenResponse result = service.login("alice@example.com", "password123!", false,
            mock(HttpServletRequest.class), mock(HttpServletResponse.class));

        assertThat(result.accessToken()).isEqualTo("access-token");
        assertThat(result.refreshToken()).isEqualTo("refresh-brut");
        verify(jwtService).genererAccessToken(eq(compteId), any(), any(), any(),
            eq(List.of("coordinateur")), eq("coordo_sec"), eq(false));
        verify(personneProvisioningService).provisionner("alice@example.com", "Dupont", "Alice");
        verify(tentativesConnexion).reinitialiser("alice@example.com");
    }

    @Test
    void login_membreSuspendu_emetUnJetonSansRole() throws Exception {
        when(authenticationManager.authenticate(any())).thenReturn(mock(Authentication.class));
        when(compteRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(compte));
        when(membreRepo.findActifByCompteId(compteId)).thenReturn(Optional.empty());
        stubEmissionJetons();

        service.login("alice@example.com", "password123!", false,
            mock(HttpServletRequest.class), mock(HttpServletResponse.class));

        verify(jwtService).genererAccessToken(eq(compteId), any(), any(), any(),
            eq(List.of()), isNull(), eq(false));
    }

    @Test
    void login_mauvaisMotDePasse_enregistreLEchecEtPropageLErreur() {
        when(authenticationManager.authenticate(any()))
            .thenThrow(new org.springframework.security.authentication.BadCredentialsException("ko"));

        assertThatThrownBy(() -> service.login("alice@example.com", "faux", false,
            mock(HttpServletRequest.class), mock(HttpServletResponse.class)))
            .isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);
        verify(tentativesConnexion).enregistrerEchec("alice@example.com");
        verify(tentativesConnexion, org.mockito.Mockito.never()).reinitialiser(any());
    }

    @Test
    void login_compteVerrouille_neVerifiePasLeMotDePasse() {
        org.mockito.Mockito.doThrow(new com.solivio.api.shared.exception.TropDeTentativesException("verrouille"))
            .when(tentativesConnexion).verifierNonVerrouille("alice@example.com");

        assertThatThrownBy(() -> service.login("alice@example.com", "password123!", false,
            mock(HttpServletRequest.class), mock(HttpServletResponse.class)))
            .isInstanceOf(com.solivio.api.shared.exception.TropDeTentativesException.class);
        org.mockito.Mockito.verifyNoInteractions(authenticationManager);
    }

    private void stubEmissionJetons() {
        when(jwtService.genererAccessToken(any(), any(), any(), any(), any(), any(),
            org.mockito.ArgumentMatchers.anyBoolean())).thenReturn("access-token");
        when(jwtService.genererRefreshTokenBrut()).thenReturn("refresh-brut");
        when(jwtService.hasher("refresh-brut")).thenReturn("refresh-hash");
        when(jwtService.refreshTokenExpiration()).thenReturn(Instant.now().plusSeconds(2592000));
        when(jwtService.getAccessTokenMinutes()).thenReturn(15L);
    }
}

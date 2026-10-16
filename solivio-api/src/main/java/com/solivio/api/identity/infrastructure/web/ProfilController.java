package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.AvatarService;
import com.solivio.api.identity.application.MembreService;
import com.solivio.api.identity.application.ProfilService;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.AjouterMonRoleRequest;
import com.solivio.api.identity.infrastructure.web.dto.MeResponse;
import com.solivio.api.identity.infrastructure.web.dto.MembreResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateProfilRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/me")
@PreAuthorize("isAuthenticated()")
public class ProfilController {

    private final ProfilService profilService;
    private final AvatarService avatarService;
    private final MembreService membreService;

    public ProfilController(ProfilService profilService, AvatarService avatarService, MembreService membreService) {
        this.profilService = profilService;
        this.avatarService = avatarService;
        this.membreService = membreService;
    }

    @PatchMapping
    public ResponseEntity<MeResponse> mettreAJourProfil(
        @Valid @RequestBody UpdateProfilRequest request,
        @AuthenticationPrincipal SolivioUserDetails userDetails
    ) {
        return ResponseEntity.ok(profilService.mettreAJour(userDetails, request));
    }

    // Le role compte au prochain renouvellement du jeton, que le client demande aussitot.
    @PostMapping("/roles")
    public ResponseEntity<MembreResponse> ajouterMonRole(
        @Valid @RequestBody AjouterMonRoleRequest request,
        @AuthenticationPrincipal SolivioUserDetails userDetails
    ) {
        return ResponseEntity.ok(
            membreService.ajouterMonRole(userDetails.getCompteId(), request.role(), request.attestationEtudiant()));
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MeResponse> uploadPhoto(
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal SolivioUserDetails userDetails
    ) {
        avatarService.sauvegarderAvatar(userDetails.getCompteId(), file);
        // Recharger le profil a jour apres upload.
        // On delegue a AuthService#me mais on evite la dependance circulaire
        // en appellant directement ProfilService avec un UpdateProfilRequest vide.
        MeResponse profil = profilService.mettreAJour(userDetails, new UpdateProfilRequest(null, null, null));
        return ResponseEntity.ok(profil);
    }
}

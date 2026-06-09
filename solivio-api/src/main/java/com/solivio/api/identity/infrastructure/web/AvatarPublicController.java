package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.AvatarService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/public")
public class AvatarPublicController {

    private final AvatarService avatarService;

    public AvatarPublicController(AvatarService avatarService) {
        this.avatarService = avatarService;
    }

    @GetMapping("/avatar/{compteId}")
    public ResponseEntity<byte[]> servirAvatar(@PathVariable UUID compteId) {
        byte[] data = avatarService.lireAvatar(compteId);
        if (data.length == 0) {
            return ResponseEntity.notFound().build();
        }
        MediaType mediaType = avatarService.mediaTypePourCompte(compteId);
        return ResponseEntity.ok()
            .contentType(mediaType)
            .header("Cache-Control", "public, max-age=3600")
            .body(data);
    }
}

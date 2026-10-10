package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.shared.exception.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AvatarService {

    private static final Logger log = LoggerFactory.getLogger(AvatarService.class);

    private static final Set<String> MIMES_AUTORISES = Set.of(
        MediaType.IMAGE_JPEG_VALUE,
        MediaType.IMAGE_PNG_VALUE,
        "image/webp"
    );

    private static final Map<String, String> EXT_PAR_MIME = Map.of(
        MediaType.IMAGE_JPEG_VALUE, "jpg",
        MediaType.IMAGE_PNG_VALUE, "png",
        "image/webp", "webp"
    );

    private static final String URL_TEMPLATE = "/api/public/avatar/";

    private final CompteRepository compteRepository;
    private final PersonneRepository personneRepository;
    private final Path avatarsDir;

    public AvatarService(
        CompteRepository compteRepository,
        PersonneRepository personneRepository,
        @Value("${solivio.uploads.avatars-dir}") String avatarsDirPath
    ) {
        this.compteRepository = compteRepository;
        this.personneRepository = personneRepository;
        this.avatarsDir = Paths.get(avatarsDirPath);
        try {
            Files.createDirectories(this.avatarsDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de creer le repertoire avatars : " + avatarsDirPath, e);
        }
    }

    @Transactional
    public String sauvegarderAvatar(UUID compteId, MultipartFile file) {
        validerFichier(file);

        String ext = EXT_PAR_MIME.get(file.getContentType());
        supprimerAncienAvatar(compteId);

        Path destination = avatarsDir.resolve(compteId + "." + ext);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Echec de l'enregistrement de l'avatar", e);
        }

        String photoUrl = URL_TEMPLATE + compteId;

        Compte compte = compteRepository.findById(compteId)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + compteId));
        compte.setPhotoUrl(photoUrl);
        compteRepository.save(compte);

        // Propager aussi sur la Personne si elle existe.
        personneRepository.findByCompteEmail(compte.getEmail()).ifPresent(p -> {
            p.setPhotoUrl(photoUrl);
            personneRepository.save(p);
        });

        log.debug("Avatar enregistre pour le compte {} : {}", compteId, destination);
        return photoUrl;
    }

    public byte[] lireAvatar(UUID compteId) {
        return trouverFichierAvatar(compteId).map(p -> {
            try {
                return Files.readAllBytes(p);
            } catch (IOException e) {
                log.warn("Lecture avatar impossible pour {} : {}", compteId, e.getMessage());
                return new byte[0];
            }
        }).orElse(new byte[0]);
    }

    public MediaType mediaTypePourCompte(UUID compteId) {
        return trouverFichierAvatar(compteId)
            .map(p -> {
                String name = p.getFileName().toString();
                String ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
                return switch (ext) {
                    case "png" -> MediaType.IMAGE_PNG;
                    case "webp" -> MediaType.parseMediaType("image/webp");
                    default -> MediaType.IMAGE_JPEG;
                };
            })
            .orElse(MediaType.IMAGE_JPEG);
    }

    private void validerFichier(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier avatar ne peut pas etre vide.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("L'avatar ne peut pas depasser 5 Mo.");
        }
        String mime = file.getContentType();
        if (mime == null || !MIMES_AUTORISES.contains(mime)) {
            throw new IllegalArgumentException(
                "Format non supporte. Formats acceptes : JPG, PNG, WEBP.");
        }
    }

    public void supprimerAvatar(UUID compteId) {
        supprimerAncienAvatar(compteId);
    }

    private void supprimerAncienAvatar(UUID compteId) {
        trouverFichierAvatar(compteId).ifPresent(p -> {
            try {
                Files.deleteIfExists(p);
            } catch (IOException e) {
                log.warn("Impossible de supprimer l'ancien avatar pour {} : {}", compteId, e.getMessage());
            }
        });
    }

    private Optional<Path> trouverFichierAvatar(UUID compteId) {
        for (String ext : EXT_PAR_MIME.values()) {
            Path candidate = avatarsDir.resolve(compteId + "." + ext);
            if (Files.exists(candidate)) {
                return Optional.of(candidate);
            }
        }
        return Optional.empty();
    }
}

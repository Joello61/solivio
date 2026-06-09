package com.solivio.api.association.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.infrastructure.web.dto.AssociationResponse;
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

@Service
public class AssociationLogoService {

    private static final Logger log = LoggerFactory.getLogger(AssociationLogoService.class);

    private static final Set<String> MIMES_AUTORISES = Set.of(
        MediaType.IMAGE_JPEG_VALUE,
        MediaType.IMAGE_PNG_VALUE,
        MediaType.IMAGE_GIF_VALUE,
        "image/webp"
    );

    // Extensions derivees du type MIME pour le nommage du fichier.
    private static final Map<String, String> EXT_PAR_MIME = Map.of(
        MediaType.IMAGE_JPEG_VALUE, "jpg",
        MediaType.IMAGE_PNG_VALUE, "png",
        MediaType.IMAGE_GIF_VALUE, "gif",
        "image/webp", "webp"
    );

    private static final String URL_TEMPLATE = "/api/public/logo/";

    private final AssociationRepository associationRepository;
    private final AssociationConfigService configService;
    private final Path logosDir;

    public AssociationLogoService(
        AssociationRepository associationRepository,
        AssociationConfigService configService,
        @Value("${solivio.uploads.logos-dir}") String logosDirPath
    ) {
        this.associationRepository = associationRepository;
        this.configService = configService;
        this.logosDir = Paths.get(logosDirPath);
        try {
            Files.createDirectories(this.logosDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de creer le repertoire logos : " + logosDirPath, e);
        }
    }

    @Transactional
    public AssociationResponse sauvegarderLogo(String tenantSlug, MultipartFile file) {
        validerFichier(file);

        String ext = EXT_PAR_MIME.get(file.getContentType());
        supprimerAncienLogo(tenantSlug);

        Path destination = logosDir.resolve(tenantSlug + "." + ext);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Echec de l'enregistrement du logo", e);
        }

        Association asso = associationRepository.findBySlug(tenantSlug)
            .orElseThrow(() -> new NotFoundException("Association introuvable : " + tenantSlug));
        asso.setLogoUrl(URL_TEMPLATE + tenantSlug);
        associationRepository.save(asso);

        log.debug("Logo enregistre pour {} : {}", tenantSlug, destination);
        return configService.lire(tenantSlug);
    }

    /**
     * Lit le fichier logo depuis le disque.
     * Retourne un tableau vide si aucun logo n'existe pour ce tenant.
     */
    public byte[] lireLogo(String tenantSlug) {
        Optional<Path> logoPath = trouverFichierLogo(tenantSlug);
        if (logoPath.isEmpty()) {
            return new byte[0];
        }
        try {
            return Files.readAllBytes(logoPath.get());
        } catch (IOException e) {
            log.warn("Lecture du logo impossible pour {} : {}", tenantSlug, e.getMessage());
            return new byte[0];
        }
    }

    public MediaType mediaTypePourTenant(String tenantSlug) {
        return trouverFichierLogo(tenantSlug)
            .map(p -> {
                String name = p.getFileName().toString();
                String ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
                return switch (ext) {
                    case "png" -> MediaType.IMAGE_PNG;
                    case "gif" -> MediaType.IMAGE_GIF;
                    case "webp" -> MediaType.parseMediaType("image/webp");
                    default -> MediaType.IMAGE_JPEG;
                };
            })
            .orElse(MediaType.IMAGE_PNG);
    }

    private void validerFichier(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier logo ne peut pas etre vide.");
        }
        String mime = file.getContentType();
        if (mime == null || !MIMES_AUTORISES.contains(mime)) {
            throw new IllegalArgumentException(
                "Format non supporte. Formats acceptes : JPG, PNG, GIF, WEBP.");
        }
    }

    private void supprimerAncienLogo(String tenantSlug) {
        trouverFichierLogo(tenantSlug).ifPresent(p -> {
            try {
                Files.deleteIfExists(p);
            } catch (IOException e) {
                log.warn("Impossible de supprimer l'ancien logo pour {} : {}", tenantSlug, e.getMessage());
            }
        });
    }

    private Optional<Path> trouverFichierLogo(String tenantSlug) {
        for (String ext : EXT_PAR_MIME.values()) {
            Path candidate = logosDir.resolve(tenantSlug + "." + ext);
            if (Files.exists(candidate)) {
                return Optional.of(candidate);
            }
        }
        return Optional.empty();
    }
}

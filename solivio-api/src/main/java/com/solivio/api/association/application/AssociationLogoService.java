package com.solivio.api.association.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.infrastructure.web.dto.AssociationResponse;
import com.solivio.api.audit.application.AuditService;
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

    private static final String URL_LOGO = "/api/public/logo";
    private static final String NOM_FICHIER = "logo";

    private final AssociationRepository associationRepository;
    private final AssociationConfigService configService;
    private final Path logosDir;
    private final AuditService auditService;

    public AssociationLogoService(
        AssociationRepository associationRepository,
        AssociationConfigService configService,
        @Value("${solivio.uploads.logos-dir}") String logosDirPath,
        AuditService auditService
    ) {
        this.associationRepository = associationRepository;
        this.configService = configService;
        this.logosDir = Paths.get(logosDirPath);
        try {
            Files.createDirectories(this.logosDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de créer le répertoire logos : " + logosDirPath, e);
        }
        this.auditService = auditService;
    }

    @Transactional
    public AssociationResponse sauvegarderLogo(MultipartFile file) {
        validerFichier(file);

        String ext = EXT_PAR_MIME.get(file.getContentType());
        supprimerAncienLogo();

        Path destination = logosDir.resolve(NOM_FICHIER + "." + ext);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Échec de l'enregistrement du logo", e);
        }

        Association asso = configService.charger();
        asso.setLogoUrl(URL_LOGO);
        associationRepository.save(asso);

        auditService.tracer("LOGO_MODIFIE", "association", asso.getId());
        log.debug("Logo enregistre : {}", destination);
        return configService.lire();
    }

    /**
     * Lit le fichier logo depuis le disque.
     * Retourne un tableau vide si aucun logo n'a ete televerse.
     */
    public byte[] lireLogo() {
        Optional<Path> logoPath = trouverFichierLogo();
        if (logoPath.isEmpty()) {
            return new byte[0];
        }
        try {
            return Files.readAllBytes(logoPath.get());
        } catch (IOException e) {
            log.warn("Lecture du logo impossible : {}", e.getMessage());
            return new byte[0];
        }
    }

    public MediaType mediaTypeLogo() {
        return trouverFichierLogo()
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
            throw new IllegalArgumentException("Le fichier logo ne peut pas être vide.");
        }
        String mime = file.getContentType();
        if (mime == null || !MIMES_AUTORISES.contains(mime)) {
            throw new IllegalArgumentException(
                "Format non supporté. Formats acceptés : JPG, PNG, GIF, WEBP.");
        }
    }

    private void supprimerAncienLogo() {
        trouverFichierLogo().ifPresent(p -> {
            try {
                Files.deleteIfExists(p);
            } catch (IOException e) {
                log.warn("Impossible de supprimer l'ancien logo : {}", e.getMessage());
            }
        });
    }

    private Optional<Path> trouverFichierLogo() {
        for (String ext : EXT_PAR_MIME.values()) {
            Path candidate = logosDir.resolve(NOM_FICHIER + "." + ext);
            if (Files.exists(candidate)) {
                return Optional.of(candidate);
            }
        }
        return Optional.empty();
    }
}

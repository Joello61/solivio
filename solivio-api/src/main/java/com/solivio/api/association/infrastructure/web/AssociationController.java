package com.solivio.api.association.infrastructure.web;

import com.solivio.api.association.application.AssociationConfigService;
import com.solivio.api.association.application.AssociationExportService;
import com.solivio.api.association.application.AssociationLogoService;
import com.solivio.api.association.infrastructure.web.dto.AssociationResponse;
import com.solivio.api.association.infrastructure.web.dto.UpdateAssociationRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/association")
public class AssociationController {

    private final AssociationConfigService configService;
    private final AssociationExportService exportService;
    private final AssociationLogoService logoService;

    public AssociationController(
        AssociationConfigService configService,
        AssociationExportService exportService,
        AssociationLogoService logoService
    ) {
        this.configService = configService;
        this.exportService = exportService;
        this.logoService = logoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','COORDINATEUR','SUPER_ADMIN')")
    public ResponseEntity<AssociationResponse> lire() {
        return ResponseEntity.ok(configService.lire());
    }

    @PatchMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<AssociationResponse> mettreAJour(
        @Valid @RequestBody UpdateAssociationRequest request
    ) {
        AssociationResponse response = configService.mettreAJour(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<AssociationResponse> uploadLogo(
        @RequestParam("file") MultipartFile file
    ) {
        AssociationResponse response = logoService.sauvegarderLogo(file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<byte[]> exporter() {
        byte[] zip = exportService.exporterEnZip();
        String filename = "export-solivio.zip";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(zip);
    }
}

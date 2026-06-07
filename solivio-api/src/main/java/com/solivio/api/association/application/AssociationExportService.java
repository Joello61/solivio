package com.solivio.api.association.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.json.JsonMapper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Exporte l'integralite des donnees d'une association en ZIP (JSON par entite).
 * Les tables du schema tenant sont lues directement via JDBC pour une
 * exhaustivite independante des couches applicatives.
 */
@Service
@Transactional(readOnly = true)
public class AssociationExportService {

    private static final List<String> TABLES_TENANT = List.of(
        "personne", "profil_beneficiaire", "affiliation", "role",
        "distribution", "creneau", "inscription", "denree_distribution",
        "notification", "statistique_distribution", "journal_audit"
    );

    private final AssociationRepository associationRepository;
    private final JdbcTemplate jdbcTemplate;
    private final JsonMapper jsonMapper;

    public AssociationExportService(
        AssociationRepository associationRepository,
        JdbcTemplate jdbcTemplate,
        JsonMapper jsonMapper
    ) {
        this.associationRepository = associationRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.jsonMapper = jsonMapper;
    }

    public byte[] exporterEnZip(String tenantSlug) {
        Association asso = associationRepository.findBySlug(tenantSlug)
            .orElseThrow(() -> new NotFoundException("Association introuvable : " + tenantSlug));

        String schema = TenantProvisioningService.schemaName(tenantSlug);
        TenantContext.setTenantId(schema);
        try {
            return construireZip(asso, schema);
        } finally {
            TenantContext.clear();
        }
    }

    private byte[] construireZip(Association asso, String schema) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(baos)) {
            ajouterEntree(zip, "association.json", asso);
            for (String table : TABLES_TENANT) {
                List<Map<String, Object>> lignes = jdbcTemplate.queryForList(
                    "SELECT * FROM \"" + schema + "\"." + table
                );
                ajouterEntree(zip, table + ".json", lignes);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lors de la construction du ZIP d'export", e);
        }
        return baos.toByteArray();
    }

    private void ajouterEntree(ZipOutputStream zip, String nom, Object contenu) throws IOException {
        zip.putNextEntry(new ZipEntry(nom));
        zip.write(jsonMapper.writeValueAsBytes(contenu));
        zip.closeEntry();
    }
}

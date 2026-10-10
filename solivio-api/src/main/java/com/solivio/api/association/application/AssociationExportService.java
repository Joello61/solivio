package com.solivio.api.association.application;

import com.solivio.api.association.infrastructure.web.dto.AssociationResponse;
import com.solivio.api.audit.application.AuditService;
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
 * Exporte les donnees de l'association en ZIP (un JSON par table).
 * Les tables sont lues directement via JDBC pour une exhaustivite
 * independante des couches applicatives.
 */
@Service
@Transactional(readOnly = true)
public class AssociationExportService {

    // Tables metier exportees. Les tables techniques d'authentification (compte,
    // refresh_token, verification_code, invitation) sont exclues : elles portent
    // des hash de secrets. Noms constants, jamais derives d'une entree utilisateur.
    private static final List<String> TABLES_EXPORTEES = List.of(
        "membre", "personne", "profil_beneficiaire",
        "distribution", "creneau", "inscription", "type_role", "role_benevole_inscription",
        "pointage_ad_hoc", "denree_distribution", "catalogue_denree",
        "notification", "statistique_distribution",
        "session_reconditionnement", "inscription_reconditionnement",
        "mission_collecte", "evenement", "participation_evenement", "journal_audit"
    );

    private final AssociationConfigService configService;
    private final JdbcTemplate jdbcTemplate;
    private final JsonMapper jsonMapper;
    private final AuditService auditService;

    public AssociationExportService(
        AssociationConfigService configService,
        JdbcTemplate jdbcTemplate,
        JsonMapper jsonMapper,
        AuditService auditService
    ) {
        this.configService = configService;
        this.jdbcTemplate = jdbcTemplate;
        this.jsonMapper = jsonMapper;
        this.auditService = auditService;
    }

    // Lecture et ecriture : l'export, qui contient les profils beneficiaires, est trace.
    @Transactional
    public byte[] exporterEnZip() {
        auditService.tracer("EXPORT_DONNEES", "association", null);
        return construireZip(configService.lire());
    }

    private byte[] construireZip(AssociationResponse asso) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(baos)) {
            ajouterEntree(zip, "association.json", asso);
            for (String table : TABLES_EXPORTEES) {
                List<Map<String, Object>> lignes = jdbcTemplate.queryForList(
                    "SELECT * FROM " + table
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

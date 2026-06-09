package com.solivio.api.repartition.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.repartition.domain.CatalogueDenree;
import com.solivio.api.repartition.infrastructure.persistence.CatalogueDenreeRepository;
import com.solivio.api.repartition.infrastructure.web.dto.CatalogueDenreeResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogueDenreeServiceTest {

    @Mock private CatalogueDenreeRepository catalogueRepository;
    @Mock private AuditService auditService;

    private CatalogueDenreeService service;

    private UUID acteurId;

    @BeforeEach
    void setUp() {
        service = new CatalogueDenreeService(catalogueRepository, auditService);
        acteurId = UUID.randomUUID();
    }

    // === rechercher ===

    @Test
    void rechercher_retourneTousQuandQVide() {
        CatalogueDenree riz = denreeAvecId("Riz");
        CatalogueDenree tomate = denreeAvecId("Tomate");
        when(catalogueRepository.findAllByOrderByLibelleAsc()).thenReturn(List.of(riz, tomate));

        List<CatalogueDenreeResponse> resultats = service.rechercher("");

        assertThat(resultats).hasSize(2);
        assertThat(resultats.get(0).libelle()).isEqualTo("Riz");
        verify(catalogueRepository).findAllByOrderByLibelleAsc();
        verify(catalogueRepository, never()).findByLibelleContainingIgnoreCaseOrderByLibelleAsc(anyString());
    }

    @Test
    void rechercher_retourneTousQuandQNull() {
        when(catalogueRepository.findAllByOrderByLibelleAsc()).thenReturn(List.of());

        service.rechercher(null);

        verify(catalogueRepository).findAllByOrderByLibelleAsc();
        verify(catalogueRepository, never()).findByLibelleContainingIgnoreCaseOrderByLibelleAsc(anyString());
    }

    @Test
    void rechercher_filtreParLibelle() {
        CatalogueDenree pommes = denreeAvecId("Pommes");
        when(catalogueRepository.findByLibelleContainingIgnoreCaseOrderByLibelleAsc("pomm"))
            .thenReturn(List.of(pommes));

        List<CatalogueDenreeResponse> resultats = service.rechercher("pomm");

        assertThat(resultats).hasSize(1);
        assertThat(resultats.get(0).libelle()).isEqualTo("Pommes");
        verify(catalogueRepository).findByLibelleContainingIgnoreCaseOrderByLibelleAsc("pomm");
    }

    // === enregistrerSiInconnu ===

    @Test
    void enregistrerSiInconnu_creeQuandAbsent() {
        when(catalogueRepository.existsByLibelleIgnoreCase("Riz")).thenReturn(false);
        when(catalogueRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.enregistrerSiInconnu("Riz");

        verify(catalogueRepository).save(any(CatalogueDenree.class));
    }

    @Test
    void enregistrerSiInconnu_neCreePasQuandPresent() {
        when(catalogueRepository.existsByLibelleIgnoreCase("Riz")).thenReturn(true);

        service.enregistrerSiInconnu("Riz");

        verify(catalogueRepository, never()).save(any());
    }

    @Test
    void enregistrerSiInconnu_ignoreLaContrainteIntegriteEnCasDeConflitConcurrent() {
        when(catalogueRepository.existsByLibelleIgnoreCase("Riz")).thenReturn(false);
        when(catalogueRepository.save(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        // Ne doit pas propager l'exception
        service.enregistrerSiInconnu("Riz");
    }

    // === creer ===

    @Test
    void creer_echoueSiLibelleExiste() {
        when(catalogueRepository.existsByLibelleIgnoreCase("Farine")).thenReturn(true);

        assertThatThrownBy(() -> service.creer("Farine", acteurId))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("Farine");

        verify(catalogueRepository, never()).save(any());
    }

    @Test
    void creer_persisteEtAudit() {
        when(catalogueRepository.existsByLibelleIgnoreCase("Farine")).thenReturn(false);
        CatalogueDenree sauvegardee = denreeAvecId("Farine");
        when(catalogueRepository.save(any())).thenReturn(sauvegardee);

        CatalogueDenreeResponse reponse = service.creer("Farine", acteurId);

        assertThat(reponse.libelle()).isEqualTo("Farine");
        verify(catalogueRepository).save(any(CatalogueDenree.class));
        verify(auditService).tracer(acteurId, "CREATION", "CATALOGUE_DENREE", sauvegardee.getId());
    }

    // === modifier ===

    @Test
    void modifier_echoueSiInexistant() {
        UUID id = UUID.randomUUID();
        when(catalogueRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.modifier(id, "Nouveau libelle", acteurId))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void modifier_mettreAJourLibelle() {
        UUID id = UUID.randomUUID();
        CatalogueDenree existante = denreeAvecIdEtLibelle(id, "Ancien libelle");
        when(catalogueRepository.findById(id)).thenReturn(Optional.of(existante));
        when(catalogueRepository.existsByLibelleIgnoreCase("Nouveau libelle")).thenReturn(false);
        when(catalogueRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CatalogueDenreeResponse reponse = service.modifier(id, "Nouveau libelle", acteurId);

        assertThat(reponse.libelle()).isEqualTo("Nouveau libelle");
        verify(auditService).tracer(acteurId, "MODIFICATION", "CATALOGUE_DENREE", id);
    }

    @Test
    void modifier_echoueSiNouveauLibelleDejaUtilise() {
        UUID id = UUID.randomUUID();
        CatalogueDenree existante = denreeAvecIdEtLibelle(id, "Ancien libelle");
        when(catalogueRepository.findById(id)).thenReturn(Optional.of(existante));
        when(catalogueRepository.existsByLibelleIgnoreCase("Conflit")).thenReturn(true);

        assertThatThrownBy(() -> service.modifier(id, "Conflit", acteurId))
            .isInstanceOf(ConflictException.class);
    }

    // === supprimer ===

    @Test
    void supprimer_echoueSiInexistant() {
        UUID id = UUID.randomUUID();
        when(catalogueRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.supprimer(id, acteurId))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void supprimer_supprimEtAudit() {
        UUID id = UUID.randomUUID();
        CatalogueDenree existante = denreeAvecId("Pommes");
        existante.setId(id);
        when(catalogueRepository.findById(id)).thenReturn(Optional.of(existante));

        service.supprimer(id, acteurId);

        verify(catalogueRepository).delete(existante);
        verify(auditService).tracer(acteurId, "SUPPRESSION", "CATALOGUE_DENREE", id);
    }

    // --- helpers ---

    private CatalogueDenree denreeAvecId(String libelle) {
        CatalogueDenree d = new CatalogueDenree(libelle);
        d.setId(UUID.randomUUID());
        d.setDateCreation(Instant.now());
        d.setDateModification(Instant.now());
        return d;
    }

    private CatalogueDenree denreeAvecIdEtLibelle(UUID id, String libelle) {
        CatalogueDenree d = new CatalogueDenree(libelle);
        d.setId(id);
        d.setDateCreation(Instant.now());
        d.setDateModification(Instant.now());
        return d;
    }
}

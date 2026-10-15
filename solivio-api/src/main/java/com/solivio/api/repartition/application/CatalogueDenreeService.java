package com.solivio.api.repartition.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.repartition.domain.CatalogueDenree;
import com.solivio.api.repartition.infrastructure.persistence.CatalogueDenreeRepository;
import com.solivio.api.repartition.infrastructure.web.dto.CatalogueDenreeResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.web.Assainissement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CatalogueDenreeService {

    private static final Logger log = LoggerFactory.getLogger(CatalogueDenreeService.class);

    private final CatalogueDenreeRepository catalogueRepository;
    private final AuditService auditService;

    public CatalogueDenreeService(
        CatalogueDenreeRepository catalogueRepository,
        AuditService auditService
    ) {
        this.catalogueRepository = catalogueRepository;
        this.auditService = auditService;
    }

    public List<CatalogueDenreeResponse> rechercher(String q) {
        List<CatalogueDenree> resultats = (q == null || q.isBlank())
            ? catalogueRepository.findAllByOrderByLibelleAsc()
            : catalogueRepository.findByLibelleContainingIgnoreCaseOrderByLibelleAsc(q);
        return resultats.stream().map(this::toResponse).toList();
    }

    /**
     * Cree une entree catalogue si le libelle est inconnu.
     * Transaction separee pour ne pas bloquer la transaction principale en cas de conflit concurrent.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrerSiInconnu(String libelle) {
        String libelleSain = Assainissement.nettoyer(libelle);
        if (catalogueRepository.existsByLibelleIgnoreCase(libelleSain)) {
            return;
        }
        try {
            catalogueRepository.save(new CatalogueDenree(libelleSain));
        } catch (DataIntegrityViolationException e) {
            // Insertion concurrente : la denree existe deja, rien a faire.
            log.debug("Catalogue denree deja existante (race condition) : {}", libelleSain);
        }
    }

    @Transactional
    public CatalogueDenreeResponse creer(String libelle, UUID acteurId) {
        String libelleSain = Assainissement.nettoyer(libelle);
        if (catalogueRepository.existsByLibelleIgnoreCase(libelleSain)) {
            throw new ConflictException("Une denrée avec ce libellé existe déjà : " + libelleSain);
        }
        CatalogueDenree denree = catalogueRepository.save(new CatalogueDenree(libelleSain));
        auditService.tracer(acteurId, "CREATION", "CATALOGUE_DENREE", denree.getId());
        return toResponse(denree);
    }

    @Transactional
    public CatalogueDenreeResponse modifier(UUID id, String newLibelle, UUID acteurId) {
        CatalogueDenree denree = catalogueRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Denrée catalogue introuvable : " + id));

        String libelleSain = Assainissement.nettoyer(newLibelle);
        boolean libelleChange = !denree.getLibelle().equalsIgnoreCase(libelleSain);
        if (libelleChange && catalogueRepository.existsByLibelleIgnoreCase(libelleSain)) {
            throw new ConflictException("Une denrée avec ce libellé existe déjà : " + libelleSain);
        }

        denree.setLibelle(libelleSain);
        denree.setDateModification(Instant.now());
        CatalogueDenree sauvegarde = catalogueRepository.save(denree);
        auditService.tracer(acteurId, "MODIFICATION", "CATALOGUE_DENREE", sauvegarde.getId());
        return toResponse(sauvegarde);
    }

    @Transactional
    public void supprimer(UUID id, UUID acteurId) {
        CatalogueDenree denree = catalogueRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Denrée catalogue introuvable : " + id));
        auditService.tracer(acteurId, "SUPPRESSION", "CATALOGUE_DENREE", denree.getId());
        catalogueRepository.delete(denree);
    }

    public List<CatalogueDenreeResponse> listerTous() {
        return catalogueRepository.findAllByOrderByLibelleAsc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private CatalogueDenreeResponse toResponse(CatalogueDenree c) {
        return new CatalogueDenreeResponse(
            c.getId(),
            c.getLibelle(),
            c.getDateCreation(),
            c.getDateModification()
        );
    }
}

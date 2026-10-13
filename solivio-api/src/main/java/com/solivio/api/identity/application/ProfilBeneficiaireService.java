package com.solivio.api.identity.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.domain.ProfilBeneficiaire;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.persistence.ProfilBeneficiaireRepository;
import com.solivio.api.identity.infrastructure.web.dto.ProfilBeneficiaireResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateProfilBeneficiaireRequest;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProfilBeneficiaireService {

    private final CompteRepository compteRepository;
    private final PersonneRepository personneRepository;
    private final ProfilBeneficiaireRepository profilRepository;
    private final MembreAssociationRepository membreRepository;
    private final AuditService auditService;

    public ProfilBeneficiaireService(
        CompteRepository compteRepository,
        PersonneRepository personneRepository,
        ProfilBeneficiaireRepository profilRepository,
        MembreAssociationRepository membreRepository,
        AuditService auditService
    ) {
        this.compteRepository = compteRepository;
        this.personneRepository = personneRepository;
        this.profilRepository = profilRepository;
        this.membreRepository = membreRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public ProfilBeneficiaireResponse lire(UUID compteId) {
        Personne personne = trouverPersonne(compteId);
        ProfilBeneficiaire profil = profilRepository.findByPersonneId(personne.getId())
            .orElse(new ProfilBeneficiaire(personne));
        return toResponse(profil);
    }

    /**
     * RG5 : dossier social d'un beneficiaire, lu par le responsable. Chaque lecture est
     * tracee ; un compte qui n'est pas beneficiaire repond comme une ressource absente.
     */
    @Transactional
    public ProfilBeneficiaireResponse lirePourResponsable(UUID compteId) {
        boolean beneficiaire = membreRepository.findByCompteId(compteId)
            .map(m -> "beneficiaire".equals(m.getRole()))
            .orElse(false);
        if (!beneficiaire) {
            throw new NotFoundException("Dossier beneficiaire introuvable : " + compteId);
        }
        ProfilBeneficiaireResponse dossier = lire(compteId);
        auditService.tracer("PROFIL_BENEFICIAIRE_CONSULTE", "compte", compteId);
        return dossier;
    }

    @Transactional
    public ProfilBeneficiaireResponse mettreAJour(UUID compteId, UpdateProfilBeneficiaireRequest request) {
        Personne personne = trouverPersonne(compteId);
        ProfilBeneficiaire profil = profilRepository.findByPersonneId(personne.getId())
            .orElseGet(() -> new ProfilBeneficiaire(personne));

        if (request.dateNaissance() != null) {
            profil.setDateNaissance(request.dateNaissance());
        }
        if (request.statutBoursier() != null) {
            profil.setStatutBoursier(request.statutBoursier());
        }
        if (request.echelonBourse() != null) {
            profil.setEchelonBourse(request.echelonBourse());
        }
        if (request.categorieNationalite() != null) {
            profil.setCategorieNationalite(request.categorieNationalite());
        }
        if (request.resteAVivreMensuel() != null) {
            profil.setResteAVivreMensuel(request.resteAVivreMensuel());
        }
        if (request.niveauAcademique() != null) {
            profil.setNiveauAcademique(request.niveauAcademique());
        }
        if (request.etablissement() != null) {
            profil.setEtablissement(request.etablissement().isBlank() ? null : request.etablissement().strip());
        }
        if (request.situationLogement() != null) {
            profil.setSituationLogement(request.situationLogement());
        }
        if (request.aEmploiEtudiant() != null) {
            profil.setAEmploiEtudiant(request.aEmploiEtudiant());
        }

        return toResponse(profilRepository.save(profil));
    }

    private Personne trouverPersonne(UUID compteId) {
        String email = compteRepository.findById(compteId)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + compteId))
            .getEmail();
        return personneRepository.findByCompteEmail(email)
            .orElseThrow(() -> new NotFoundException(
                "Profil introuvable pour ce compte."));
    }

    private ProfilBeneficiaireResponse toResponse(ProfilBeneficiaire p) {
        boolean complet = p.getDateNaissance() != null
            && p.getStatutBoursier() != null
            && p.getCategorieNationalite() != null
            && p.getNiveauAcademique() != null
            && p.getSituationLogement() != null;
        return new ProfilBeneficiaireResponse(
            p.getDateNaissance(),
            p.getStatutBoursier(),
            p.getEchelonBourse(),
            p.getCategorieNationalite(),
            p.getResteAVivreMensuel(),
            p.getNiveauAcademique(),
            p.getEtablissement(),
            p.getSituationLogement(),
            p.getAEmploiEtudiant(),
            complet
        );
    }
}

package com.solivio.api.identity.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.web.dto.AssociationAdminResponse;
import com.solivio.api.identity.infrastructure.web.dto.CreateAssociationRequest;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AdminAssociationService {

    private static final int INVITATION_EXPIRATION_DAYS = 7;

    private final AssociationRepository associationRepository;
    private final TenantProvisioningService tenantProvisioningService;
    private final InvitationRepository invitationRepository;
    private final CompteRepository compteRepository;
    private final EmailService emailService;
    private final TransactionTemplate tx;

    public AdminAssociationService(
        AssociationRepository associationRepository,
        TenantProvisioningService tenantProvisioningService,
        InvitationRepository invitationRepository,
        CompteRepository compteRepository,
        EmailService emailService,
        PlatformTransactionManager transactionManager
    ) {
        this.associationRepository = associationRepository;
        this.tenantProvisioningService = tenantProvisioningService;
        this.invitationRepository = invitationRepository;
        this.compteRepository = compteRepository;
        this.emailService = emailService;
        this.tx = new TransactionTemplate(transactionManager);
    }

    public AssociationAdminResponse creer(CreateAssociationRequest request, UUID superAdminId) {
        // Transaction 1 : valider et sauvegarder l'association, puis commiter.
        // Flyway utilise sa propre connexion JDBC et ne peut pas voir un schema
        // cree dans une transaction non commitee : le commit doit preceder provision().
        Association association = tx.execute(status -> {
            if (associationRepository.findBySlug(request.slug()).isPresent()) {
                throw new ConflictException("Un slug identique existe deja : " + request.slug());
            }
            return associationRepository.saveAndFlush(new Association(request.slug(), request.nom()));
        });

        tenantProvisioningService.provision(association);

        // Transaction 2 : enregistrer l'invitation et envoyer l'email.
        tx.execute(status -> {
            Compte inviteur = compteRepository.findById(superAdminId)
                .orElseThrow(() -> new NotFoundException("Compte introuvable : " + superAdminId));
            Invitation invitation = new Invitation(
                request.emailResponsable(), association, "responsable", inviteur,
                Instant.now().plusSeconds(INVITATION_EXPIRATION_DAYS * 24L * 3600)
            );
            invitationRepository.save(invitation);
            emailService.envoyerInvitation(invitation);
            return null;
        });

        return toResponse(association);
    }

    @Transactional(readOnly = true)
    public List<AssociationAdminResponse> lister() {
        return associationRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    private AssociationAdminResponse toResponse(Association a) {
        return new AssociationAdminResponse(
            a.getId(), a.getSlug(), a.getCode(), a.getNom(), a.getStatut(), a.getDateCreation()
        );
    }
}

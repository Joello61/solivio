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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAssociationServiceTest {

    @Mock private AssociationRepository associationRepository;
    @Mock private TenantProvisioningService tenantProvisioningService;
    @Mock private InvitationRepository invitationRepository;
    @Mock private CompteRepository compteRepository;
    @Mock private EmailService emailService;
    @Mock private PlatformTransactionManager transactionManager;

    private AdminAssociationService service;
    private UUID superAdminId;
    private Compte superAdmin;

    @BeforeEach
    void setUp() {
        TransactionStatus txStatus = new SimpleTransactionStatus();
        // lister() n'appelle pas creer(), donc ce stub n'est pas utilise dans tous les tests.
        lenient().when(transactionManager.getTransaction(any())).thenReturn(txStatus);

        service = new AdminAssociationService(
            associationRepository, tenantProvisioningService,
            invitationRepository, compteRepository, emailService,
            transactionManager
        );
        superAdminId = UUID.randomUUID();
        superAdmin = new Compte("admin@solivio.app", "hash", "Admin", "Super");
    }

    @Test
    void creer_creeAssociationProvisionneEtEnvoieInvitation() {
        CreateAssociationRequest request = new CreateAssociationRequest(
            "Association Pilote", "assoc-pilote", "responsable@pilote.fr"
        );
        when(associationRepository.findBySlug("assoc-pilote")).thenReturn(Optional.empty());
        when(associationRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(compteRepository.findById(superAdminId)).thenReturn(Optional.of(superAdmin));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AssociationAdminResponse response = service.creer(request, superAdminId);

        assertThat(response.slug()).isEqualTo("assoc-pilote");
        assertThat(response.nom()).isEqualTo("Association Pilote");
        verify(tenantProvisioningService).provision(any(Association.class));
        verify(invitationRepository).save(any(Invitation.class));
        verify(emailService).envoyerInvitation(any(Invitation.class));
    }

    @Test
    void creer_echoueSlugDuplique() {
        CreateAssociationRequest request = new CreateAssociationRequest(
            "Copie", "slug-existant", "resp@test.com"
        );
        when(associationRepository.findBySlug("slug-existant"))
            .thenReturn(Optional.of(new Association("slug-existant", "Existante")));

        assertThatThrownBy(() -> service.creer(request, superAdminId))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("slug-existant");

        verify(associationRepository, never()).saveAndFlush(any());
        verify(tenantProvisioningService, never()).provision(any());
        verify(emailService, never()).envoyerInvitation(any());
    }

    @Test
    void lister_retourneToutes() {
        when(associationRepository.findAll()).thenReturn(List.of(
            new Association("asso-a", "Association A"),
            new Association("asso-b", "Association B")
        ));

        List<AssociationAdminResponse> result = service.lister();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(AssociationAdminResponse::slug)
            .containsExactly("asso-a", "asso-b");
    }
}

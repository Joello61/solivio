package com.solivio.api.identity.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock private InvitationRepository invitationRepository;
    @Mock private AssociationRepository associationRepository;
    @Mock private CompteRepository compteRepository;
    @Mock private EmailService emailService;

    private InvitationService service;
    private SolivioUserDetails invitantDetails;
    private Compte invitant;
    private Association association;

    @BeforeEach
    void setUp() {
        service = new InvitationService(invitationRepository, associationRepository,
            compteRepository, emailService);
        invitant = new Compte("boss@example.com", "hash", "Boss", "B");
        UUID invitantId = UUID.randomUUID();
        invitantDetails = new SolivioUserDetails(
            invitantId, "boss@example.com", null, "pilote", false, List.of(), true);
        association = new Association("pilote", "Association Pilote");
    }

    @Test
    void inviter_creeInvitationEtEnvoieEmail() {
        when(associationRepository.findBySlug("pilote")).thenReturn(Optional.of(association));
        when(invitationRepository.existsByEmailAndAssociationIdAndStatut(any(), any(), any())).thenReturn(false);
        when(compteRepository.findById(any())).thenReturn(Optional.of(invitant));
        Invitation saved = new Invitation("guest@example.com", association, "benevole",
            invitant, Instant.now().plusSeconds(3600));
        when(invitationRepository.save(any())).thenReturn(saved);

        Invitation result = service.inviter(invitantDetails, "guest@example.com",
            "benevole", null, "pilote");

        assertThat(result).isNotNull();
        verify(invitationRepository).save(any());
        verify(emailService).envoyerInvitation(any());
    }

    @Test
    void inviter_lanceExceptionSiAssociationInconnue() {
        when(associationRepository.findBySlug("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.inviter(invitantDetails, "guest@example.com",
            "benevole", null, "unknown"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Association inconnue");
    }

    @Test
    void inviter_lanceExceptionSiInvitationEnAttente() {
        when(associationRepository.findBySlug("pilote")).thenReturn(Optional.of(association));
        when(invitationRepository.existsByEmailAndAssociationIdAndStatut(
            "guest@example.com", association.getId(), "pending")).thenReturn(true);

        assertThatThrownBy(() -> service.inviter(invitantDetails, "guest@example.com",
            "benevole", null, "pilote"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("deja en attente");
    }

    @Test
    void consulterInvitation_retourneInvitationValide() {
        UUID token = UUID.randomUUID();
        Invitation invitation = new Invitation("guest@example.com", association, "benevole",
            invitant, Instant.now().plusSeconds(3600));
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.of(invitation));

        Invitation result = service.consulterInvitation(token);

        assertThat(result.getEmail()).isEqualTo("guest@example.com");
    }

    @Test
    void consulterInvitation_lanceExceptionSiTokenInconnu() {
        UUID token = UUID.randomUUID();
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consulterInvitation(token))
            .isInstanceOf(IllegalArgumentException.class);
    }
}

package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.shared.exception.ConflictException;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock private InvitationRepository invitationRepository;
    @Mock private CompteRepository compteRepository;
    @Mock private EmailService emailService;

    private InvitationService service;
    private SolivioUserDetails invitantDetails;
    private Compte invitant;

    @BeforeEach
    void setUp() {
        service = new InvitationService(invitationRepository, compteRepository, emailService);
        invitant = new Compte("boss@example.com", "hash", "Boss", "B");
        invitantDetails = new SolivioUserDetails(
            UUID.randomUUID(), "boss@example.com", null, false, List.of(), true);
    }

    @Test
    void inviterResponsable_creeInvitationEtEnvoieEmail() {
        when(invitationRepository.existsByEmailAndStatut("guest@example.com", "pending")).thenReturn(false);
        when(compteRepository.findById(any())).thenReturn(Optional.of(invitant));

        Invitation result = service.inviterResponsable(invitantDetails, "guest@example.com");

        assertThat(result.getRole()).isEqualTo("responsable");
        assertThat(result.getInvitePar()).isSameAs(invitant);
        verify(invitationRepository).save(result);
        verify(emailService).envoyerInvitation(result);
    }

    @Test
    void inviterResponsable_lanceExceptionSiInvitationEnAttente() {
        when(invitationRepository.existsByEmailAndStatut("guest@example.com", "pending")).thenReturn(true);

        assertThatThrownBy(() -> service.inviterResponsable(invitantDetails, "guest@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("déjà en attente");
        verify(emailService, never()).envoyerInvitation(any());
    }

    // Une personne deja inscrite se nomme responsable depuis la liste des membres (ADR-012).
    @Test
    void inviterResponsable_refuseUnePersonneQuiADejaUnCompte() {
        when(compteRepository.existsByEmail("membre@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.inviterResponsable(invitantDetails, "membre@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("déjà un compte");
        verify(emailService, never()).envoyerInvitation(any());
    }

    @Test
    void consulterInvitation_retourneInvitationValide() {
        UUID token = UUID.randomUUID();
        Invitation invitation = new Invitation("guest@example.com", "benevole",
            invitant, Instant.now().plusSeconds(3600));
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.of(invitation));

        assertThat(service.consulterInvitation(token).getEmail()).isEqualTo("guest@example.com");
    }

    @Test
    void consulterInvitation_lanceExceptionSiExpiree() {
        UUID token = UUID.randomUUID();
        Invitation invitation = new Invitation("guest@example.com", "benevole",
            invitant, Instant.now().minusSeconds(60));
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> service.consulterInvitation(token))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void consulterInvitation_lanceExceptionSiTokenInconnu() {
        UUID token = UUID.randomUUID();
        when(invitationRepository.findByTokenWithDetails(token)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consulterInvitation(token))
            .isInstanceOf(IllegalArgumentException.class);
    }
}

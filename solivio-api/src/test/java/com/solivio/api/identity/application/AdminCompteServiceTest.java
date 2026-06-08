package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import com.solivio.api.identity.infrastructure.web.dto.CompteAdminResponse;
import com.solivio.api.shared.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminCompteServiceTest {

    @Mock private CompteRepository compteRepository;
    @Mock private MembreAssociationRepository membreRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;

    private AdminCompteService service;
    private UUID compteId;
    private Compte compte;

    @BeforeEach
    void setUp() {
        service = new AdminCompteService(compteRepository, membreRepository, refreshTokenRepository);
        compteId = UUID.randomUUID();
        compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
    }

    @Test
    void lister_retournePageDeComptes() {
        Page<Compte> page = new PageImpl<>(List.of(compte));
        when(compteRepository.rechercherComptes(any(), any(Pageable.class))).thenReturn(page);
        when(membreRepository.findActivesByCompteId(any())).thenReturn(List.of());

        Page<CompteAdminResponse> result = service.lister(null, 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).email()).isEqualTo("alice@example.com");
    }

    @Test
    void mettreAJourStatut_desactiveEtRevoqueTokens() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(compteRepository.save(any())).thenReturn(compte);
        when(membreRepository.findActivesByCompteId(any())).thenReturn(List.of());

        service.mettreAJourStatut(compteId, false);

        assertThat(compte.isActif()).isFalse();
        verify(refreshTokenRepository).revoquerTousParCompte(compteId);
    }

    @Test
    void mettreAJourStatut_activeSansRevoquerTokens() {
        compte.setActif(false);
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(compteRepository.save(any())).thenReturn(compte);
        when(membreRepository.findActivesByCompteId(any())).thenReturn(List.of());

        service.mettreAJourStatut(compteId, true);

        assertThat(compte.isActif()).isTrue();
        // Lors de la reactivation, pas de revocation necessaire.
        verify(refreshTokenRepository, org.mockito.Mockito.never()).revoquerTousParCompte(any());
    }

    @Test
    void mettreAJourSuperAdmin_basculeLeFlag() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(compteRepository.save(any())).thenReturn(compte);
        when(membreRepository.findActivesByCompteId(any())).thenReturn(List.of());

        service.mettreAJourSuperAdmin(compteId, true);

        assertThat(compte.isSuperAdmin()).isTrue();
    }

    @Test
    void supprimer_revoqueSessiosEtSupprime() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));

        service.supprimer(compteId);

        verify(refreshTokenRepository).revoquerTousParCompte(compteId);
        verify(compteRepository).delete(compte);
    }

    @Test
    void lireParId_lanceNotFoundSiAbsent() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.lireParId(compteId))
            .isInstanceOf(NotFoundException.class);
    }
}

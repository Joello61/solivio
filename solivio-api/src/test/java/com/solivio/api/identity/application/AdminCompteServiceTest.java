package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminCompteServiceTest {

    @Mock private CompteRepository compteRepository;
    @Mock private MembreAssociationRepository membreRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private GardeMembres garde;

    private AdminCompteService service;
    private UUID compteId;
    private final UUID acteurId = UUID.randomUUID();
    private Compte compte;

    @BeforeEach
    void setUp() {
        service = new AdminCompteService(compteRepository, membreRepository, refreshTokenRepository, garde);
        compteId = UUID.randomUUID();
        compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
    }

    @Test
    void lister_retournePageDeComptes() {
        Page<Compte> page = new PageImpl<>(List.of(compte));
        when(compteRepository.rechercherComptes(any(), any(Pageable.class))).thenReturn(page);
        when(membreRepository.findByCompteId(any())).thenReturn(Optional.empty());

        Page<CompteAdminResponse> result = service.lister(null, 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().getFirst().email()).isEqualTo("alice@example.com");
        assertThat(result.getContent().getFirst().role()).isNull();
    }

    @Test
    void lireParId_exposeLeRoleEtLeStatutDuMembre() {
        MembreAssociation membre = new MembreAssociation(compte, "coordinateur");
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(membreRepository.findByCompteId(any())).thenReturn(Optional.of(membre));

        CompteAdminResponse result = service.lireParId(compteId);

        assertThat(result.role()).isEqualTo("coordinateur");
        assertThat(result.statutMembre()).isEqualTo("actif");
    }

    @Test
    void mettreAJourStatut_desactiveEtRevoqueTokens() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(compteRepository.save(any())).thenReturn(compte);
        when(membreRepository.findByCompteId(any())).thenReturn(Optional.empty());

        service.mettreAJourStatut(compteId, false, acteurId);

        assertThat(compte.isActif()).isFalse();
        verify(refreshTokenRepository).revoquerTousParCompte(compteId);
    }

    @Test
    void mettreAJourStatut_activeSansRevoquerTokens() {
        compte.setActif(false);
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(compteRepository.save(any())).thenReturn(compte);
        when(membreRepository.findByCompteId(any())).thenReturn(Optional.empty());

        service.mettreAJourStatut(compteId, true, acteurId);

        assertThat(compte.isActif()).isTrue();
        // Lors de la reactivation, pas de revocation necessaire.
        verify(refreshTokenRepository, org.mockito.Mockito.never()).revoquerTousParCompte(any());
    }

    @Test
    void mettreAJourSuperAdmin_basculeLeFlag() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(compteRepository.save(any())).thenReturn(compte);
        when(membreRepository.findByCompteId(any())).thenReturn(Optional.empty());

        service.mettreAJourSuperAdmin(compteId, true, acteurId);

        assertThat(compte.isSuperAdmin()).isTrue();
    }

    @Test
    void supprimer_revoqueSessiosEtSupprime() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));

        service.supprimer(compteId, acteurId);

        verify(garde).interdireSurSoi(acteurId, compteId);
        verify(garde).garderUnResponsable(compteId);
        verify(refreshTokenRepository).revoquerTousParCompte(compteId);
        verify(compteRepository).delete(compte);
    }

    @Test
    void mettreAJourStatut_desactivationVerifieQuUnResponsableReste() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(compteRepository.save(any())).thenReturn(compte);
        when(membreRepository.findByCompteId(any())).thenReturn(Optional.empty());

        service.mettreAJourStatut(compteId, false, acteurId);

        verify(garde).interdireSurSoi(acteurId, compteId);
        verify(garde).garderUnResponsable(compteId);
    }

    @Test
    void lireParId_lanceNotFoundSiAbsent() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.lireParId(compteId))
            .isInstanceOf(NotFoundException.class);
    }
}

package com.solivio.api.evenement.application;

import com.solivio.api.evenement.domain.Evenement;
import com.solivio.api.evenement.domain.ModeInscription;
import com.solivio.api.evenement.domain.ParticipationEvenement;
import com.solivio.api.evenement.domain.PublicCible;
import com.solivio.api.evenement.domain.RoleParticipation;
import com.solivio.api.evenement.domain.TypeEvenement;
import com.solivio.api.evenement.infrastructure.persistence.EvenementRepository;
import com.solivio.api.evenement.infrastructure.persistence.ParticipationEvenementRepository;
import com.solivio.api.shared.evenement.EvenementQueryPort.EvenementInfo;
import com.solivio.api.shared.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvenementQueryAdapterTest {

    @Mock private EvenementRepository evenementRepository;
    @Mock private ParticipationEvenementRepository participationRepository;

    private EvenementQueryAdapter adapter;

    private UUID evenementId;
    private Evenement evenement;

    @BeforeEach
    void setUp() {
        adapter = new EvenementQueryAdapter(evenementRepository, participationRepository);
        evenementId = UUID.randomUUID();
        evenement = new Evenement(
            "Concert de printemps", null, TypeEvenement.FETE,
            null, "Parc central", 48.85, 2.35,
            ZonedDateTime.now().plusDays(10),
            ZonedDateTime.now().plusDays(10).plusHours(3),
            true, true, PublicCible.TOUS, ModeInscription.OBLIGATOIRE,
            20, 200, UUID.randomUUID()
        );
        evenement.setId(evenementId);
    }

    @Test
    void trouverEvenementDetails_retourneLInfoComplete() {
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenement));

        EvenementInfo info = adapter.trouverEvenementDetails(evenementId);

        assertThat(info.id()).isEqualTo(evenementId);
        assertThat(info.titre()).isEqualTo("Concert de printemps");
        assertThat(info.lieuAdresseFormatee()).isEqualTo("Parc central");
        assertThat(info.aBesoiNStaff()).isTrue();
        assertThat(info.ouvertParticipants()).isTrue();
        assertThat(info.publicParticipants()).isEqualTo("TOUS");
        assertThat(info.modeInscription()).isEqualTo("OBLIGATOIRE");
        assertThat(info.raisonAnnulation()).isNull();
    }

    @Test
    void trouverEvenementDetails_avecPublicParticipantsNull_retourneNullPourPublic() {
        Evenement sans = new Evenement(
            "Atelier interne", null, TypeEvenement.AUTRE,
            null, null, null, null,
            ZonedDateTime.now().plusDays(5),
            ZonedDateTime.now().plusDays(5).plusHours(2),
            false, false, null, ModeInscription.SANS_INSCRIPTION,
            null, null, UUID.randomUUID()
        );
        sans.setId(evenementId);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(sans));

        EvenementInfo info = adapter.trouverEvenementDetails(evenementId);

        assertThat(info.publicParticipants()).isNull();
        assertThat(info.modeInscription()).isEqualTo("SANS_INSCRIPTION");
    }

    @Test
    void trouverEvenementDetails_evenementInexistant_leveNotFoundException() {
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adapter.trouverEvenementDetails(evenementId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining(evenementId.toString());
    }

    @Test
    void trouverInscrits_retourneLesPersonneIdsOrdonnees() {
        UUID p1 = UUID.randomUUID();
        UUID p2 = UUID.randomUUID();
        ParticipationEvenement part1 = new ParticipationEvenement(evenementId, p1, RoleParticipation.PARTICIPANT);
        ParticipationEvenement part2 = new ParticipationEvenement(evenementId, p2, RoleParticipation.STAFF);
        when(participationRepository.findByEvenementIdOrderByDateInscriptionAsc(evenementId))
            .thenReturn(List.of(part1, part2));

        List<UUID> inscrits = adapter.trouverInscrits(evenementId);

        assertThat(inscrits).containsExactly(p1, p2);
    }

    @Test
    void trouverInscrits_aucunInscrit_retourneListeVide() {
        when(participationRepository.findByEvenementIdOrderByDateInscriptionAsc(evenementId))
            .thenReturn(List.of());

        List<UUID> inscrits = adapter.trouverInscrits(evenementId);

        assertThat(inscrits).isEmpty();
    }
}

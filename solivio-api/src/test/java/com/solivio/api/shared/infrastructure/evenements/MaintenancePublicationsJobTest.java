package com.solivio.api.shared.infrastructure.evenements;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.modulith.events.CompletedEventPublications;
import org.springframework.modulith.events.EventPublication;
import org.springframework.modulith.events.FailedEventPublications;
import org.springframework.modulith.events.ResubmissionOptions;

import java.util.function.Predicate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MaintenancePublicationsJobTest {

    private final FailedEventPublications failed = mock(FailedEventPublications.class);
    private final CompletedEventPublications completed = mock(CompletedEventPublications.class);
    private final MaintenancePublicationsJob job = new MaintenancePublicationsJob(failed, completed);

    @Test
    void relancerLesEchecs_neRelanceQueLesPublicationsAssezAnciennes() {
        job.relancerLesEchecs();

        ArgumentCaptor<ResubmissionOptions> options = ArgumentCaptor.forClass(ResubmissionOptions.class);
        verify(failed).resubmit(options.capture());
        assertThat(options.getValue().getMinAge()).isEqualTo(MaintenancePublicationsJob.AGE_MINIMUM_RELANCE);
    }

    // Au-dela du plafond, la publication reste en echec et declenche l'alerte au lieu
    // de renvoyer indefiniment.
    @Test
    void relancerLesEchecs_arreteApresCinqTentatives() {
        job.relancerLesEchecs();

        ArgumentCaptor<ResubmissionOptions> options = ArgumentCaptor.forClass(ResubmissionOptions.class);
        verify(failed).resubmit(options.capture());
        Predicate<EventPublication> filtre = options.getValue().getFilter();
        assertThat(filtre.test(publicationAvecTentatives(4))).isTrue();
        assertThat(filtre.test(publicationAvecTentatives(MaintenancePublicationsJob.MAX_TENTATIVES))).isFalse();
    }

    @Test
    void purgerLArchive_supprimeLesPublicationsAuDelaDeLaConservation() {
        job.purgerLArchive();

        verify(completed).deletePublicationsOlderThan(MaintenancePublicationsJob.CONSERVATION_ARCHIVE);
    }

    private static EventPublication publicationAvecTentatives(int tentatives) {
        EventPublication publication = mock(EventPublication.class);
        when(publication.getCompletionAttempts()).thenReturn(tentatives);
        return publication;
    }
}

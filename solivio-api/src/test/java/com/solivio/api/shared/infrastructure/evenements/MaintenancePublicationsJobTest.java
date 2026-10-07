package com.solivio.api.shared.infrastructure.evenements;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.modulith.events.CompletedEventPublications;
import org.springframework.modulith.events.FailedEventPublications;
import org.springframework.modulith.events.ResubmissionOptions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

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

    @Test
    void purgerLArchive_supprimeLesPublicationsAuDelaDeLaConservation() {
        job.purgerLArchive();

        verify(completed).deletePublicationsOlderThan(MaintenancePublicationsJob.CONSERVATION_ARCHIVE);
    }
}

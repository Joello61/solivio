package com.solivio.api.notification.infrastructure.evenements;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class RappelEventPublisher {

    private final ApplicationEventPublisher events;

    public RappelEventPublisher(ApplicationEventPublisher events) {
        this.events = events;
    }

    public void publierRappelVeille(UUID distributionId) {
        events.publishEvent(new RappelVeille(distributionId));
    }
}

package com.solivio.api.notification.infrastructure.persistence;

import com.solivio.api.notification.domain.Notification;
import com.solivio.api.notification.domain.StatutNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    boolean existsByCleIdempotenceAndPersonneIdAndStatut(
        String cleIdempotence, UUID personneId, StatutNotification statut);
}

package com.solivio.api.collecte.application;

import com.solivio.api.collecte.infrastructure.persistence.MissionCollecteRepository;
import com.solivio.api.shared.collecte.MissionCollecteQueryPort;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MissionCollecteQueryAdapter implements MissionCollecteQueryPort {

    private final MissionCollecteRepository missionRepository;

    public MissionCollecteQueryAdapter(MissionCollecteRepository missionRepository) {
        this.missionRepository = missionRepository;
    }

    @Override
    public MissionInfo trouverMissionDetails(UUID missionId) {
        return missionRepository.findById(missionId)
            .map(m -> new MissionInfo(
                m.getId(),
                m.getTitre(),
                m.getDateHeure(),
                m.getLieuCollecteAdresse(),
                m.getLieuDepotAdresse()
            ))
            .orElseThrow(() -> new NotFoundException("Mission de collecte introuvable : " + missionId));
    }
}

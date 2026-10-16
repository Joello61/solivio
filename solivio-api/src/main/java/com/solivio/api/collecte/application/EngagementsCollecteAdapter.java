package com.solivio.api.collecte.application;

import com.solivio.api.collecte.domain.StatutMission;
import com.solivio.api.collecte.infrastructure.persistence.MissionCollecteRepository;
import com.solivio.api.shared.engagement.EngagementsAVenirPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Une mission prise et pas encore deposee engage le benevole qui l'assure. */
@Service
@Transactional(readOnly = true)
public class EngagementsCollecteAdapter implements EngagementsAVenirPort {

    private static final List<StatutMission> EN_COURS =
        List.of(StatutMission.PRISE_EN_CHARGE, StatutMission.COLLECTE_EFFECTUEE);

    private final MissionCollecteRepository missionRepository;

    public EngagementsCollecteAdapter(MissionCollecteRepository missionRepository) {
        this.missionRepository = missionRepository;
    }

    @Override
    public boolean aDesEngagementsAVenir(UUID personneId) {
        return missionRepository.countByBenevoleIdAndStatutIn(personneId, EN_COURS) > 0;
    }
}

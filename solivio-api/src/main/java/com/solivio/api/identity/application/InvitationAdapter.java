package com.solivio.api.identity.application;

import com.solivio.api.shared.identity.InvitationPort;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class InvitationAdapter implements InvitationPort {

    private final InvitationService invitationService;

    public InvitationAdapter(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @Override
    public void inviterBenevole(String emailInvite, UUID compteIdInvitant, String tenantSlug) {
        invitationService.inviterParCompteId(compteIdInvitant, emailInvite, "benevole", null, tenantSlug);
    }
}

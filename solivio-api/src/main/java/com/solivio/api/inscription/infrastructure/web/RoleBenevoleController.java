package com.solivio.api.inscription.infrastructure.web;

import com.solivio.api.inscription.application.RoleBenevoleService;
import com.solivio.api.inscription.infrastructure.web.dto.AssignerRoleRequest;
import com.solivio.api.inscription.infrastructure.web.dto.RoleBenevoleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/distributions/{distributionId}/inscriptions/{inscriptionId}/roles")
@PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','COORDINATEUR')")
public class RoleBenevoleController {

    private final RoleBenevoleService roleBenevoleService;

    public RoleBenevoleController(RoleBenevoleService roleBenevoleService) {
        this.roleBenevoleService = roleBenevoleService;
    }

    @GetMapping
    public ResponseEntity<List<RoleBenevoleResponse>> lister(
        @PathVariable UUID inscriptionId
    ) {
        return ResponseEntity.ok(roleBenevoleService.lister(inscriptionId));
    }

    @PostMapping
    public ResponseEntity<RoleBenevoleResponse> assigner(
        @PathVariable UUID inscriptionId,
        @RequestBody AssignerRoleRequest request
    ) {
        RoleBenevoleResponse response = roleBenevoleService.assigner(
            inscriptionId, request.typeRoleId(), request.libelleLibre()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{roleId}")
    public ResponseEntity<Void> retirer(
        @PathVariable UUID inscriptionId,
        @PathVariable UUID roleId
    ) {
        roleBenevoleService.retirer(inscriptionId, roleId);
        return ResponseEntity.noContent().build();
    }
}

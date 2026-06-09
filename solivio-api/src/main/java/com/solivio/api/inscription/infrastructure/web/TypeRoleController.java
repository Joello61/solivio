package com.solivio.api.inscription.infrastructure.web;

import com.solivio.api.inscription.application.TypeRoleService;
import com.solivio.api.inscription.infrastructure.web.dto.TypeRoleRequest;
import com.solivio.api.inscription.infrastructure.web.dto.TypeRoleResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/types-roles")
public class TypeRoleController {

    private final TypeRoleService typeRoleService;

    public TypeRoleController(TypeRoleService typeRoleService) {
        this.typeRoleService = typeRoleService;
    }

    @GetMapping
    public ResponseEntity<List<TypeRoleResponse>> lister() {
        return ResponseEntity.ok(typeRoleService.lister());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','COORDINATEUR')")
    public ResponseEntity<TypeRoleResponse> creer(@Valid @RequestBody TypeRoleRequest request) {
        TypeRoleResponse response = typeRoleService.creer(request.libelle(), request.parentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','COORDINATEUR')")
    public ResponseEntity<TypeRoleResponse> modifier(
        @PathVariable UUID id,
        @Valid @RequestBody TypeRoleRequest request
    ) {
        return ResponseEntity.ok(typeRoleService.modifier(id, request.libelle()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ResponseEntity<Void> archiver(@PathVariable UUID id) {
        typeRoleService.archiver(id);
        return ResponseEntity.noContent().build();
    }
}

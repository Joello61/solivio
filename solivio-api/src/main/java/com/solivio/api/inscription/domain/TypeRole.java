package com.solivio.api.inscription.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "type_role")
@Getter
@Setter
@NoArgsConstructor
public class TypeRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private TypeRole parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    private List<TypeRole> sousTypes = new ArrayList<>();

    @Column(nullable = false, length = 200)
    private String libelle;

    @Column(nullable = false)
    private boolean actif = true;

    public TypeRole(TypeRole parent, String libelle) {
        this.parent = parent;
        this.libelle = libelle;
    }
}

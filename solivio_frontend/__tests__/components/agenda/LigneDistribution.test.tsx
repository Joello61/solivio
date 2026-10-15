import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { List } from "@/components/ui/list-row";
import { LigneDistribution } from "@/components/agenda/LigneDistribution";
import type { DistributionResponse } from "@/types/distribution";

const distribution: DistributionResponse = {
  id: "d1",
  titre: "Distribution alimentaire du 22/10",
  description: null,
  lieu: {
    placeId: null,
    nom: "Campus Rangueil",
    adresseFormatee: "135 avenue de Rangueil",
    latitude: null,
    longitude: null,
    numeroRue: null,
    voie: null,
    codePostal: null,
    ville: null,
  },
  date: "2026-10-22",
  statut: "PUBLIEE",
  capaciteBeneficiaires: 80,
  capaciteBenevoles: 14,
  modeCreneau: "CRENEAU_UNIQUE",
  baseRepartition: "INSCRITS",
  motifAnnulation: null,
  dateCreation: "2026-10-01T10:00:00Z",
  creneaux: [{ id: "c1", heureDebut: "17:30:00", heureFin: "19:30:00", capacite: 80, placesRestantes: 0, confirmes: null, enAttente: null }],
  remplissage: {
    placesRestantesBeneficiaires: 0,
    placesRestantesBenevoles: 5,
    beneficiairesConfirmes: null,
    beneficiairesEnAttente: null,
    benevolesConfirmes: null,
    benevolesEnAttente: null,
  },
};

function afficher(props: Partial<React.ComponentProps<typeof LigneDistribution>> = {}) {
  return render(
    <List>
      <LigneDistribution distribution={distribution} type="BENEFICIAIRE" {...props} />
    </List>,
  );
}

describe("LigneDistribution", () => {
  it("montre l'heure, le lieu et les places sans repeter le titre", () => {
    afficher();
    const lien = screen.getByRole("link");
    expect(lien).toHaveAttribute("href", "/distributions/d1");
    expect(lien).toHaveTextContent("jeudi 22 octobre, 17:30 - 19:30");
    expect(lien).toHaveTextContent("Campus Rangueil");
    expect(screen.getByText("Complet, liste d'attente possible")).toBeInTheDocument();
    expect(screen.queryByText(/Distribution alimentaire/)).not.toBeInTheDocument();
  });

  it("montre les places benevoles a un benevole", () => {
    afficher({ type: "BENEVOLE" });
    expect(screen.getByText("5 places dans l'équipe")).toBeInTheDocument();
  });

  it("remplace les places par le statut de l'inscription du membre", () => {
    afficher({ monStatut: "LISTE_ATTENTE" });
    expect(screen.getByText("Liste d'attente")).toBeInTheDocument();
    expect(screen.queryByText(/places restantes|Complet/)).not.toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TableInscrits } from "@/components/distributions/TableInscrits";
import type { InscriptionResponse } from "@/types/distribution";

const inscrit = (partiel: Partial<InscriptionResponse>): InscriptionResponse => ({
  id: partiel.nom ?? "i",
  distributionId: "d1",
  creneauId: "c1",
  nom: "Nom",
  prenom: "Prénom",
  type: "BENEFICIAIRE",
  statut: "CONFIRMEE",
  rangListeAttente: null,
  roles: [],
  presence: "NON_POINTE",
  absenceDeduite: false,
  dateInscription: "2026-10-10T10:00:00Z",
  nombreAbsencesPassees: 0,
  ...partiel,
});

const inscrits = [
  inscrit({ nom: "Diallo", prenom: "Amina", nombreAbsencesPassees: 1 }),
  inscrit({ nom: "Nguyen", prenom: "Théo" }),
  inscrit({ nom: "Martin", prenom: "Lucas", type: "BENEVOLE", roles: [{ id: "r", typeRoleId: null, libelle: "Accueil" }] }),
  inscrit({ nom: "Bamba", prenom: "Hugo", statut: "LISTE_ATTENTE", rangListeAttente: 1 }),
];

describe("TableInscrits", () => {
  it("separe beneficiaires, benevoles et liste d'attente", async () => {
    render(<TableInscrits inscrits={inscrits} horaires={{ c1: "17:30 - 17:45" }} avecPresence={false} />);
    const filtre = screen.getByRole("group", { name: "Inscrits à afficher" });
    expect(within(filtre).getByRole("button", { name: /Bénéficiaires 2/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("1 absence passée").length).toBeGreaterThan(0);

    await userEvent.click(within(filtre).getByRole("button", { name: /Bénévoles 1/ }));
    expect(screen.getAllByText("Accueil").length).toBeGreaterThan(0);
    await userEvent.click(within(filtre).getByRole("button", { name: /Attente 1/ }));
    expect(screen.getAllByText("Rang 1").length).toBeGreaterThan(0);
  });

  it("cherche sans tenir compte des accents", async () => {
    render(<TableInscrits inscrits={inscrits} horaires={{}} avecPresence={false} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Chercher une personne" }), "theo");
    expect(screen.getAllByText("Nguyen Théo").length).toBeGreaterThan(0);
    expect(screen.queryByText("Diallo Amina")).not.toBeInTheDocument();
  });
});

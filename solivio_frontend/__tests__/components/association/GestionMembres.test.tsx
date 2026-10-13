import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GestionMembres } from "@/components/association/GestionMembres";
import type { MembreResponse } from "@/types/association";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/api/association", () => ({
  mettreAJourRoleMembre: vi.fn().mockResolvedValue({}),
  supprimerMembre: vi.fn().mockResolvedValue(undefined),
  changerStatutMembre: vi.fn().mockResolvedValue({}),
}));

const membres: MembreResponse[] = [
  {
    compteId: "user-1",
    nom: "Dupont",
    prenom: "Alice",
    email: "alice@example.com",
    role: "benevole",
    coordoType: null,
    statut: "actif",
    dateDebut: "2026-01-01",
  },
  {
    compteId: "user-2",
    nom: "Martin",
    prenom: "Bob",
    email: "bob@example.com",
    role: "coordinateur",
    coordoType: null,
    statut: "actif",
    dateDebut: "2026-02-01",
  },
];

describe("GestionMembres", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le message vide si aucun membre", () => {
    render(<GestionMembres membres={[]} currentUserId="user-1" />);
    expect(screen.getByText(/aucun membre/i)).toBeInTheDocument();
  });

  it("affiche la liste des membres", () => {
    render(<GestionMembres membres={membres} currentUserId="other" />);
    expect(screen.getAllByText("Alice Dupont")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Bob Martin")[0]).toBeInTheDocument();
  });

  it("affiche les libelles des roles et des filtres, pas les valeurs brutes", () => {
    render(<GestionMembres membres={membres} currentUserId="other" />);
    expect(screen.getAllByRole("combobox").map((c) => c.textContent)).toContain("Coordinateur▼");
    expect(screen.queryByText("coordinateur")).not.toBeInTheDocument();
    expect(screen.queryByText("tous")).not.toBeInTheDocument();
  });

  it("propose le dossier des beneficiaires au responsable seulement", () => {
    const avecBeneficiaire: MembreResponse[] = [
      ...membres,
      { ...membres[0], compteId: "user-3", prenom: "Chloe", nom: "Petit", email: "chloe@example.com", role: "beneficiaire" },
    ];
    const { rerender } = render(
      <GestionMembres membres={avecBeneficiaire} currentUserId="other" peutVoirDossiers />,
    );
    const liens = screen.getAllByRole("link", { name: /Voir le dossier/ });
    expect(liens.every((l) => l.getAttribute("href") === "/association/membres/user-3/dossier")).toBe(true);

    expect(screen.getAllByText("Bénéficiaire").length).toBeGreaterThan(0);
    rerender(<GestionMembres membres={avecBeneficiaire} currentUserId="other" />);
    expect(screen.queryByRole("link", { name: /Voir le dossier/ })).not.toBeInTheDocument();
  });

  it("affiche les emails", () => {
    render(<GestionMembres membres={membres} currentUserId="other" />);
    expect(screen.getAllByText("alice@example.com")[0]).toBeInTheDocument();
  });

  it("ne montre pas le selecteur de role pour l'utilisateur courant", () => {
    render(<GestionMembres membres={membres} currentUserId="user-1" />);
    const selecteurs = screen.queryAllByRole("combobox");
    // 2 filtres toolbar + Bob mobile (user-1=Alice pas de selecteur) + Bob desktop = 4
    expect(selecteurs).toHaveLength(4);
  });

  it("appelle mettreAJourRoleMembre quand on change le role", async () => {
    const user = userEvent.setup();
    const { mettreAJourRoleMembre } = await import("@/lib/api/association");
    render(<GestionMembres membres={membres} currentUserId="user-1" />);

    // Ouvre le select du role de Bob (index 2 : apres les 2 filtres toolbar)
    await user.click(screen.getAllByRole("combobox")[2]);

    // Attend l'ouverture de la liste et clique sur Responsable
    await waitFor(async () => {
      const option = screen.getByRole("option", { name: /Responsable/i });
      await user.click(option);
    });

    await waitFor(() => {
      expect(mettreAJourRoleMembre).toHaveBeenCalledWith("user-2", { role: "responsable" });
    });
  });

  it("ne montre pas le bouton Retirer pour l'utilisateur courant", () => {
    render(<GestionMembres membres={membres} currentUserId="user-1" />);
    const boutons = screen.getAllByRole("button", { name: /retirer/i });
    // Bob a 2 boutons Retirer : un dans la vue mobile, un dans la vue desktop
    expect(boutons).toHaveLength(2);
  });

  it("affiche les boutons Suspendre pour les membres autres que soi", () => {
    render(<GestionMembres membres={membres} currentUserId="user-1" />);
    const boutons = screen.getAllByRole("button", { name: /suspendre/i });
    // Bob a 2 boutons Suspendre : mobile et desktop
    expect(boutons).toHaveLength(2);
  });

  it("appelle changerStatutMembre lors du clic Suspendre", async () => {
    const { changerStatutMembre } = await import("@/lib/api/association");
    render(<GestionMembres membres={membres} currentUserId="user-1" />);

    // Ouvre le dialog via le premier bouton Suspendre (vue mobile)
    fireEvent.click(screen.getAllByRole("button", { name: /suspendre/i })[0]);

    // Attend l'affichage du dialog et confirme
    await waitFor(() => {
      expect(screen.getByText("Suspendre le membre")).toBeInTheDocument();
    });
    const boutons = screen.getAllByRole("button", { name: /suspendre/i });
    fireEvent.click(boutons[boutons.length - 1]);

    await waitFor(() => {
      expect(changerStatutMembre).toHaveBeenCalledWith("user-2", "suspendu");
    });
  });

  it("affiche Reactiver pour un membre deja suspendu", () => {
    const membresSuspendus = [
      { ...membres[0] },
      { ...membres[1], statut: "suspendu" },
    ];
    render(<GestionMembres membres={membresSuspendus} currentUserId="user-1" />);
    expect(screen.getAllByRole("button", { name: /réactiver/i })[0]).toBeInTheDocument();
  });
});

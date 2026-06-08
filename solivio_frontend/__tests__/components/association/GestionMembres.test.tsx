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
    expect(screen.getByText("Alice Dupont")).toBeInTheDocument();
    expect(screen.getByText("Bob Martin")).toBeInTheDocument();
  });

  it("affiche les emails", () => {
    render(<GestionMembres membres={membres} currentUserId="other" />);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("ne montre pas le selecteur de role pour l'utilisateur courant", () => {
    render(<GestionMembres membres={membres} currentUserId="user-1" />);
    const selecteurs = screen.queryAllByRole("combobox");
    // user-1 (Alice) n'a pas de selecteur, user-2 (Bob) en a un
    expect(selecteurs).toHaveLength(1);
  });

  it("appelle mettreAJourRoleMembre quand on change le role", async () => {
    const user = userEvent.setup();
    const { mettreAJourRoleMembre } = await import("@/lib/api/association");
    render(<GestionMembres membres={membres} currentUserId="user-1" />);

    // Ouvre le select base-ui via userEvent
    await user.click(screen.getByRole("combobox"));

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
    // Seul Bob a le bouton Retirer (pas Alice qui est l'utilisateur courant)
    expect(boutons).toHaveLength(1);
  });

  it("affiche les boutons Suspendre pour les membres autres que soi", () => {
    render(<GestionMembres membres={membres} currentUserId="user-1" />);
    const boutons = screen.getAllByRole("button", { name: /suspendre/i });
    expect(boutons).toHaveLength(1);
  });

  it("appelle changerStatutMembre lors du clic Suspendre", async () => {
    const { changerStatutMembre } = await import("@/lib/api/association");
    render(<GestionMembres membres={membres} currentUserId="user-1" />);

    // Ouvre le dialog de confirmation
    fireEvent.click(screen.getByRole("button", { name: /suspendre/i }));

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
    expect(screen.getByRole("button", { name: /reactiver/i })).toBeInTheDocument();
  });
});

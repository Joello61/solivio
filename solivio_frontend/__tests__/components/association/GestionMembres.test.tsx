import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GestionMembres } from "@/components/association/GestionMembres";
import * as api from "@/lib/api/association";
import type { MembreResponse } from "@/types/association";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/lib/api/association", () => ({
  mettreAJourRolesMembre: vi.fn().mockResolvedValue({}),
  supprimerMembre: vi.fn().mockResolvedValue(undefined),
  changerStatutMembre: vi.fn().mockResolvedValue({}),
}));

const membre = (compteId: string, nom: string, prenom: string, role: string | string[], statut = "actif"): MembreResponse => ({
  compteId,
  nom,
  prenom,
  email: `${prenom.toLowerCase()}@example.com`,
  roles: Array.isArray(role) ? role : [role],
  coordoType: null,
  statut,
  dateDebut: "2026-01-01",
});

const membres = [
  membre("u1", "Dupont", "Alice", "benevole"),
  membre("u2", "Martin", "Bob", "coordinateur"),
  membre("u3", "Petit", "Chloé", ["beneficiaire", "benevole"]),
  membre("u4", "Roux", "Dan", "benevole", "suspendu"),
];

const table = () => screen.getAllByRole("table")[0];
const ouvrir = (nom: string) => userEvent.click(within(table()).getByRole("button", { name: `Gérer ${nom}` }));

describe("GestionMembres", () => {
  beforeEach(() => vi.clearAllMocks());

  it("affiche les actifs par defaut, filtrables par role et par statut", async () => {
    render(<GestionMembres membres={membres} currentUserId="autre" />);
    expect(within(table()).getByText("Dupont Alice")).toBeInTheDocument();
    expect(within(table()).queryByText("Roux Dan")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Encadrement/ }));
    expect(within(table()).getByText("Martin Bob")).toBeInTheDocument();
    expect(within(table()).queryByText("Dupont Alice")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Tous/ }));
    await userEvent.click(screen.getByRole("button", { name: /Suspendus/ }));
    expect(within(table()).getByText("Roux Dan")).toBeInTheDocument();
  });

  it("cherche sans tenir compte des accents", async () => {
    render(<GestionMembres membres={membres} currentUserId="autre" />);
    await userEvent.type(screen.getByLabelText("Chercher un membre"), "chloe");
    expect(within(table()).getByText("Petit Chloé")).toBeInTheDocument();
    expect(within(table()).queryByText("Dupont Alice")).not.toBeInTheDocument();
  });

  it("cumule des roles depuis la fiche du membre (ADR-012)", async () => {
    render(<GestionMembres membres={membres} currentUserId="autre" />);
    await ouvrir("Alice Dupont");
    const fiche = screen.getByRole("dialog");
    const enregistrer = within(fiche).getByRole("button", { name: "Enregistrer les rôles" });
    expect(enregistrer).toBeDisabled();
    await userEvent.click(within(fiche).getByRole("checkbox", { name: "Bénéficiaire" }));
    await userEvent.click(enregistrer);
    await waitFor(() =>
      expect(api.mettreAJourRolesMembre).toHaveBeenCalledWith("u1", { roles: ["benevole", "beneficiaire"], coordoType: null }),
    );
  });

  it("nomme responsable apres confirmation", async () => {
    render(<GestionMembres membres={membres} currentUserId="autre" />);
    await ouvrir("Alice Dupont");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Nommer responsable" }));
    expect(api.mettreAJourRolesMembre).not.toHaveBeenCalled();
    const confirmation = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirmation).getByRole("button", { name: "Nommer responsable" }));
    await waitFor(() => expect(api.mettreAJourRolesMembre).toHaveBeenCalledWith("u1", { roles: ["responsable"] }));
  });

  it("suspend un membre depuis sa fiche", async () => {
    render(<GestionMembres membres={membres} currentUserId="autre" />);
    await ouvrir("Alice Dupont");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspendre" }));
    expect(api.changerStatutMembre).toHaveBeenCalledWith("u1", "suspendu");
  });

  it("retire un membre apres confirmation", async () => {
    render(<GestionMembres membres={membres} currentUserId="autre" />);
    await ouvrir("Alice Dupont");
    await userEvent.click(screen.getByRole("button", { name: "Retirer de l'association" }));
    expect(api.supprimerMembre).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Retirer" }));
    expect(api.supprimerMembre).toHaveBeenCalledWith("u1");
  });

  it("ne propose aucune action sur son propre compte", async () => {
    render(<GestionMembres membres={membres} currentUserId="u1" />);
    await ouvrir("Alice Dupont");
    const fiche = screen.getByRole("dialog");
    expect(within(fiche).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(fiche).queryByRole("button", { name: /Retirer|Suspendre/ })).not.toBeInTheDocument();
  });

  it("propose le dossier des beneficiaires au responsable seulement", async () => {
    const { unmount } = render(<GestionMembres membres={membres} currentUserId="autre" peutVoirDossiers />);
    await userEvent.click(screen.getByRole("button", { name: /Bénéficiaires/ }));
    await ouvrir("Chloé Petit");
    expect(screen.getByRole("link", { name: /Voir le dossier social/ })).toHaveAttribute("href", "/association/membres/u3/dossier");
    unmount();

    render(<GestionMembres membres={membres} currentUserId="autre" />);
    await userEvent.click(screen.getByRole("button", { name: /Bénéficiaires/ }));
    await ouvrir("Chloé Petit");
    expect(screen.queryByRole("link", { name: /Voir le dossier social/ })).not.toBeInTheDocument();
  });
});

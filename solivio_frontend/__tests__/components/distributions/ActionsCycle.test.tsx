import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionsCycle } from "@/components/distributions/ActionsCycle";

const routeur = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routeur }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const api = vi.hoisted(() => ({
  publierDistribution: vi.fn(),
  demarrerDistribution: vi.fn(),
  terminerDistribution: vi.fn(),
  annulerDistribution: vi.fn(),
  supprimerDistribution: vi.fn(),
  annulerDemarrageDistribution: vi.fn(),
  reactiverDistribution: vi.fn(),
}));
vi.mock("@/lib/api/distributions", () => api);

const props = { distributionId: "d1", date: "2026-10-15", aujourdhui: "2026-10-15", nbInscrits: 42 };

describe("ActionsCycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publie un brouillon en un geste", async () => {
    api.publierDistribution.mockResolvedValue({});
    render(<ActionsCycle {...props} statut="BROUILLON" />);
    await userEvent.click(screen.getByRole("button", { name: "Publier" }));
    expect(api.publierDistribution).toHaveBeenCalledWith("d1");
    await waitFor(() => expect(routeur.refresh).toHaveBeenCalled());
  });

  it("ouvre le jour J en demarrant la distribution du jour", async () => {
    api.demarrerDistribution.mockResolvedValue({});
    render(<ActionsCycle {...props} statut="PUBLIEE" />);
    await userEvent.click(screen.getByRole("button", { name: "Ouvrir le jour J" }));
    await waitFor(() => expect(routeur.push).toHaveBeenCalledWith("/distributions/d1/pointage"));
  });

  it("n'offre aucune action principale avant le jour J", () => {
    render(<ActionsCycle {...props} statut="PUBLIEE" date="2026-10-22" />);
    expect(screen.queryByRole("button", { name: "Ouvrir le jour J" })).not.toBeInTheDocument();
    // La modification reste a portee plutot que cachee dans le menu.
    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute("href", "/distributions/d1/modifier");
    expect(screen.getByRole("button", { name: "Plus d'actions sur la distribution" })).toBeInTheDocument();
  });

  it("clot apres confirmation, en expliquant les absences", async () => {
    api.terminerDistribution.mockResolvedValue({});
    render(<ActionsCycle {...props} statut="EN_COURS" />);
    expect(screen.getByRole("link", { name: "Ouvrir le jour J" })).toHaveAttribute("href", "/distributions/d1/pointage");
    await userEvent.click(screen.getByRole("button", { name: "Clore et voir le bilan" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(/comptées absentes/);
    await userEvent.click(screen.getByRole("button", { name: "Clore la distribution" }));
    expect(api.terminerDistribution).toHaveBeenCalledWith("d1");
  });

  it("annule avec un motif obligatoire et rappelle que les inscrits sont prevenus", async () => {
    api.annulerDistribution.mockResolvedValue({});
    render(<ActionsCycle {...props} statut="PUBLIEE" date="2026-10-22" />);
    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions sur la distribution" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Annuler la distribution" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Les 42 personnes inscrites ou en attente seront prévenues par email");
    const confirmer = screen.getByRole("button", { name: "Annuler la distribution" });
    expect(confirmer).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Motif/), "Livraison reportée");
    await userEvent.click(confirmer);
    expect(api.annulerDistribution).toHaveBeenCalledWith("d1", "Livraison reportée");
  });
});

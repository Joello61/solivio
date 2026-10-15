import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionsEvenement } from "@/components/evenement/ActionsEvenement";

const routeur = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routeur }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const api = vi.hoisted(() => ({ publierEvenement: vi.fn(), annulerEvenement: vi.fn() }));
vi.mock("@/lib/api/evenement", () => api);

const base = { evenementId: "e1", modeInscription: "OBLIGATOIRE" as const, nbInscrits: 3 };
const menu = () => userEvent.click(screen.getByRole("button", { name: "Plus d'actions sur l'événement" }));

describe("ActionsEvenement", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publie un brouillon en un geste, modification dans le menu", async () => {
    api.publierEvenement.mockResolvedValue({});
    render(<ActionsEvenement {...base} statut="BROUILLON" estResponsable />);
    await userEvent.click(screen.getByRole("button", { name: "Publier" }));
    expect(api.publierEvenement).toHaveBeenCalledWith("e1");
    await waitFor(() => expect(routeur.refresh).toHaveBeenCalled());
    await menu();
    expect(await screen.findByRole("menuitem", { name: "Modifier" })).toHaveAttribute("href", "/evenements/e1/modifier");
  });

  it("ne propose rien au coordinateur sur un brouillon", () => {
    render(<ActionsEvenement {...base} statut="BROUILLON" estResponsable={false} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("met le pointage en avant le jour meme", () => {
    render(<ActionsEvenement {...base} statut="EN_COURS" estResponsable={false} />);
    expect(screen.getByRole("link", { name: "Ouvrir le pointage" })).toHaveAttribute("href", "/evenements/e1/pointage");
  });

  it("n'offre pas de pointage sans inscription obligatoire", async () => {
    render(<ActionsEvenement {...base} modeInscription="LIBRE" statut="EN_COURS" estResponsable />);
    expect(screen.queryByRole("link", { name: "Ouvrir le pointage" })).not.toBeInTheDocument();
    await menu();
    expect(screen.queryByRole("menuitem", { name: "Ouvrir le pointage" })).not.toBeInTheDocument();
  });

  it("annule avec un motif obligatoire", async () => {
    api.annulerEvenement.mockResolvedValue({});
    render(<ActionsEvenement {...base} statut="PUBLIE" estResponsable />);
    await menu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "Annuler l'événement" }));
    expect(screen.getByText(/Les 3 personnes inscrites seront prévenues/)).toBeInTheDocument();
    const confirmer = screen.getByRole("button", { name: "Annuler l'événement" });
    expect(confirmer).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Motif/), "Salle indisponible");
    await userEvent.click(confirmer);
    expect(api.annulerEvenement).toHaveBeenCalledWith("e1", "Salle indisponible");
  });
});

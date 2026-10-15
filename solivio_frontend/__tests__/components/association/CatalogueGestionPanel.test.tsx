import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogueGestionPanel } from "@/app/(protected)/association/catalogue-denrees/CatalogueGestionPanel";

const api = vi.hoisted(() => ({
  creerCatalogueDenree: vi.fn(),
  modifierCatalogueDenree: vi.fn(),
  supprimerCatalogueDenree: vi.fn(),
}));
vi.mock("@/lib/api/distributions", () => api);

const denree = (id: string, libelle: string) => ({ id, libelle, dateCreation: "", dateModification: "" });

describe("CatalogueGestionPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ajoute une denree et garde l'ordre alphabetique", async () => {
    api.creerCatalogueDenree.mockResolvedValue(denree("b", "Beurre"));
    render(<CatalogueGestionPanel initialDenrees={[denree("a", "Avoine"), denree("c", "Café")]} />);
    await userEvent.type(screen.getByLabelText("Nouvelle denrée"), "Beurre");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Avoine", "Beurre", "Café"]));
  });

  it("renomme en ligne depuis le menu", async () => {
    api.modifierCatalogueDenree.mockResolvedValue(denree("a", "Flocons d'avoine"));
    render(<CatalogueGestionPanel initialDenrees={[denree("a", "Avoine")]} />);
    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions sur Avoine" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Renommer" }));
    const champ = screen.getByLabelText("Nouveau nom pour Avoine");
    await userEvent.clear(champ);
    await userEvent.type(champ, "Flocons d'avoine{Enter}");
    expect(api.modifierCatalogueDenree).toHaveBeenCalledWith("a", "Flocons d'avoine");
    expect(await screen.findByText("Flocons d'avoine")).toBeInTheDocument();
  });

  it("supprime apres confirmation", async () => {
    api.supprimerCatalogueDenree.mockResolvedValue(undefined);
    render(<CatalogueGestionPanel initialDenrees={[denree("a", "Avoine")]} />);
    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions sur Avoine" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Supprimer" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(api.supprimerCatalogueDenree).toHaveBeenCalledWith("a");
  });
});

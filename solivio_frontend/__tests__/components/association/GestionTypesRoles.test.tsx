import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GestionTypesRoles } from "@/components/association/GestionTypesRoles";
import type { TypeRoleResponse } from "@/types/distribution";

const api = {
  creerTypeRole: vi.fn(),
  modifierTypeRole: vi.fn(),
  archiverTypeRole: vi.fn(),
  listerTypesRoles: vi.fn(),
};
vi.mock("@/lib/api/distributions", () => ({
  creerTypeRole: (...a: unknown[]) => api.creerTypeRole(...a),
  modifierTypeRole: (...a: unknown[]) => api.modifierTypeRole(...a),
  archiverTypeRole: (...a: unknown[]) => api.archiverTypeRole(...a),
  listerTypesRoles: () => api.listerTypesRoles(),
}));

const types: TypeRoleResponse[] = [
  {
    id: "accueil",
    parentId: null,
    libelle: "Accueil",
    actif: true,
    sousTypes: [{ id: "badges", parentId: "accueil", libelle: "Badges", actif: true, sousTypes: [] }],
  },
  { id: "ancien", parentId: null, libelle: "Ancien rôle", actif: false, sousTypes: [] },
];

describe("GestionTypesRoles", () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    api.listerTypesRoles.mockResolvedValue(types);
  });

  it("affiche l'arbre et marque les roles archives sans actions", () => {
    render(<GestionTypesRoles initialTypes={types} peutArchiver />);
    expect(screen.getByText("Badges")).toBeInTheDocument();
    expect(screen.getByText("Archivé")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Plus d'actions sur Ancien rôle/ })).not.toBeInTheDocument();
  });

  it("cache l'archivage au coordinateur", async () => {
    render(<GestionTypesRoles initialTypes={types} peutArchiver={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions sur Accueil" }));
    expect(await screen.findByRole("menuitem", { name: "Renommer" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Archiver" })).not.toBeInTheDocument();
  });

  it("cree un sous-role sous son role", async () => {
    api.creerTypeRole.mockResolvedValue({});
    render(<GestionTypesRoles initialTypes={types} peutArchiver={false} />);

    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions sur Accueil" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Ajouter un sous-rôle" }));
    await userEvent.type(screen.getByLabelText(/Sous-rôle de Accueil/), "Vestiaire{Enter}");

    await waitFor(() => expect(api.creerTypeRole).toHaveBeenCalledWith("Vestiaire", "accueil"));
    expect(api.listerTypesRoles).toHaveBeenCalled();
  });

  it("archive apres confirmation", async () => {
    api.archiverTypeRole.mockResolvedValue(undefined);
    render(<GestionTypesRoles initialTypes={types} peutArchiver />);

    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions sur Badges" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Archiver" }));
    const boite = await screen.findByRole("alertdialog");
    await userEvent.click(within(boite).getByRole("button", { name: "Archiver" }));

    await waitFor(() => expect(api.archiverTypeRole).toHaveBeenCalledWith("badges"));
  });
});

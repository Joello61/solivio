import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GestionAssociations from "@/components/admin/GestionAssociations";
import type { AssociationAdminResponse } from "@/types/association";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/api/association", () => ({
  creerAssociation: vi.fn(),
}));

import { creerAssociation } from "@/lib/api/association";

const assoActive: AssociationAdminResponse = {
  id: "asso-1",
  slug: "pilote",
  code: "PILOTE",
  nom: "Association Pilote",
  statut: "active",
  dateCreation: "2026-01-01T00:00:00Z",
};

describe("GestionAssociations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le message vide si aucune association", () => {
    render(<GestionAssociations associations={[]} />);
    expect(screen.getByText(/Aucune association enregistree/)).toBeInTheDocument();
  });

  it("affiche la liste des associations", () => {
    render(<GestionAssociations associations={[assoActive]} />);
    expect(screen.getByText("Association Pilote")).toBeInTheDocument();
    expect(screen.getByText("pilote")).toBeInTheDocument();
    expect(screen.getByText("PILOTE")).toBeInTheDocument();
  });

  it("affiche le formulaire quand on clique sur Nouvelle association", () => {
    render(<GestionAssociations associations={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Nouvelle association/i }));
    expect(screen.getByLabelText(/Nom de l'association/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Identifiant technique/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email du responsable/i)).toBeInTheDocument();
  });

  it("derive le slug depuis le nom automatiquement", () => {
    render(<GestionAssociations associations={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Nouvelle association/i }));

    const inputNom = screen.getByLabelText(/Nom de l'association/i);
    fireEvent.change(inputNom, { target: { value: "Solidarite Paris" } });

    const inputSlug = screen.getByLabelText(/Identifiant technique/i) as HTMLInputElement;
    expect(inputSlug.value).toBe("solidarite-paris");
  });

  it("cree l'association et ferme le formulaire en cas de succes", async () => {
    vi.mocked(creerAssociation).mockResolvedValue(assoActive);

    render(<GestionAssociations associations={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Nouvelle association/i }));

    fireEvent.change(screen.getByLabelText(/Nom de l'association/i), {
      target: { value: "Asso Test" },
    });
    fireEvent.change(screen.getByLabelText(/Identifiant technique/i), {
      target: { value: "asso-test" },
    });
    fireEvent.change(screen.getByLabelText(/Email du responsable/i), {
      target: { value: "resp@asso-test.fr" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Creer l'association/i }));

    await waitFor(() => {
      expect(creerAssociation).toHaveBeenCalledWith({
        nom: "Asso Test",
        slug: "asso-test",
        emailResponsable: "resp@asso-test.fr",
      });
    });
  });

  it("affiche une erreur en cas d'echec de creation", async () => {
    vi.mocked(creerAssociation).mockRejectedValue({ detail: "Slug deja utilise." });

    render(<GestionAssociations associations={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Nouvelle association/i }));

    fireEvent.change(screen.getByLabelText(/Nom de l'association/i), {
      target: { value: "Doublon" },
    });
    fireEvent.change(screen.getByLabelText(/Identifiant technique/i), {
      target: { value: "doublon" },
    });
    fireEvent.change(screen.getByLabelText(/Email du responsable/i), {
      target: { value: "resp@doublon.fr" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Creer l'association/i }));

    await waitFor(() => {
      expect(screen.getByText("Slug deja utilise.")).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleBenevolePanel } from "@/components/distributions/RoleBenevolePanel";
import * as api from "@/lib/api/distributions";
import type { RoleBenevoleResponse } from "@/types/distribution";

vi.mock("@/lib/api/distributions", () => ({
  assignerRole: vi.fn(),
  retirerRole: vi.fn(),
}));

const roleDistrib: RoleBenevoleResponse = {
  id: "role-1",
  typeRoleId: null,
  libelle: "Distribution des carottes",
};

const roleAccueil: RoleBenevoleResponse = {
  id: "role-2",
  typeRoleId: null,
  libelle: "Accueil",
};

describe("RoleBenevolePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche les roles existants", () => {
    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[roleDistrib, roleAccueil]}
      />,
    );
    expect(screen.getByText("Distribution des carottes")).toBeInTheDocument();
    expect(screen.getByText("Accueil")).toBeInTheDocument();
  });

  it("affiche le bouton Ajouter un role quand le formulaire est ferme", () => {
    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[]}
      />,
    );
    expect(screen.getByText("Ajouter un rôle")).toBeInTheDocument();
  });

  it("ouvre le formulaire au clic sur Ajouter un role", () => {
    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[]}
      />,
    );
    fireEvent.click(screen.getByText("Ajouter un rôle"));
    expect(screen.getByPlaceholderText(/distribution des carottes/i)).toBeInTheDocument();
  });

  it("appelle assignerRole et ajoute le role a la liste", async () => {
    const nouveauRole: RoleBenevoleResponse = { id: "role-3", typeRoleId: null, libelle: "Logistique" };
    vi.mocked(api.assignerRole).mockResolvedValue(nouveauRole);

    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[]}
      />,
    );

    fireEvent.click(screen.getByText("Ajouter un rôle"));
    fireEvent.change(screen.getByPlaceholderText(/distribution des carottes/i), {
      target: { value: "Logistique" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("OK"));
    });

    expect(api.assignerRole).toHaveBeenCalledWith("dist-1", "insc-1", {
      libelleLibre: "Logistique",
    });
    expect(screen.getByText("Logistique")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/distribution des carottes/i)).not.toBeInTheDocument();
  });

  it("appelle assignerRole via la touche Entree", async () => {
    const nouveauRole: RoleBenevoleResponse = { id: "role-4", typeRoleId: null, libelle: "Caisse" };
    vi.mocked(api.assignerRole).mockResolvedValue(nouveauRole);

    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[]}
      />,
    );

    fireEvent.click(screen.getByText("Ajouter un rôle"));
    const input = screen.getByPlaceholderText(/distribution des carottes/i);
    fireEvent.change(input, { target: { value: "Caisse" } });

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(api.assignerRole).toHaveBeenCalledWith("dist-1", "insc-1", { libelleLibre: "Caisse" });
    expect(screen.getByText("Caisse")).toBeInTheDocument();
  });

  it("ferme le formulaire avec Escape sans appeler l'API", () => {
    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[]}
      />,
    );

    fireEvent.click(screen.getByText("Ajouter un rôle"));
    const input = screen.getByPlaceholderText(/distribution des carottes/i);
    fireEvent.change(input, { target: { value: "Valeur a annuler" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(api.assignerRole).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText(/distribution des carottes/i)).not.toBeInTheDocument();
    expect(screen.getByText("Ajouter un rôle")).toBeInTheDocument();
  });

  it("appelle retirerRole et retire le role de la liste", async () => {
    vi.mocked(api.retirerRole).mockResolvedValue(undefined);

    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[roleDistrib]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Retirer le rôle Distribution des carottes"));
    });

    expect(api.retirerRole).toHaveBeenCalledWith("dist-1", "insc-1", "role-1");
    expect(screen.queryByText("Distribution des carottes")).not.toBeInTheDocument();
  });

  it("affiche une erreur si assignerRole echoue", async () => {
    vi.mocked(api.assignerRole).mockRejectedValue({ detail: "Role invalide" });

    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[]}
      />,
    );

    fireEvent.click(screen.getByText("Ajouter un rôle"));
    fireEvent.change(screen.getByPlaceholderText(/distribution des carottes/i), {
      target: { value: "Role problematique" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("OK"));
    });

    expect(screen.getByText("Role invalide")).toBeInTheDocument();
  });

  it("le bouton OK est desactive si le libelle est vide", () => {
    render(
      <RoleBenevolePanel
        distributionId="dist-1"
        inscriptionId="insc-1"
        rolesInitiaux={[]}
      />,
    );
    fireEvent.click(screen.getByText("Ajouter un rôle"));
    expect(screen.getByText("OK")).toBeDisabled();
  });
});

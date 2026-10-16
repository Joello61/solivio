import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MesRoles } from "@/components/account/MesRoles";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const ajouterMonRole = vi.fn();
vi.mock("@/lib/api/profil", () => ({ ajouterMonRole: (...a: unknown[]) => ajouterMonRole(...a) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

describe("MesRoles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("propose au benevole de devenir aussi beneficiaire, apres l'attestation", async () => {
    ajouterMonRole.mockResolvedValue({});
    render(<MesRoles roles={["benevole"]} />);

    expect(screen.queryByRole("button", { name: "Devenir aussi bénévole" })).not.toBeInTheDocument();
    expect(screen.getByText(/il faut être étudiant inscrit/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Devenir aussi bénéficiaire" }));
    expect(ajouterMonRole).not.toHaveBeenCalled();
    expect(screen.getByText(/Cochez d'abord la case/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: /Je suis étudiant inscrit/ }));
    await userEvent.click(screen.getByRole("button", { name: "Devenir aussi bénéficiaire" }));
    await waitFor(() => expect(ajouterMonRole).toHaveBeenCalledWith("beneficiaire", true));
    expect(refresh).toHaveBeenCalled();
  });

  it("propose au beneficiaire de devenir aussi benevole, sans condition", async () => {
    ajouterMonRole.mockResolvedValue({});
    render(<MesRoles roles={["beneficiaire"]} />);

    await userEvent.click(screen.getByRole("button", { name: "Devenir aussi bénévole" }));
    await waitFor(() => expect(ajouterMonRole).toHaveBeenCalledWith("benevole", false));
  });

  it("ne propose rien a un responsable, qui n'a que ce role", () => {
    render(<MesRoles roles={["responsable"]} />);

    expect(screen.getByText(/Un responsable n'a que ce rôle/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("ne propose plus rien a qui a deja les deux roles", () => {
    render(<MesRoles roles={["coordinateur", "benevole", "beneficiaire"]} />);

    expect(screen.getByText("Coordinateur")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

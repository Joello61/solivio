import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ChangementMotDePasse } from "@/components/account/ChangementMotDePasse";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));

const changerMotDePasse = vi.fn();
const logout = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/auth", () => ({
  changerMotDePasse: (...args: unknown[]) => changerMotDePasse(...args),
  logout: () => logout(),
}));

async function remplir(actuel: string, nouveau: string, confirmation: string) {
  await userEvent.type(screen.getByLabelText("Mot de passe actuel"), actuel);
  await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), nouveau);
  await userEvent.type(screen.getByLabelText("Confirmation"), confirmation);
  await userEvent.click(screen.getByRole("button", { name: /Changer le mot de passe/i }));
}

describe("ChangementMotDePasse", () => {
  beforeEach(() => {
    changerMotDePasse.mockReset();
    replace.mockReset();
  });

  it("refuse une confirmation differente sans appeler le backend", async () => {
    render(<ChangementMotDePasse />);
    await remplir("ancienMotDePasse", "nouveauMotDePasse1", "nouveauMotDePasse2");
    expect(screen.getByRole("alert")).toHaveTextContent(/ne correspondent pas/);
    expect(changerMotDePasse).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe trop court", async () => {
    render(<ChangementMotDePasse />);
    await remplir("ancienMotDePasse", "court", "court");
    expect(screen.getByRole("alert")).toHaveTextContent(/entre 8 et 128/);
  });

  it("change le mot de passe puis renvoie vers la connexion", async () => {
    changerMotDePasse.mockResolvedValue(undefined);
    render(<ChangementMotDePasse />);
    await remplir("ancienMotDePasse", "nouveauMotDePasse1", "nouveauMotDePasse1");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?motDePasse=modifie"));
    expect(changerMotDePasse).toHaveBeenCalledWith("ancienMotDePasse", "nouveauMotDePasse1");
    expect(logout).toHaveBeenCalled();
  });

  it("affiche un mot de passe actuel refuse", async () => {
    changerMotDePasse.mockRejectedValue(new Error("Mot de passe actuel incorrect"));
    render(<ChangementMotDePasse />);
    await remplir("mauvais12345", "nouveauMotDePasse1", "nouveauMotDePasse1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Mot de passe actuel incorrect");
    expect(replace).not.toHaveBeenCalled();
  });
});

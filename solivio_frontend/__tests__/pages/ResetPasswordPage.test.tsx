import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense } from "react";
import ResetPasswordPage from "@/app/reset-password/page";
import * as authLib from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  resetPassword: vi.fn(),
}));

const navigation = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams("email=alice%40example.com") }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));

function renderPage() {
  return render(
    <Suspense>
      <ResetPasswordPage />
    </Suspense>,
  );
}

function remplir(code: string, motDePasse: string, confirmation: string) {
  code.split("").forEach((chiffre, i) => {
    fireEvent.change(screen.getByLabelText(`Chiffre ${i + 1}`), { target: { value: chiffre } });
  });
  fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), { target: { value: motDePasse } });
  fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), { target: { value: confirmation } });
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Non-regression : la connexion n'affichait pas la confirmation (parametre "reset=1" ignore).
  it("renvoie vers la connexion avec la confirmation du changement", async () => {
    vi.mocked(authLib.resetPassword).mockResolvedValue(undefined);
    renderPage();

    remplir("123456", "Nouveau-2026!", "Nouveau-2026!");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Modifier le mot de passe" }));
    });

    expect(authLib.resetPassword).toHaveBeenCalledWith("alice@example.com", "123456", "Nouveau-2026!");
    expect(navigation.push).toHaveBeenCalledWith("/login?motDePasse=modifie");
  });

  it("refuse deux mots de passe differents", async () => {
    renderPage();

    remplir("123456", "Nouveau-2026!", "Autre-2026!");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Modifier le mot de passe" }));
    });

    expect(authLib.resetPassword).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("pas identiques");
  });
});

import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense } from "react";
import VerifyEmailPage from "@/app/verify-email/page";
import * as authLib from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
}));

const navigation = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));

function renderPage(params = "") {
  navigation.params = new URLSearchParams(params);
  return render(
    <Suspense>
      <VerifyEmailPage />
    </Suspense>,
  );
}

function saisirCode(code: string) {
  code.split("").forEach((chiffre, i) => {
    fireEvent.change(screen.getByLabelText(`Chiffre ${i + 1}`), { target: { value: chiffre } });
  });
}

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authLib.resendVerification).mockResolvedValue(undefined);
  });

  it("verifie le code puis renvoie vers la connexion", async () => {
    vi.mocked(authLib.verifyEmail).mockResolvedValue(undefined);
    renderPage("email=alice%40example.com");

    saisirCode("123456");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Valider le code" }));
    });

    expect(authLib.verifyEmail).toHaveBeenCalledWith("alice@example.com", "123456");
    expect(navigation.push).toHaveBeenCalledWith("/login?verified=1");
  });

  it("n'envoie pas de nouveau code sans en avoir ete prie", () => {
    renderPage("email=alice%40example.com");
    expect(authLib.resendVerification).not.toHaveBeenCalled();
  });

  it("envoie un nouveau code d'office en arrivant depuis la connexion", async () => {
    renderPage("email=alice%40example.com&raison=non-verifie");

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/pas encore verifiee/);
    });
    expect(authLib.resendVerification).toHaveBeenCalledTimes(1);
    expect(authLib.resendVerification).toHaveBeenCalledWith("alice@example.com");
  });

  it("renvoie un code a la demande et le confirme", async () => {
    renderPage("email=alice%40example.com");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Renvoyer un code" }));
    });

    expect(authLib.resendVerification).toHaveBeenCalledWith("alice@example.com");
    expect(screen.getByRole("status")).toHaveTextContent(/nouveau code a ete envoye/);
  });

  it("affiche l'erreur du serveur quand le renvoi est refuse", async () => {
    vi.mocked(authLib.resendVerification).mockRejectedValue(
      Object.assign(new Error("Trop de tentatives"), { detail: "Trop de tentatives, reessayez plus tard." }),
    );
    renderPage("email=alice%40example.com");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Renvoyer un code" }));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Trop de tentatives, reessayez plus tard.");
  });

  it("demande l'adresse quand elle manque dans le lien", async () => {
    vi.mocked(authLib.verifyEmail).mockResolvedValue(undefined);
    renderPage();

    const champEmail = screen.getByLabelText("Adresse email");
    saisirCode("123456");
    expect(screen.getByRole("button", { name: "Valider le code" })).toBeDisabled();

    fireEvent.change(champEmail, { target: { value: "bob@example.com" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Valider le code" }));
    });

    expect(authLib.verifyEmail).toHaveBeenCalledWith("bob@example.com", "123456");
  });
});

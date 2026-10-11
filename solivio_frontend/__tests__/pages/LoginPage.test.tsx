import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense } from "react";
import LoginPage from "@/app/login/page";
import * as authLib from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
}));

const navigation = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push, refresh: vi.fn() }),
  useSearchParams: () => navigation.params,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderLogin() {
  return render(
    <Suspense>
      <LoginPage />
    </Suspense>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
  });

  it("affiche les champs email et mot de passe", () => {
    renderLogin();
    expect(screen.getByLabelText(/Adresse email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/)).toBeInTheDocument();
  });

  it("affiche le bouton de connexion", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  it("affiche le lien mot de passe oublie", () => {
    renderLogin();
    expect(screen.getByText(/Mot de passe oublié/)).toBeInTheDocument();
  });

  it("affiche le lien d'inscription", () => {
    renderLogin();
    expect(screen.getByText(/Créer un compte/)).toBeInTheDocument();
  });

  it("desactive le bouton pendant la soumission", async () => {
    vi.mocked(authLib.login).mockImplementation(
      () => new Promise(() => {}), // bloque indefiniment
    );
    renderLogin();

    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "motdepasse123" },
    });

    act(() => {
      fireEvent.submit(screen.getByRole("button", { name: "Se connecter" }).closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Connexion en cours/ })).toBeDisabled();
    });
  });

  it("affiche un message d'erreur en cas d'echec", async () => {
    vi.mocked(authLib.login).mockRejectedValue(
      Object.assign(new Error("Identifiants incorrects"), { detail: "Identifiants incorrects" }),
    );
    renderLogin();

    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "mauvais" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Se connecter" }).closest("form")!);
    });

    expect(screen.getByText("Identifiants incorrects")).toBeInTheDocument();
  });

  it("appelle login avec les identifiants saisis", async () => {
    const push = vi.fn();
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push, refresh: vi.fn() }),
      useSearchParams: () => new URLSearchParams(),
    }));

    vi.mocked(authLib.login).mockResolvedValue({
      accessToken: "token123",
      tokenType: "Bearer",
      expiresIn: 900,
      refreshToken: null,
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "motdepasse123" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Se connecter" }).closest("form")!);
    });

    expect(authLib.login).toHaveBeenCalledWith("alice@example.com", "motdepasse123", false);
  });

  it("redirige vers la verification si l'email n'est pas verifie", async () => {
    vi.mocked(authLib.login).mockRejectedValue(
      Object.assign(new Error("Email non verifie"), { code: "EMAIL_NOT_VERIFIED", status: 403 }),
    );
    renderLogin();

    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice+test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "motdepasse123" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Se connecter" }).closest("form")!);
    });

    expect(navigation.push).toHaveBeenCalledWith(
      "/verify-email?email=alice%2Btest%40example.com&raison=non-verifie",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("confirme la verification de l'email au retour de la page de code", () => {
    navigation.params = new URLSearchParams("verified=1");
    renderLogin();
    expect(screen.getByRole("status")).toHaveTextContent(/Adresse email vérifiée/);
  });

  it("coche 'Rester connecte' change l'etat du checkbox", async () => {
    const user = userEvent.setup();
    renderLogin();
    const checkbox = screen.getByRole("checkbox", { name: /Rester connecté/ });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

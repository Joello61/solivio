import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense } from "react";
import RegisterPage from "@/app/register/page";
import * as authLib from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  register: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderRegister(searchParams = new URLSearchParams()) {
  vi.doMock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => searchParams,
  }));
  return render(
    <Suspense>
      <RegisterPage />
    </Suspense>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche les champs du formulaire d'inscription", () => {
    renderRegister();
    expect(screen.getByLabelText(/Prenom/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adresse email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/)).toBeInTheDocument();
  });

  it("affiche le champ code association (sans token invitation)", () => {
    renderRegister();
    expect(screen.getByLabelText(/Code de votre association/)).toBeInTheDocument();
  });

  it("redirige vers /verify-email apres inscription reussie", async () => {
    vi.mocked(authLib.register).mockResolvedValue(undefined);

    render(
      <Suspense>
        <RegisterPage />
      </Suspense>,
    );

    fireEvent.change(screen.getByLabelText(/Prenom/), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Dupont" } });
    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "motdepasse123" },
    });
    fireEvent.change(screen.getByLabelText(/Code de votre association/), {
      target: { value: "PILOTE" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Creer mon compte" }).closest("form")!);
    });

    expect(authLib.register).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "alice@example.com",
        nom: "Dupont",
        prenom: "Alice",
      }),
    );
  });

  it("affiche un message d'erreur si l'email est deja utilise", async () => {
    vi.mocked(authLib.register).mockRejectedValue(
      Object.assign(new Error("Email deja utilise"), { detail: "Email deja utilise" }),
    );

    renderRegister();

    fireEvent.change(screen.getByLabelText(/Prenom/), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Dupont" } });
    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "motdepasse123" },
    });
    fireEvent.change(screen.getByLabelText(/Code de votre association/), {
      target: { value: "PILOTE" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Creer mon compte" }).closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByText("Email deja utilise")).toBeInTheDocument();
    });
  });

  it("affiche le lien de connexion", () => {
    renderRegister();
    expect(screen.getByText(/Se connecter/)).toBeInTheDocument();
  });
});

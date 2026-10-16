import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.getByLabelText(/Prénom/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adresse email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/)).toBeInTheDocument();
  });

  it("ne demande pas de code association (une seule association)", () => {
    renderRegister();
    expect(screen.queryByLabelText(/Code de votre association/)).not.toBeInTheDocument();
  });

  it("redirige vers /verify-email apres inscription reussie", async () => {
    vi.mocked(authLib.register).mockResolvedValue(undefined);

    render(
      <Suspense>
        <RegisterPage />
      </Suspense>,
    );

    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Dupont" } });
    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "motdepasse123" },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: /Bénévole/ }));

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Créer mon compte" }).closest("form")!);
    });

    expect(authLib.register).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "alice@example.com",
        nom: "Dupont",
        prenom: "Alice",
        roles: ["benevole"],
      }),
    );
    expect(vi.mocked(authLib.register).mock.calls[0][0]).not.toHaveProperty("codeAssociation");
  });

  it("affiche un message d'erreur si l'email est deja utilise", async () => {
    vi.mocked(authLib.register).mockRejectedValue(
      Object.assign(new Error("Email deja utilise"), { detail: "Email deja utilise" }),
    );

    renderRegister();

    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Dupont" } });
    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "motdepasse123" },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: /Bénévole/ }));

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Créer mon compte" }).closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByText("Email deja utilise")).toBeInTheDocument();
    });
  });

  it("demande un role et l'attestation pour etre beneficiaire (ADR-012)", async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Dupont" } });
    fireEvent.change(screen.getByLabelText(/Adresse email/), { target: { value: "alice@example.com" } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/), { target: { value: "motdepasse123" } });
    const soumettre = () =>
      act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: "Créer mon compte" }).closest("form")!);
      });

    await soumettre();
    expect(screen.getByText(/Choisissez d'être bénévole, bénéficiaire, ou les deux/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: /Bénéficiaire/ }));
    expect(screen.getByText(/il faut être étudiant inscrit/)).toBeInTheDocument();
    await soumettre();
    expect(screen.getByText(/confirmez être étudiant inscrit/)).toBeInTheDocument();
    expect(authLib.register).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("checkbox", { name: /Je suis étudiant inscrit/ }));
    await soumettre();
    expect(authLib.register).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ["beneficiaire"], attestationEtudiant: true }),
    );
  });

  it("affiche le lien de connexion", () => {
    renderRegister();
    expect(screen.getByText(/Se connecter/)).toBeInTheDocument();
  });
});

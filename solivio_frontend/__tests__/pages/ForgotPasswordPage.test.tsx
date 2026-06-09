import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ForgotPasswordPage from "@/app/forgot-password/page";
import * as authLib from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  forgotPassword: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le champ email", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/Adresse email/)).toBeInTheDocument();
  });

  it("affiche le bouton d'envoi", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("button", { name: "Envoyer le code" })).toBeInTheDocument();
  });

  it("affiche l'etat succes apres envoi reussi", async () => {
    vi.mocked(authLib.forgotPassword).mockResolvedValue(undefined);
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });

    await act(async () => {
      fireEvent.submit(
        screen.getByRole("button", { name: "Envoyer le code" }).closest("form")!,
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Email envoye/)).toBeInTheDocument();
    });
    expect(screen.getByText(/alice@example.com/)).toBeInTheDocument();
    expect(screen.getByText("Saisir le code de verification")).toBeInTheDocument();
  });

  it("affiche une erreur en cas d'echec", async () => {
    vi.mocked(authLib.forgotPassword).mockRejectedValue(
      Object.assign(new Error("Erreur serveur"), { detail: "Erreur serveur" }),
    );
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });

    await act(async () => {
      fireEvent.submit(
        screen.getByRole("button", { name: "Envoyer le code" }).closest("form")!,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Erreur serveur")).toBeInTheDocument();
    });
  });

  it("desactive le bouton pendant l'envoi", async () => {
    vi.mocked(authLib.forgotPassword).mockImplementation(() => new Promise(() => {}));
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText(/Adresse email/), {
      target: { value: "alice@example.com" },
    });

    act(() => {
      fireEvent.submit(
        screen.getByRole("button", { name: "Envoyer le code" }).closest("form")!,
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Envoi en cours/ })).toBeDisabled();
    });
  });

  it("affiche le lien de retour a la connexion", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText(/Retour a la connexion/)).toBeInTheDocument();
  });
});

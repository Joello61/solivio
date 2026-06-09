import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AuthLayout } from "@/components/auth/AuthLayout";

describe("AuthLayout", () => {
  it("affiche le titre", () => {
    render(<AuthLayout title="Connexion"><p>contenu</p></AuthLayout>);
    expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
  });

  it("affiche la description si fournie", () => {
    render(
      <AuthLayout title="Connexion" description="Entrez vos identifiants">
        <p>contenu</p>
      </AuthLayout>,
    );
    expect(screen.getByText("Entrez vos identifiants")).toBeInTheDocument();
  });

  it("n'affiche pas la description si absente", () => {
    render(<AuthLayout title="Connexion"><p>contenu</p></AuthLayout>);
    expect(screen.queryByText("Entrez vos identifiants")).not.toBeInTheDocument();
  });

  it("affiche le branding Solivio", () => {
    render(<AuthLayout title="Connexion"><p>contenu</p></AuthLayout>);
    const elements = screen.getAllByText("Solivio");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("rend les enfants dans l'encart", () => {
    render(
      <AuthLayout title="Connexion">
        <button>Se connecter</button>
      </AuthLayout>,
    );
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });
});

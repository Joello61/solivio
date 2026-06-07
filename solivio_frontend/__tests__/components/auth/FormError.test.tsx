import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FormError } from "@/components/auth/FormError";

describe("FormError", () => {
  it("ne rend rien si message est null", () => {
    const { container } = render(<FormError message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("ne rend rien si message est undefined", () => {
    const { container } = render(<FormError message={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("ne rend rien si message est une chaine vide", () => {
    const { container } = render(<FormError message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche le message d'erreur fourni", () => {
    render(<FormError message="Identifiants invalides" />);
    expect(screen.getByText("Identifiants invalides")).toBeInTheDocument();
  });

  it("affiche le role alert pour l'accessibilite", () => {
    render(<FormError message="Une erreur" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

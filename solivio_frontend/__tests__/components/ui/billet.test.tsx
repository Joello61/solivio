import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Billet } from "@/components/ui/billet";

describe("Billet", () => {
  it("annonce la date complete et l'horaire", () => {
    render(<Billet date="2026-10-15" horaire="17:45 - 18:00" lieu="Local Rangueil" />);
    expect(screen.getByRole("article", { name: "Rendez-vous du jeudi 15 octobre, 17:45 - 18:00" })).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Local Rangueil")).toBeInTheDocument();
  });
});

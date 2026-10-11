import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecalculerStatistiques } from "@/components/statistiques/RecalculerStatistiques";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const recalculerStatistiques = vi.fn();
vi.mock("@/lib/api/association", () => ({
  recalculerStatistiques: (...a: unknown[]) => recalculerStatistiques(...a),
}));

describe("RecalculerStatistiques", () => {
  it("recalcule puis rafraichit la page", async () => {
    recalculerStatistiques.mockResolvedValue({});
    render(<RecalculerStatistiques distributionId="d1" libelle="Distribution du jeudi" />);
    await userEvent.click(screen.getByRole("button", { name: /Recalculer les statistiques de Distribution du jeudi/ }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(recalculerStatistiques).toHaveBeenCalledWith("d1");
  });

  it("affiche le refus du backend", async () => {
    recalculerStatistiques.mockRejectedValue(new Error("Distribution non terminee"));
    render(<RecalculerStatistiques distributionId="d1" libelle="Distribution" />);
    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Distribution non terminee");
  });
});

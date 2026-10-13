import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExportDonnees } from "@/components/association/ExportDonnees";

const exporterDonnees = vi.fn();
vi.mock("@/lib/api/association", () => ({ exporterDonnees: () => exporterDonnees() }));

describe("ExportDonnees", () => {
  it("telecharge l'archive renvoyee par le backend", async () => {
    exporterDonnees.mockResolvedValue(new Blob(["zip"]));
    const createObjectURL = vi.fn(() => "blob:export");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ExportDonnees />);
    await userEvent.click(screen.getByRole("button", { name: /Exporter les données/i }));

    await waitFor(() => expect(clic).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalled();
  });

  it("signale un export refuse", async () => {
    exporterDonnees.mockRejectedValue(new Error("Acces refuse"));
    render(<ExportDonnees />);
    await userEvent.click(screen.getByRole("button", { name: /Exporter les données/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Acces refuse");
  });
});

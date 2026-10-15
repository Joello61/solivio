import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChoixPeriode } from "@/components/statistiques/ChoixPeriode";
import { TableStatistiques } from "@/components/statistiques/TableStatistiques";
import * as api from "@/lib/api/association";
import type { StatistiqueDistributionResponse } from "@/types/association";

const routeur = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routeur, usePathname: () => "/statistiques" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/association", () => ({ recalculerStatistiques: vi.fn().mockResolvedValue({}) }));

const ligne = (id: string, date: string, taux: number): StatistiqueDistributionResponse => ({
  distributionId: id,
  distributionDate: date,
  nbInscritsBeneficiaires: 40,
  nbInscritsBenevoles: 8,
  nbPresentsBeneficiaires: 30,
  nbAbsentsBeneficiaires: 10,
  nbNonPointes: 0,
  tauxPresence: taux,
  dateCalcul: "",
});

const predefinies = {
  mois: { debut: "2026-10-01", fin: "2026-10-31" },
  "mois-precedent": { debut: "2026-09-01", fin: "2026-09-30" },
  trimestre: { debut: "2026-08-01", fin: "2026-10-31" },
  annee: { debut: "2026-01-01", fin: "2026-12-31" },
};

describe("ChoixPeriode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passe d'un raccourci a l'autre par l'adresse", async () => {
    render(<ChoixPeriode periode={predefinies.mois} predefinies={predefinies} />);
    expect(screen.getByRole("button", { name: "Ce mois-ci" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Mois précédent" }));
    expect(routeur.replace).toHaveBeenCalledWith("/statistiques?debut=2026-09-01&fin=2026-09-30", { scroll: false });
  });

  it("reconnait une plage libre et la modifie dans une feuille", async () => {
    render(<ChoixPeriode periode={{ debut: "2026-10-05", fin: "2026-10-12" }} predefinies={predefinies} />);
    expect(screen.getByRole("button", { name: "Autre période" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Autre période" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Afficher" }));
    expect(routeur.replace).toHaveBeenCalledWith("/statistiques?debut=2026-10-05&fin=2026-10-12", { scroll: false });
  });
});

describe("TableStatistiques", () => {
  it("recalcule une distribution depuis le menu de sa ligne", async () => {
    render(<TableStatistiques lignes={[ligne("d1", "2026-10-08", 75)]} titres={{ d1: "Distribution du 8" }} peutRecalculer />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("75 %")).toBeInTheDocument();
    await userEvent.click(within(table).getByRole("button", { name: /Plus d'actions/ }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Recalculer" }));
    await waitFor(() => expect(api.recalculerStatistiques).toHaveBeenCalledWith("d1"));
  });

  it("n'offre pas le recalcul au coordinateur", () => {
    render(<TableStatistiques lignes={[ligne("d1", "2026-10-08", 75)]} titres={{}} peutRecalculer={false} />);
    expect(screen.queryByRole("button", { name: /Plus d'actions/ })).not.toBeInTheDocument();
  });
});

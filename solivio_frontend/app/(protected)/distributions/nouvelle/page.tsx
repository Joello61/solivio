import type { Metadata } from "next";
import { CreateDistributionForm } from "@/components/distributions/CreateDistributionForm";

export const metadata: Metadata = { title: "Nouvelle distribution" };

export default function NouvellePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Nouvelle distribution</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Remplissez les informations pour creer une nouvelle distribution.
        </p>
      </div>
      <CreateDistributionForm />
    </div>
  );
}

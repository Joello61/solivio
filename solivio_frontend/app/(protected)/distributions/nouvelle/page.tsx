import type { Metadata } from "next";
import { CreateDistributionForm } from "@/components/distributions/CreateDistributionForm";

export const metadata: Metadata = { title: "Nouvelle distribution" };

export default function NouvellePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nouvelle distribution</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Remplissez les informations pour creer une nouvelle distribution.
        </p>
      </div>
      <CreateDistributionForm />
    </div>
  );
}

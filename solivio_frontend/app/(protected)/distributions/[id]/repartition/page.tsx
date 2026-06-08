import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RepartitionPanel } from "@/components/repartition/RepartitionPanel";
import type { DistributionResponse, DenreeResponse, DotationResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Repartition des denrees" };

async function fetchData(id: string, cookieHeader: string) {
  const base = process.env.API_URL ?? "http://localhost:8080";
  const h = { Cookie: cookieHeader };

  const [distribRes, denreesRes, dotationRes] = await Promise.all([
    fetch(`${base}/api/distributions/${id}`, { headers: h, cache: "no-store" }),
    fetch(`${base}/api/distributions/${id}/denrees`, { headers: h, cache: "no-store" }),
    fetch(`${base}/api/distributions/${id}/repartition`, { headers: h, cache: "no-store" }),
  ]);

  if (!distribRes.ok || !denreesRes.ok || !dotationRes.ok) return null;

  const distribution = (await distribRes.json()) as DistributionResponse;
  const denrees = (await denreesRes.json()) as DenreeResponse[];
  const dotation = (await dotationRes.json()) as DotationResponse;

  return { distribution, denrees, dotation };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RepartitionPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const data = await fetchData(id, cookieHeader);
  if (!data) notFound();

  const modifiable =
    data.distribution.statut !== "TERMINEE" && data.distribution.statut !== "ANNULEE";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/distributions/${id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Retour a la distribution"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Repartition des denrees</h1>
            <p className="text-xs text-muted-foreground">
              {data.distribution.titre}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <RepartitionPanel
          distributionId={id}
          denreesInitiales={data.denrees}
          dotationInitiale={data.dotation}
          modifiable={modifiable}
        />
      </div>
    </div>
  );
}

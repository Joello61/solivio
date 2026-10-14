import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible_Mono,
  Atkinson_Hyperlegible_Next,
  Bricolage_Grotesque,
} from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/*
 * Texte : dessinee pour la lisibilite, utile a un public large et divers.
 * Next ne connait pas ses metriques : pas de repli ajuste, repli systeme explicite.
 */
const atkinsonNext = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson-next",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

/* Titres : un grotesque de caractere, reserve aux titres et aux grands chiffres. */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
});

/* Chiffres et codes : dates du billet, compteurs, en-tetes de tableau. */
const atkinsonMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-atkinson-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Solivio",
    template: "%s | Solivio",
  },
  description: "Plateforme de gestion opérationnelle pour les associations de solidarité",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${atkinsonNext.variable} ${bricolage.variable} ${atkinsonMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <TooltipProvider delay={300}>
            {children}
            <Toaster position="bottom-center" mobileOffset={{ bottom: 88 }} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

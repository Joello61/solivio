import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/* DM Sans - corps de texte : moderne, lisible, premium SaaS */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

/* Plus Jakarta Sans - titres et display : personnalite forte */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

/* Geist Mono - code uniquement */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Solivio",
    template: "%s | Solivio",
  },
  description: "Plateforme de gestion operationnelle pour les associations de solidarite",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <TooltipProvider delay={300}>
            {children}
            <Toaster
              richColors
              position="bottom-right"
              closeButton
              toastOptions={{ duration: 4000 }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

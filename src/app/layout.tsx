// ============================================
// CAPA 1: PRESENTACIÓN
// Layout Principal
// ============================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { TITAN_LAYERS } from "@/types";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "B'H SaaS - Agentes IA",
  description: "Plataforma SaaS de Agentes IA con Protocolo TITAN de 9 Capas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
            <LayerStatusBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}

// --------------------------------------------
// COMPONENTE: BARRA DE ESTADO DE CAPAS
// --------------------------------------------
function LayerStatusBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2">
      <div className="container mx-auto flex items-center justify-center gap-1 overflow-x-auto">
        {TITAN_LAYERS.map((layer) => (
          <div
            key={layer.id}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            title={layer.description}
          >
            <div
              className="w-3 h-3 rounded-full animate-pulse-ring"
              style={{ backgroundColor: layer.color }}
            />
            <span className="text-muted-foreground hidden sm:inline">
              C{layer.id}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

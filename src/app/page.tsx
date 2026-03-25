import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, Bot, MessageSquare, Database, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Layers className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-3xl font-bold">B&apos;H SaaS</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
          Plataforma de Agentes IA
          <br />
          <span className="text-primary">Protocolo TITAN</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          Sistema SaaS con arquitectura de 9 capas para agentes de inteligencia artificial.
          Construido sobre Gentle-AI, RAG y memoria persistente.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/api/auth/signin">
            <Button size="lg" className="w-full sm:w-auto">
              Comenzar Ahora
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Arquitectura de 9 Capas
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Bot className="w-8 h-8" />}
              title="Capas 1-3: Presentación"
              description="Frontend moderno con Next.js, autenticación segura con NextAuth y lógica de negocio en TypeScript."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Capas 4-5: Servicios"
              description="API Routes, integraciones con AI providers (Together, Gemini, Anthropic) y persistencia con PostgreSQL y Pinecone."
            />
            <FeatureCard
              icon={<Database className="w-8 h-8" />}
              title="Capas 6-9: Inteligencia"
              description="OpenSpec contracts, logs con Pino, agentes con Gentle-AI y memoria RAG con context augmentation."
            />
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold mb-8">
            Multi-Provider AI
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Soporte nativo para múltiples proveedores de IA: Together AI, Google Gemini,
            Anthropic Claude y Kimi Code.
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            <span className="text-lg font-mono">Together AI</span>
            <span className="text-lg font-mono">Gemini</span>
            <span className="text-lg font-mono">Anthropic</span>
            <span className="text-lg font-mono">Kimi</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>B&apos;H Blessed Holding - Protocolo TITAN v1.0</p>
          <p className="mt-1">Construido con Next.js, Prisma y protocolo de 9 capas</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

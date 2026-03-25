"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { TITAN_LAYERS } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Database, Layers, Activity, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") {
    redirect("/api/auth/signin");
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard B&apos;H
          </h1>
          <p className="text-muted-foreground">
            Protocolo TITAN de 9 Capas - {session?.user?.name || "Usuario"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/agents/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Agente
            </Button>
          </Link>
        </div>
      </div>

      {/* Protocolo TITAN - Visualización de Capas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Protocolo TITAN - 9 Capas
          </CardTitle>
          <CardDescription>
            Estado actual del sistema de capas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-9 gap-2">
            {TITAN_LAYERS.map((layer) => (
              <div
                key={layer.id}
                className="flex flex-col items-center p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer group"
                style={{ borderColor: layer.color }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2"
                  style={{ backgroundColor: layer.color }}
                >
                  {layer.id}
                </div>
                <span className="text-xs font-medium text-center">
                  {layer.name}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {layer.description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Agentes Activos"
          value="0"
          description="Agentes configurados"
          icon={Bot}
          color="blue"
        />
        <StatsCard
          title="Conversaciones"
          value="0"
          description="Mensajes procesados"
          icon={MessageSquare}
          color="green"
        />
        <StatsCard
          title="Consultas RAG"
          value="0"
          description="Búsquedas en knowledge base"
          icon={Database}
          color="purple"
        />
        <StatsCard
          title="Tareas Activas"
          value="0"
          description="En procesamiento"
          icon={Activity}
          color="amber"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/agents/new">
              <Button variant="outline" className="w-full justify-start">
                <Bot className="w-4 h-4 mr-2" />
                Crear Nuevo Agente
              </Button>
            </Link>
            <Link href="/rag">
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Consultar Base de Conocimiento
              </Button>
            </Link>
            <Link href="/tasks">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                Ver Tareas Activas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Servidor API</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-500">Online</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de Datos</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-500">Conectada</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Vector DB</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-500">Operativo</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Telegram Bot</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-500">Activo</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  color: "blue" | "green" | "purple" | "amber";
}) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    amber: "bg-amber-500/10 text-amber-500",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorMap[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

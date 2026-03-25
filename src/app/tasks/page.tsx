import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
        <p className="text-muted-foreground">Seguimiento de ejecución del protocolo TITAN.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor de tareas
          </CardTitle>
          <CardDescription>
            La pantalla ya no rompe navegación y queda preparada para conectarse con datos reales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El servicio de tareas existe en backend, pero esta vista aún no consume la API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
import { Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewAgentPage() {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Agente</h1>
        <p className="text-muted-foreground">Pantalla inicial para alta manual de agentes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Formulario pendiente
          </CardTitle>
          <CardDescription>
            Se dejó creada la ruta para evitar navegación rota y preparar la integración siguiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El siguiente paso es conectar un formulario a POST /api/agents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
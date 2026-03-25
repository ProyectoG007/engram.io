import { Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RagPage() {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RAG</h1>
        <p className="text-muted-foreground">Consulta e indexación de conocimiento.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado del módulo
          </CardTitle>
          <CardDescription>
            La ruta web existe. La integración visual con /api/rag todavía está pendiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El backend TypeScript ya compila; la experiencia interactiva todavía no está construida.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
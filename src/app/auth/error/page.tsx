import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error de autenticación</CardTitle>
          <CardDescription>
            No se pudo completar el login con la configuración actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/signin">
            <Button className="w-full">Volver a intentar</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
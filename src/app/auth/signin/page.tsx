import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            La autenticación usa NextAuth. Si los providers están configurados, podés iniciar desde la ruta estándar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/api/auth/signin" className="block">
            <Button className="w-full">Continuar con NextAuth</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
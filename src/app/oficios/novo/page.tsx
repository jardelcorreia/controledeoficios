
"use client";

import PageHeader from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProximoNumeroOficio } from "@/lib/oficios";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import NovoOficioForm from "@/components/NovoOficioForm";
import { useRouter } from "next/navigation";

export default function NovoOficioPage() {
  const router = useRouter();
  const [proximoNumero, setProximoNumero] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProximoNumeroOficio().then((num) => {
        setProximoNumero(num);
        setLoading(false);
    }).catch(() => {
        setProximoNumero('Erro!');
        setLoading(false);
    });
  }, []);

  const handleOficioCreated = () => {
    router.push("/oficios");
  };

  const handleCancel = () => {
    router.push("/oficios");
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Novo Ofício"
        description="Preencha os dados para criar um novo ofício."
      />
      <main className="flex-1 p-4 sm:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Detalhes do Ofício</CardTitle>
            <CardDescription>
              O número do ofício a ser criado é:{" "}
              {proximoNumero ? (
                <span className="font-bold text-primary">
                  {proximoNumero}
                </span>
              ) : (
                <Skeleton className="inline-block h-5 w-40" />
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : proximoNumero && proximoNumero !== 'Erro!' ? (
              <NovoOficioForm 
                proximoNumero={proximoNumero}
                onOficioCreated={handleOficioCreated}
                onCancel={handleCancel}
              />
            ) : (
              <p className="text-destructive">Não foi possível carregar o número do ofício. Verifique as configurações.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    

import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOficioById } from "@/lib/oficios";
import { FileEdit, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default async function OficioDetalhesPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  let oficio;
  let error = null;

  try {
    oficio = await getOficioById(id);
  } catch (e: any) {
    error = e;
  }
  
  if (error) {
     return (
      <div className="flex flex-col h-full">
        <PageHeader title="Erro ao Carregar Ofício" description="Não foi possível buscar os dados do documento." />
        <main className="flex-1 p-6">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erro de Conexão</AlertTitle>
            <AlertDescription>
                <p className="mb-2">Não foi possível carregar os dados. Verifique sua conexão com a internet ou as configurações do Firebase.</p>
                <p className="font-mono text-xs">{error.message}</p>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }


  if (!oficio) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Erro 404" description="Ofício não encontrado." />
        <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <p className="mb-4">
            O ofício que você está procurando não existe ou foi movido.
          </p>
          <Button asChild>
            <Link href="/oficios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Ofícios
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Ofício Nº ${oficio.numero}`}
        description={`Detalhes do ofício sobre "${oficio.assunto}"`}
      >
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/oficios/${oficio.id}/editar`}>
              <FileEdit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{oficio.assunto}</CardTitle>
            <CardDescription>
              {`Enviado para ${oficio.destinatario}`}
              {" em "}
              {new Date(oficio.data).toLocaleDateString("pt-BR", {
                timeZone: "UTC",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Responsável: {oficio.responsavel}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

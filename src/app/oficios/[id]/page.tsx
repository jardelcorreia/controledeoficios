
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockOficios, Oficio } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Printer, Paperclip, ArrowLeft } from "lucide-react";
import Link from "next/link";

const statusVariantMap: {
  [key: string]: "default" | "secondary" | "destructive" | "outline";
} = {
  pendente: "secondary",
  respondido: "default",
  arquivado: "outline",
};

export default function OficioDetalhesPage({
  params,
}: {
  params: { id: string };
}) {
  const oficio: Oficio | undefined = mockOficios.find(
    (o) => o.id === params.id
  );

  if (!oficio) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Erro" description="Ofício não encontrado." />
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
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button>
            <FileEdit className="mr-2 h-4 w-4" />
            Editar
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
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
              <div>
                Status:{" "}
                <Badge variant={statusVariantMap[oficio.status] || "default"}>
                  {oficio.status.charAt(0).toUpperCase() + oficio.status.slice(1)}
                </Badge>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
              {oficio.conteudo}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-4">
              Nenhum anexo encontrado.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

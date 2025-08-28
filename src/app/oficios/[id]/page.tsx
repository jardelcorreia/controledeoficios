
"use client";

import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOficioById, getUltimoOficio, Oficio, statusList, Status } from "@/lib/oficios";
import { deleteOficio, updateOficio } from "@/lib/oficios.actions";
import { FileEdit, User, ArrowLeft, Trash2, ChevronDown, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<Status, string> = {
    "Aguardando Envio": "bg-yellow-500",
    "Enviado": "bg-blue-500",
};


export default function OficioDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [oficio, setOficio] = useState<Oficio | null>(null);
  const [ultimoOficio, setUltimoOficio] = useState<Oficio | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();


  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
        getOficioById(id),
        getUltimoOficio()
    ]).then(([oficioData, ultimoOficioData]) => {
        setOficio(oficioData);
        setUltimoOficio(ultimoOficioData);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleDelete = () => {
    if (!oficio) return;
    startDeleteTransition(async () => {
      try {
        await deleteOficio(oficio.id);
        toast({
          title: "Ofício Excluído!",
          description: `O ofício nº ${oficio.numero} foi removido do sistema.`,
        });
        router.push("/oficios");
        router.refresh(); // Força a recarga dos dados
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o ofício. Tente novamente.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleStatusChange = (newStatus: Status) => {
      if (!oficio) return;
      startStatusTransition(async () => {
          try {
              await updateOficio(oficio.id, { status: newStatus });
              setOficio(prev => prev ? {...prev, status: newStatus} : null);
              
              if (newStatus === "Enviado") {
                 toast({
                  title: "Ofício Enviado!",
                  description: `O ofício nº ${oficio.numero} foi marcado como enviado.`
                });
              } else {
                toast({
                    title: "Status Atualizado!",
                    description: `O status do ofício foi alterado para "${newStatus}".`
                });
              }

          } catch(e) {
              toast({
                title: "Erro ao alterar status",
                description: "Não foi possível alterar o status. Tente novamente.",
                variant: "destructive",
            });
          }
      });
  }

  const canDelete = oficio && ultimoOficio && oficio.id === ultimoOficio.id;


  if (loading) {
     return (
      <div className="flex flex-col h-full">
        <PageHeader title="Carregando..." description="Buscando informações do ofício." />
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="flex flex-col h-full">
        <PageHeader title="Erro ao Carregar Ofício" description="Não foi possível buscar os dados do documento." />
        <main className="flex-1 p-4 sm:p-6">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erro de Conexão</AlertTitle>
            <AlertDescription>
                Não foi possível carregar os dados. Verifique sua conexão com a internet ou as configurações do Firebase.
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
        <main className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center text-center">
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
          <Button variant="outline" asChild>
            <Link href={`/oficios/${oficio.id}/editar`}>
              <FileEdit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o ofício <strong>nº {oficio.numero}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeletePending}>
                    {isDeletePending ? "Excluindo..." : "Confirmar Exclusão"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{oficio.assunto}</CardTitle>
            <CardDescription>
              {oficio.status === "Aguardando Envio" &&
                `Aguardando envio para ${oficio.destinatario}`}
              {oficio.status === "Enviado" &&
                `Enviado para ${oficio.destinatario} em ${new Date(
                  oficio.data
                ).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Responsável: {oficio.responsavel}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
                 <Badge className={`${statusColors[oficio.status]} text-white hover:${statusColors[oficio.status]} text-base`}>
                    Status: {oficio.status}
                </Badge>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={isStatusPending}>
                            {isStatusPending ? "Alterando..." : "Alterar Status"}
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {statusList.map(status => (
                            <DropdownMenuItem key={status} onSelect={() => handleStatusChange(status)} disabled={oficio.status === status}>
                                {oficio.status === status && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                                {status}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </CardContent>
        </Card>
         {!canDelete && (
            <Alert className="max-w-2xl mx-auto">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Exclusão não permitida</AlertTitle>
                <AlertDescription>
                    Este ofício não pode ser excluído porque não é o último registro. Apenas o último ofício criado pode ser removido para manter a integridade da sequência.
                </AlertDescription>
            </Alert>
         )}
      </main>
    </div>
  );
}

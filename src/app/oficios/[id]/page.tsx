
"use client";

import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOficioById, getUltimoOficio, Oficio, Status } from "@/lib/oficios";
import { deleteOficio } from "@/lib/oficios.actions";
import { FileEdit, User, ArrowLeft, Trash2, Calendar, FileText, Send } from "lucide-react";
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
import StatusBadge from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";


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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchOficioData = async () => {
        try {
            const [oficioData, ultimoOficioData] = await Promise.all([
                getOficioById(id),
                getUltimoOficio()
            ]);
            
            setOficio(oficioData);
            setUltimoOficio(ultimoOficioData);
        } catch (err: unknown) {
             setError(err instanceof Error ? err : new Error("Ocorreu um erro desconhecido"));
        } finally {
            setLoading(false);
        }
    };
    fetchOficioData();
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
      } catch (err) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o ofício. Tente novamente.",
          variant: "destructive",
        });
      }
    });
  };

  const handleStatusChange = (newStatus: Status) => {
      setOficio(prev => prev ? {...prev, status: newStatus} : null);
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
        description="Informações detalhadas do documento registrado."
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild size="sm" className="sm:size-default">
            <Link href={`/oficios/${oficio.id}/editar`}>
              <FileEdit className="sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="sm:size-default">
                  <Trash2 className="sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Excluir</span>
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
                  <AlertDialogAction onClick={handleDelete} disabled={isDeletePending} className="bg-destructive hover:bg-destructive/90">
                    {isDeletePending ? "Excluindo..." : "Confirmar Exclusão"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Card className="max-w-2xl mx-auto shadow-md">
          <CardHeader className="bg-muted/10 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">
                #{oficio.numero}
              </div>
              <StatusBadge oficio={oficio} onStatusChange={handleStatusChange}/>
            </div>
            <CardTitle className="text-2xl font-bold">{oficio.assunto}</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider gap-2">
                  <Send className="size-3" />
                  Destinatário
                </div>
                <p className="text-sm font-medium">{oficio.destinatario}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider gap-2">
                  <User className="size-3" />
                  Criado por
                </div>
                <p className="text-sm font-medium">{oficio.responsavel}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider gap-2">
                  <Calendar className="size-3" />
                  Data de Registro
                </div>
                <p className="text-sm font-medium">
                  {new Date(oficio.data).toLocaleDateString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider gap-2">
                  <FileText className="size-3" />
                  Ano de Referência
                </div>
                <p className="text-sm font-medium">{oficio.ano}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
               <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-center">
                  <p className="text-xs text-muted-foreground">
                    Este documento está com o status de <strong>{oficio.status.toLowerCase()}</strong>. 
                    {oficio.status === "Aguardando Envio" && " Clique no selo de status acima para marcar como enviado."}
                  </p>
               </div>
            </div>
          </CardContent>
        </Card>
        
        {!canDelete && (
          <Alert className="max-w-2xl mx-auto border-yellow-200 bg-yellow-50/50">
            <Terminal className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Histórico Preservado</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Apenas o último ofício criado pode ser excluído. Este registro faz parte da cronologia do sistema.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}

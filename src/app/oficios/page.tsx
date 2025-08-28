
"use client";

import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOficios, Oficio, Status } from "@/lib/oficios";
import { deleteOficio } from "@/lib/oficios.actions";
import { PlusCircle, MoreHorizontal, FileEdit, Eye, Terminal, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";


const statusColors: Record<Status, string> = {
    "Aguardando Envio": "bg-yellow-500",
    "Enviado": "bg-blue-500",
};

export default function OficiosPage() {
    const [oficios, setOficios] = useState<Oficio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isDeletePending, startDeleteTransition] = useTransition();
    const [oficioToDelete, setOficioToDelete] = useState<Oficio | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        getOficios()
            .then(data => setOficios(data))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, []);
    
    const handleDelete = () => {
        if (!oficioToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteOficio(oficioToDelete.id);
                toast({
                    title: "Ofício Excluído!",
                    description: `O ofício nº ${oficioToDelete.numero} foi removido com sucesso.`,
                });
                // Optimistic update
                setOficios(prev => prev.filter(o => o.id !== oficioToDelete.id));
                setOficioToDelete(null);
            } catch (error) {
                 toast({
                    title: "Erro ao excluir",
                    description: "Não foi possível excluir o ofício. Tente novamente.",
                    variant: "destructive",
                });
            }
        });
    }
    
    const ultimoOficioId = oficios.length > 0 ? oficios[0].id : null;


    if (error) {
       return (
            <div className="flex flex-col h-full">
                 <PageHeader
                    title="Erro ao carregar ofícios"
                    description="Não foi possível buscar os dados do Firestore."
                 />
                 <main className="flex-1 p-4 sm:p-6">
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>
                           Erro ao carregar dados
                        </AlertTitle>
                        <AlertDescription>
                           Não foi possível carregar os dados. Verifique sua conexão ou a configuração do Firestore.
                        </AlertDescription>
                    </Alert>
                 </main>
            </div>
        )
    }

    if (loading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader
                    title="Gerenciamento de Ofícios"
                    description="Crie, edite e visualize os ofícios enviados."
                />
                 <main className="flex-1 p-4 sm:p-6">
                    <p>Carregando...</p>
                 </main>
            </div>
        )
    }

    return (
        <AlertDialog open={!!oficioToDelete} onOpenChange={(open) => !open && setOficioToDelete(null)}>
          <div className="flex flex-col h-full">
            <PageHeader
              title="Gerenciamento de Ofícios"
              description="Crie, edite e visualize os ofícios enviados."
            >
              <Button asChild>
                <Link href="/oficios/novo">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Novo Ofício</span>
                  <span className="inline sm:hidden">Novo</span>
                </Link>
              </Button>
            </PageHeader>
            <main className="flex-1 p-4 sm:p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Ofícios</CardTitle>
                  <CardDescription>
                    Todos os documentos enviados. Apenas o último ofício pode ser excluído.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Número</TableHead>
                        <TableHead className="w-[100px] hidden sm:table-cell">Status</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead className="hidden md:table-cell">Destinatário</TableHead>
                        <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                        <TableHead className="hidden sm:table-cell w-[120px]">Data</TableHead>
                        <TableHead>
                          <span className="sr-only">Ações</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oficios.map((oficio) => (
                        <TableRow key={oficio.id}>
                          <TableCell className="font-medium">{oficio.numero}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={`${statusColors[oficio.status]} text-white hover:${statusColors[oficio.status]}`}>
                                {oficio.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] sm:max-w-[250px] truncate">{oficio.assunto}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {oficio.destinatario}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {oficio.responsavel}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {new Date(oficio.data).toLocaleDateString("pt-BR", {
                              timeZone: "UTC",
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/oficios/${oficio.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/oficios/${oficio.id}/editar`}>
                                    <FileEdit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => setOficioToDelete(oficio)} 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    disabled={oficio.id !== ultimoOficioId}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </main>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o ofício <strong>nº {oficioToDelete?.numero}</strong>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOficioToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeletePending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isDeletePending ? "Excluindo..." : "Confirmar Exclusão"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </div>
        </AlertDialog>
    );
}

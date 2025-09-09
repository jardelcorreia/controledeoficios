
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
import { getOficios, Oficio, Status, getProximoNumeroOficio } from "@/lib/oficios";
import { deleteOficio } from "@/lib/oficios.actions";
import { PlusCircle, MoreHorizontal, FileEdit, Eye, Terminal, Trash2, Calendar, User, Search, X } from "lucide-react";
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
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import NovoOficioForm from "@/components/NovoOficioForm";


const statusColors: Record<Status, string> = {
    "Aguardando Envio": "bg-yellow-500",
    "Enviado": "bg-blue-500",
};

export default function OficiosPage() {
    const [allOficios, setAllOficios] = useState<Oficio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isDeletePending, startDeleteTransition] = useTransition();
    const [oficioToDelete, setOficioToDelete] = useState<Oficio | null>(null);
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [proximoNumero, setProximoNumero] = useState<string | null>(null);
    const [loadingProximoNumero, setLoadingProximoNumero] = useState(true);


    const fetchOficios = () => {
        setLoading(true);
        getOficios()
            .then(data => setAllOficios(data))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    };

    const fetchProximoNumero = () => {
        setLoadingProximoNumero(true);
         getProximoNumeroOficio().then((num) => {
            setProximoNumero(num);
        }).catch(() => {
            setProximoNumero('Erro!');
        }).finally(() => {
             setLoadingProximoNumero(false);
        });
    };

    useEffect(() => {
       fetchOficios();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            fetchProximoNumero();
        }
    }, [isModalOpen]);


    const handleOficioCreated = () => {
        setIsModalOpen(false);
        fetchOficios(); // Re-fetch data to show the new oficio in the list
    };


    const filteredOficios = useMemo(() => {
        let oficios = allOficios;

        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            oficios = oficios.filter(o => 
                o.numero.toLowerCase().includes(lowerCaseQuery) ||
                o.assunto.toLowerCase().includes(lowerCaseQuery) ||
                o.destinatario.toLowerCase().includes(lowerCaseQuery) ||
                o.responsavel.toLowerCase().includes(lowerCaseQuery)
            );
        }

        return oficios;
    }, [allOficios, searchQuery]);
    
    const handleDelete = () => {
        if (!oficioToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteOficio(oficioToDelete.id);
                setAllOficios(prevOficios => prevOficios.filter(o => o.id !== oficioToDelete.id));
                toast({
                    title: "Ofício Excluído!",
                    description: `O ofício nº ${oficioToDelete.numero} foi removido com sucesso.`,
                });
                setOficioToDelete(null);

            } catch (err) {
                 toast({
                    title: "Erro ao excluir",
                    description: "Não foi possível excluir o ofício. Tente novamente.",
                    variant: "destructive",
                });
            }
        });
    }
    
    const ultimoOficioId = allOficios.length > 0 ? allOficios[0].id : null;
    
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

    return (
        <AlertDialog open={!!oficioToDelete} onOpenChange={(open) => !open && setOficioToDelete(null)}>
          <div className="flex flex-col h-full">
            <PageHeader
              title="Gerenciamento de Ofícios"
              description="Crie, edite e visualize os ofícios enviados."
            >
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Novo Ofício</span>
                      <span className="inline sm:hidden">Novo</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar Novo Ofício</DialogTitle>
                         {loadingProximoNumero ? (
                            <div className="text-sm text-muted-foreground">
                                <Skeleton className="h-5 w-48" />
                            </div>
                            ) : (
                            <DialogDescription>
                                {proximoNumero !== 'Erro!' ? (
                                    <>
                                    O número do ofício a ser criado é:{" "}
                                    <span className="font-bold text-primary">
                                        {proximoNumero}
                                    </span>
                                    </>
                                ) : (
                                    <span className="text-destructive">Não foi possível carregar o número.</span>
                                )}
                            </DialogDescription>
                         )}
                    </DialogHeader>
                    {proximoNumero && !loadingProximoNumero && proximoNumero !== 'Erro!' && (
                        <NovoOficioForm
                            proximoNumero={proximoNumero}
                            onOficioCreated={handleOficioCreated}
                            onCancel={() => setIsModalOpen(false)}
                        />
                      )}
                </DialogContent>
              </Dialog>
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
                  <div className="mb-4 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por número, assunto, destinatário..."
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <Button variant="ghost" size="icon" className="absolute right-1 top-0.5 h-8 w-8" onClick={() => setSearchQuery('')}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                  ) : (
                    <>
                      {/* Tabela para Desktop */}
                      <div className="hidden md:block">
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
                            {filteredOficios.length > 0 ? filteredOficios.map((oficio) => (
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
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        Nenhum ofício encontrado com os filtros atuais.
                                    </TableCell>
                                </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                       {/* Cards para Mobile */}
                      <div className="md:hidden space-y-4">
                         {filteredOficios.length > 0 ? filteredOficios.map((oficio) => (
                            <Card key={oficio.id} className="flex flex-col">
                               <CardHeader className="flex flex-row items-start justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-lg">{oficio.numero}</CardTitle>
                                        <Badge className={`${statusColors[oficio.status]} text-white hover:${statusColors[oficio.status]} mt-1`}>
                                            {oficio.status}
                                        </Badge>
                                    </div>
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
                               </CardHeader>
                               <CardContent className="flex-1 space-y-2">
                                  <p className="font-semibold">{oficio.assunto}</p>
                                  <p className="text-sm text-muted-foreground">Destinatário: {oficio.destinatario}</p>
                               </CardContent>
                               <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-4">
                                    <div className="flex items-center">
                                        <User className="mr-1.5 h-3 w-3" />
                                        <span>{oficio.responsavel}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="mr-1.5 h-3 w-3" />
                                         <span>
                                            {new Date(oficio.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                                         </span>
                                    </div>
                               </CardFooter>
                            </Card>
                         )) : (
                            <div className="text-center text-muted-foreground py-10">
                                Nenhum ofício encontrado.
                            </div>
                         )}
                      </div>
                    </>
                  )}
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

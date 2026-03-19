
"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Oficio } from "@/lib/oficios";
import { deleteOficio } from "@/lib/oficios.actions";
import { 
  PlusCircle, 
  MoreHorizontal, 
  FileEdit, 
  Eye, 
  Trash2, 
  Calendar, 
  User, 
  Search, 
  X, 
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
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
  CardFooter,
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
import { useEffect, useState, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import NovoOficioDialog from "./NovoOficioDialog";
import { useSearchParams } from "next/navigation";
import TruncatedTooltipCell from "./TruncatedTooltipCell";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import StatusBadge from "./StatusBadge";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

const ITEMS_PER_PAGE = 15;

export function OficiosClientSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-4 w-80 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-28" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <Skeleton className="h-10 w-full sm:w-80" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function OficiosClient() {
    const [oficios, setOficios] = useState<Oficio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [oficioToDelete, setOficioToDelete] = useState<Oficio | null>(null);
    const [isDeletePending, startDeleteTransition] = useTransition();
    
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");

    useEffect(() => {
        setLoading(true);
        const q = query(
            collection(db, "oficios"),
            orderBy("data", "desc"),
            limit(200)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Oficio));
            setOficios(docs);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Erro no listener de ofícios:", err);
            setError("Falha ao sincronizar dados com o servidor.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredOficios = useMemo(() => {
        const queryText = searchQuery.toLowerCase();
        if (!queryText) return oficios;
        return oficios.filter(o => 
            o.numero.toLowerCase().includes(queryText) ||
            o.assunto.toLowerCase().includes(queryText) ||
            o.destinatario.toLowerCase().includes(queryText) ||
            o.responsavel.toLowerCase().includes(queryText)
        );
    }, [oficios, searchQuery]);

    // Lógica de Paginação
    const totalPages = Math.ceil(filteredOficios.length / ITEMS_PER_PAGE);
    const paginatedOficios = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredOficios.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredOficios, currentPage]);

    // Volta para a página 1 quando a busca muda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);
    
    const handleDelete = () => {
        if (!oficioToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteOficio(oficioToDelete.id);
                toast({
                    title: "Ofício Excluído!",
                    description: `O ofício nº ${oficioToDelete.numero} foi removido com sucesso.`,
                });
                setOficioToDelete(null);
            } catch (err) {
                 toast({
                    title: "Erro ao excluir",
                    description: err instanceof Error ? err.message : "Não foi possível excluir o ofício.",
                    variant: "destructive",
                });
            }
        });
    }
    
    const ultimoOficioId = oficios.length > 0 ? oficios[0].id : null;

    if (loading && oficios.length === 0) return <OficiosClientSkeleton />;

    return (
        <AlertDialog open={!!oficioToDelete} onOpenChange={(open) => !open && setOficioToDelete(null)}>
            <Card className="shadow-sm border-none sm:border">
                <CardHeader className="px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Lista de Ofícios</CardTitle>
                      <CardDescription>
                        Gerencie todos os documentos registrados no sistema.
                      </CardDescription>
                    </div>
                      <NovoOficioDialog 
                        triggerButton={
                             <Button className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Novo Ofício
                            </Button>
                        }
                      />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro de Conexão</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por número, assunto, destinatário..."
                            className="pl-10 w-full sm:max-w-md h-11"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" 
                              onClick={() => setSearchQuery('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                  </div>
                  
                      {/* Tabela para Desktop */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-[140px]">Número</TableHead>
                              <TableHead className="w-[120px]">Status</TableHead>
                              <TableHead>Assunto</TableHead>
                              <TableHead className="hidden lg:table-cell">Destinatário</TableHead>
                              <TableHead className="hidden md:table-cell w-[180px]">Criado por:</TableHead>
                              <TableHead className="w-[110px]">Data / Hora</TableHead>
                              <TableHead className="w-[50px]">
                                <span className="sr-only">Ações</span>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedOficios.length > 0 ? paginatedOficios.map((oficio) => (
                              <TableRow key={oficio.id}>
                                <TableCell className="font-bold text-primary">{oficio.numero}</TableCell>
                                <TableCell>
                                  <StatusBadge oficio={oficio} />
                                </TableCell>
                                <TableCell>
                                    <TruncatedTooltipCell text={oficio.assunto} />
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <TruncatedTooltipCell text={oficio.destinatario} />
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                  {oficio.responsavel}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col text-[11px] leading-tight">
                                    <span className="font-semibold">
                                      {new Date(oficio.data).toLocaleDateString("pt-BR", {
                                        timeZone: "America/Sao_Paulo",
                                      })}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {new Date(oficio.data).toLocaleTimeString("pt-BR", {
                                        timeZone: "America/Sao_Paulo",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem asChild>
                                        <Link href={`/oficios/${oficio.id}`} className="cursor-pointer">
                                          <Eye className="mr-2 h-4 w-4" />
                                          Visualizar
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/oficios/${oficio.id}/editar`} className="cursor-pointer">
                                          <FileEdit className="mr-2 h-4 w-4" />
                                          Editar
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                          onClick={() => setOficioToDelete(oficio)} 
                                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
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
                                    <TableCell colSpan={7} className="text-center h-32 text-muted-foreground italic">
                                        Nenhum ofício encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                       {/* Cards para Mobile */}
                      <div className="md:hidden space-y-4">
                         {paginatedOficios.length > 0 ? paginatedOficios.map((oficio) => (
                            <Card key={oficio.id} className="flex flex-col shadow-sm border-l-4 border-l-primary overflow-hidden">
                               <CardHeader className="flex flex-row items-start justify-between pb-2 pr-2">
                                    <div className="min-w-0 pr-2">
                                        <CardTitle className="text-lg font-bold text-primary">{oficio.numero}</CardTitle>
                                        <div className="mt-1">
                                          <StatusBadge oficio={oficio} />
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0 mt-0.5" title="Opções">
                                            <span className="sr-only">Abrir menu</span>
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/oficios/${oficio.id}`} className="py-3">
                                            <Eye className="mr-3 h-5 w-5" />
                                            Visualizar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/oficios/${oficio.id}/editar`} className="py-3">
                                            <FileEdit className="mr-3 h-5 w-5" />
                                            Editar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            onClick={() => setOficioToDelete(oficio)} 
                                            className="text-destructive focus:text-destructive py-3"
                                            disabled={oficio.id !== ultimoOficioId}
                                        >
                                            <Trash2 className="mr-3 h-5 w-5" />
                                            Excluir
                                        </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                               </CardHeader>
                               <CardContent className="flex-1 space-y-2 py-2">
                                  <p className="font-semibold break-words leading-tight">{oficio.assunto}</p>
                                  <p className="text-xs text-muted-foreground break-words">Dest.: {oficio.destinatario}</p>
                               </CardContent>
                               <CardFooter className="flex justify-between items-start text-[10px] text-muted-foreground border-t pt-3 mt-1 bg-muted/20 rounded-b-lg gap-2">
                                    <div className="flex items-start min-w-0 flex-1">
                                        <User className="mr-1.5 h-3 w-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex flex-col min-w-0">
                                          <span>Criado por:</span>
                                          <span className="break-words leading-tight font-medium text-foreground/80">{oficio.responsavel}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start flex-shrink-0 text-right">
                                        <Calendar className="mr-1.5 h-3 w-3 mt-0.5" />
                                         <div className="flex flex-col">
                                            <span className="whitespace-nowrap font-medium">
                                              {new Date(oficio.data).toLocaleDateString("pt-BR", {
                                                timeZone: "America/Sao_Paulo",
                                              })}
                                            </span>
                                            <span className="whitespace-nowrap">
                                              {new Date(oficio.data).toLocaleTimeString("pt-BR", {
                                                timeZone: "America/Sao_Paulo",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                         </div>
                                    </div>
                                </CardFooter>
                            </Card>
                         )) : (
                            <div className="text-center text-muted-foreground py-12 bg-muted/10 rounded-lg border border-dashed">
                                Nenhum ofício encontrado.
                            </div>
                         )}
                      </div>

                    {/* Controles de Paginação */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between space-x-2 py-4 border-t mt-4">
                        <div className="text-sm text-muted-foreground">
                          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Próximo
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                </CardContent>
            </Card>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Ofício?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o ofício <strong>nº {oficioToDelete?.numero}</strong>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOficioToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete} 
                      disabled={isDeletePending} 
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isDeletePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Confirmar Exclusão
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

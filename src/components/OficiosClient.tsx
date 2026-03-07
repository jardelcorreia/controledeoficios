
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
import { Oficio, Status, getOficios } from "@/lib/oficios";
import { deleteOficio } from "@/lib/oficios.actions";
import { PlusCircle, MoreHorizontal, FileEdit, Eye, Trash2, Calendar, User, Search, X } from "lucide-react";
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
import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import NovoOficioDialog from "./NovoOficioDialog";
import { useRouter, useSearchParams } from "next/navigation";
import TruncatedTooltipCell from "./TruncatedTooltipCell";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal } from "lucide-react";
import StatusBadge from "./StatusBadge";


const PAGE_SIZE = 10;

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
                <div className="hidden md:block">
                     <Skeleton className="h-40 w-full" />
                </div>
                 <div className="md:hidden space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}


export default function OficiosClient() {
    const [oficios, setOficios] = useState<Oficio[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastVisible, setLastVisible] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isLoadMorePending, startLoadMoreTransition] = useTransition();

    const [isDeletePending, startDeleteTransition] = useTransition();
    const [oficioToDelete, setOficioToDelete] = useState<Oficio | null>(null);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");

    const fetchOficios = useCallback(async (cursor: string | null) => {
      try {
        const { oficios: newOficios, lastVisible: newLastVisible } = await getOficios(PAGE_SIZE, cursor);
        setOficios(prev => cursor ? [...prev, ...newOficios] : newOficios);
        setLastVisible(newLastVisible);
        setHasMore(newOficios.length === PAGE_SIZE);
      } catch (e: unknown) {
        setError(e instanceof Error ? e : new Error("Ocorreu um erro desconhecido"));
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      setLoading(true);
      fetchOficios(null);
    }, [fetchOficios]);

    const handleLoadMore = () => {
        if (!lastVisible || !hasMore) return;
        startLoadMoreTransition(() => {
            fetchOficios(lastVisible);
        });
    };
    
    const handleRefresh = useCallback(() => {
      setLoading(true);
      setOficios([]);
      fetchOficios(null);
    }, [fetchOficios]);

    const filteredOficios = useMemo(() => {
        if (!searchQuery) {
            return oficios;
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        return oficios.filter(o => 
            o.numero.toLowerCase().includes(lowerCaseQuery) ||
            o.assunto.toLowerCase().includes(lowerCaseQuery) ||
            o.destinatario.toLowerCase().includes(lowerCaseQuery) ||
            o.responsavel.toLowerCase().includes(lowerCaseQuery)
        );
    }, [oficios, searchQuery]);
    
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
                handleRefresh();

            } catch (err) {
                 toast({
                    title: "Erro ao excluir",
                    description: err instanceof Error ? err.message : "Não foi possível excluir o ofício. Tente novamente.",
                    variant: "destructive",
                });
            }
        });
    }
    
    const ultimoOficioId = oficios.length > 0 ? oficios.find((_, i) => i === 0)?.id : null;

     if (loading && oficios.length === 0) {
        return <OficiosClientSkeleton />;
    }

    if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-2xl">
            <Terminal className="h-4 w-4" />
            <AlertTitle>
              Erro ao Carregar os Ofícios
            </AlertTitle>
            <AlertDescription>
              Não foi possível buscar os dados. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
      </div>
    );
  }

    return (
        <AlertDialog open={!!oficioToDelete} onOpenChange={(open) => !open && setOficioToDelete(null)}>
            <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Lista de Ofícios</CardTitle>
                      <CardDescription>
                        Todos os documentos enviados. Apenas o último ofício pode ser excluído.
                      </CardDescription>
                    </div>
                      <NovoOficioDialog 
                        triggerButton={
                             <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Novo Ofício</span>
                                <span className="inline sm:hidden">Novo</span>
                            </Button>
                        }
                        onOficioCreated={handleRefresh}
                      />
                  </div>
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
                  
                      {/* Tabela para Desktop */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[120px]">Número</TableHead>
                              <TableHead className="hidden sm:table-cell w-[180px]">Status</TableHead>
                              <TableHead>Assunto</TableHead>
                              <TableHead className="hidden md:table-cell max-w-[200px]">Destinatário</TableHead>
                              <TableHead className="hidden md:table-cell">Criado por:</TableHead>
                              <TableHead className="hidden sm:table-cell w-[120px]">Data e Hora</TableHead>
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
                                  <StatusBadge oficio={oficio} />
                                </TableCell>
                                <TableCell>
                                    <TruncatedTooltipCell text={oficio.assunto} />
                                </TableCell>
                                <TableCell className="hidden md:table-cell max-w-[200px]">
                                  <TruncatedTooltipCell text={oficio.destinatario} />
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {oficio.responsavel}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <div className="flex flex-col text-xs">
                                    <span className="font-medium">
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
                                        <div className="mt-1">
                                          <StatusBadge oficio={oficio} />
                                        </div>
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
                                  <p className="font-semibold break-words">{oficio.assunto}</p>
                                  <p className="text-sm text-muted-foreground break-words">Destinatário: {oficio.destinatario}</p>
                               </CardContent>
                               <CardFooter className="flex justify-between items-start text-xs text-muted-foreground border-t pt-4 gap-4">
                                    <div className="flex items-start min-w-0 flex-1">
                                        <User className="mr-1.5 h-3 w-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex flex-col">
                                          <span>Criado por:</span>
                                          <span className="break-words leading-tight font-medium text-foreground/80">{oficio.responsavel}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start flex-shrink-0 text-right">
                                        <Calendar className="mr-1.5 h-3 w-3 mt-0.5" />
                                         <div className="flex flex-col">
                                            <span className="whitespace-nowrap">
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
                            <div className="text-center text-muted-foreground py-10">
                                Nenhum ofício encontrado.
                            </div>
                         )}
                      </div>
                    
                </CardContent>
                {hasMore && filteredOficios.length > 0 && !searchQuery && (
                    <CardFooter className="flex justify-center border-t pt-4">
                        <Button onClick={handleLoadMore} disabled={isLoadMorePending}>
                            {isLoadMorePending ? "Carregando..." : "Carregar Mais"}
                        </Button>
                    </CardFooter>
                )}
            </Card>
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
        </AlertDialog>
    );
}

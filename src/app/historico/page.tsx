
"use client";

import PageHeader from "@/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getHistorico, Historico } from "@/lib/oficios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 15;

export default function HistoricoPage() {
    const [historico, setHistorico] = useState<Historico[]>([]);
    const [lastVisible, setLastVisible] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isLoadMorePending, startLoadMoreTransition] = useTransition();
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        getHistorico(PAGE_SIZE)
            .then(({ historico: initialHistorico, lastVisible: newLastVisible }) => {
                setHistorico(initialHistorico);
                setLastVisible(newLastVisible);
                setHasMore(initialHistorico.length === PAGE_SIZE);
                setLoading(false);
            })
            .catch((e: unknown) => {
                console.error("Erro ao carregar histórico:", e);
                setError(e instanceof Error ? e : new Error("Ocorreu um erro desconhecido"));
                setLoading(false);
            });
    }, []);

    const handleLoadMore = () => {
      if (!lastVisible || !hasMore) return;
      
      startLoadMoreTransition(() => {
          getHistorico(PAGE_SIZE, lastVisible)
              .then(({ historico: newHistorico, lastVisible: newLastVisible }) => {
                  setHistorico(prev => [...prev, ...newHistorico]);
                  setLastVisible(newLastVisible);
                  setHasMore(newHistorico.length === PAGE_SIZE);
              })
              .catch((e: unknown) => {
                  console.error("Erro ao carregar mais histórico:", e);
                  setError(e instanceof Error ? e : new Error("Ocorreu um erro desconhecido"));
              });
      });
    };

    const renderSkeleton = () => (
      <TableRow>
          <TableCell className="font-medium">
              <Skeleton className="h-5 w-24" />
              <div className="md:hidden mt-1">
                <Skeleton className="h-4 w-32" />
              </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
              <Skeleton className="h-5 w-40" />
          </TableCell>
          <TableCell>
              <Skeleton className="h-5 w-full" />
          </TableCell>
      </TableRow>
  );

    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Histórico de Ações"
          description="Auditoria de todas as atividades realizadas no sistema."
        />
        <main className="flex-1 p-4 sm:p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar Dados</AlertTitle>
              <AlertDescription>
                Não foi possível carregar o histórico. Tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Data e Hora
                    </TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{renderSkeleton()}</TableRow>)}
                  {!loading && historico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>{item.acao}</div>
                        <div className="text-muted-foreground text-xs md:hidden">
                          {new Date(item.data).toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(item.data).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })}
                      </TableCell>
                      <TableCell>{item.detalhes}</TableCell>
                    </TableRow>
                  ))}
                   {!loading && historico.length === 0 && !error && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center">
                                Nenhum registro de histórico encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
             {hasMore && !loading && (
                <CardFooter className="flex justify-center border-t pt-4">
                    <Button onClick={handleLoadMore} disabled={isLoadMorePending}>
                        {isLoadMorePending ? "Carregando..." : "Carregar Mais"}
                    </Button>
                </CardFooter>
            )}
          </Card>
        </main>
      </div>
    );
}

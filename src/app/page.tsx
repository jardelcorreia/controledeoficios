
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOficiosRecentes, getProximoNumeroOficio, Oficio, Status } from "@/lib/oficios";
import { FilePlus2, Eye, Terminal, Calendar } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import NovoOficioForm from "@/components/NovoOficioForm";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<Status, string> = {
  "Aguardando Envio": "bg-yellow-500",
  "Enviado": "bg-blue-500",
};


export default function DashboardPage() {
  const [proximoNumero, setProximoNumero] = useState<string | null>(null);
  const [oficiosRecentes, setOficiosRecentes] = useState<Oficio[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();


  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [numero, recentes] = await Promise.all([
        getProximoNumeroOficio(),
        getOficiosRecentes(5),
      ]);
      setProximoNumero(numero);
      setOficiosRecentes(recentes);
    } catch (e: unknown) {
      console.error("Erro ao carregar dados do dashboard:", e);
      setError(
        e instanceof Error ? e : new Error("Ocorreu um erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOficioCreated = () => {
    setIsModalOpen(false);
    // Re-fetch data to show the new oficio in the list
    fetchData();
    router.refresh(); // force refresh for potential path revalidations
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de controle de ofícios."
      />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription>
              <p>
                Não foi possível carregar os dados do dashboard. Verifique sua
                conexão ou as configurações do Firestore.
              </p>
              <p className="mt-2 text-xs font-mono">
                <strong>Erro:</strong> {error.message}
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Próximo Ofício
              </CardTitle>
              <FilePlus2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-1/2 mb-2" />
                ) : (
                  <div className="text-2xl font-bold">
                    {proximoNumero || "..."}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Este será o número do próximo ofício a ser criado.
                </p>
              </div>
               <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                     <Button className="mt-4 w-full" disabled={!proximoNumero || loading}>
                        Usar este número
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Criar Novo Ofício</DialogTitle>
                           <DialogDescription>
                                O número do ofício a ser criado é:{" "}
                                <span className="font-bold text-primary">
                                    {proximoNumero}
                                </span>
                           </DialogDescription>
                      </DialogHeader>
                      {proximoNumero && (
                        <NovoOficioForm
                            proximoNumero={proximoNumero}
                            onOficioCreated={handleOficioCreated}
                            onCancel={() => setIsModalOpen(false)}
                        />
                      )}
                  </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Ofícios Recentes</CardTitle>
            <CardDescription>
              Últimos ofícios criados no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tabela para Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Destinatário
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Responsável
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                  {!loading && oficiosRecentes.length > 0
                    ? oficiosRecentes.map((oficio) => (
                        <TableRow key={oficio.id}>
                          <TableCell className="font-medium">
                            {oficio.numero}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge
                              className={`${
                                statusColors[oficio.status]
                              } text-white hover:${statusColors[oficio.status]}`}
                            >
                              {oficio.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] sm:max-w-[200px] truncate">
                            {oficio.assunto}
                          </TableCell>
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
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/oficios/${oficio.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Visualizar</span>
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    : !loading && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                            {error
                              ? "Não foi possível carregar os ofícios."
                              : "Nenhum ofício recente encontrado."}
                          </TableCell>
                        </TableRow>
                      )}
                </TableBody>
              </Table>
            </div>

            {/* Cards para Mobile */}
            <div className="md:hidden space-y-4">
               {loading && Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))}
              {!loading && oficiosRecentes.length > 0
                ? oficiosRecentes.map((oficio) => (
                    <Card key={oficio.id} className="flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle className="text-lg">
                            {oficio.numero}
                          </CardTitle>
                          <Badge
                            className={`${
                              statusColors[oficio.status]
                            } text-white hover:${statusColors[oficio.status]} mt-1`}
                          >
                            {oficio.status}
                          </Badge>
                        </div>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/oficios/${oficio.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Visualizar</span>
                          </Link>
                        </Button>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-1">
                        <p className="font-semibold leading-tight">
                          {oficio.assunto}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Dest.: {oficio.destinatario}
                        </p>
                      </CardContent>
                      <CardFooter className="flex items-center justify-end text-xs text-muted-foreground border-t pt-2">
                        <div className="flex items-center">
                          <Calendar className="mr-1.5 h-3 w-3" />
                          <span>
                            {new Date(oficio.data).toLocaleDateString("pt-BR", {
                              timeZone: "UTC",
                            })}
                          </span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                : !loading && (
                    <div className="text-center text-muted-foreground py-8">
                      {error
                        ? "Não foi possível carregar os ofícios."
                        : "Nenhum ofício recente encontrado."}
                    </div>
                  )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    
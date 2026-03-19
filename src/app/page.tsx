
"use client";

import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { 
  Oficio, 
  getNumeroFormatado, 
  NumeracaoConfig,
  statusList 
} from "@/lib/oficios";
import { FilePlus2, Eye, User, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import NovoOficioDialog from "@/components/NovoOficioDialog";
import { useEffect, useState } from "react";
import TruncatedTooltipCell from "@/components/TruncatedTooltipCell";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc,
  where
} from "firebase/firestore";

export default function DashboardPage() {
  const [oficiosRecentes, setOficiosRecentes] = useState<Oficio[]>([]);
  const [proximoNumero, setProximoNumero] = useState<string | null>(null);
  const [config, setConfig] = useState<NumeracaoConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Listener para Ofícios Recentes
  useEffect(() => {
    const q = query(
      collection(db, "oficios"),
      orderBy("data", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Oficio));
      setOficiosRecentes(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listener para Configurações e Cálculo do Próximo Número
  useEffect(() => {
    const configRef = doc(db, "config", "numeracao");
    
    const unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const configData = docSnap.data() as NumeracaoConfig;
        setConfig(configData);
        
        // Buscar o último ofício do ano da config para calcular o próximo
        const qUltimo = query(
          collection(db, "oficios"),
          where("ano", "==", configData.anoBase),
          orderBy("numeroSequencial", "desc"),
          limit(1)
        );

        onSnapshot(qUltimo, (ultimoSnap) => {
          let proximoSeq = configData.numeroInicial || 1;
          if (!ultimoSnap.empty) {
            const ultimoOficio = ultimoSnap.docs[0].data() as Oficio;
            proximoSeq = Math.max(ultimoOficio.numeroSequencial + 1, configData.numeroInicial);
          }
          
          getNumeroFormatado(
            proximoSeq,
            configData.anoBase,
            configData.prefixo,
            configData.sufixo
          ).then(setProximoNumero);
        });
      } else {
        // Configuração padrão se não existir
        const defaultConfig: NumeracaoConfig = {
          prefixo: 'OF',
          sufixo: 'GAB',
          anoBase: new Date().getFullYear(),
          numeroInicial: 1,
        };
        setConfig(defaultConfig);
      }
    });

    return () => unsubscribeConfig();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de controle de ofícios."
      />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
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
                <div className="text-2xl font-bold">
                  {proximoNumero || (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-normal">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculando...
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Este será o número do próximo ofício a ser criado.
                </p>
              </div>
              <NovoOficioDialog
                proximoNumero={proximoNumero}
                triggerButton={
                  <Button className="mt-4 w-full" disabled={!proximoNumero}>
                    Usar este número
                  </Button>
                }
              />
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Tabela para Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead className="hidden sm:table-cell w-[1px]">Status</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead className="hidden md:table-cell max-w-[200px]">
                          Destinatário
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Criado por:
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">Data e Hora</TableHead>
                        <TableHead>
                          <span className="sr-only">Ações</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oficiosRecentes.length > 0
                        ? oficiosRecentes.map((oficio) => (
                            <TableRow key={oficio.id}>
                              <TableCell className="font-medium">
                                {oficio.numero}
                              </TableCell>
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
                                <Button asChild variant="ghost" size="icon">
                                  <Link href={`/oficios/${oficio.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Visualizar</span>
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center h-24">
                                Nenhum ofício recente encontrado.
                              </TableCell>
                            </TableRow>
                          )}
                    </TableBody>
                  </Table>
                </div>

                {/* Cards para Mobile */}
                <div className="md:hidden space-y-4">
                  {oficiosRecentes.length > 0
                    ? oficiosRecentes.map((oficio) => (
                        <Card key={oficio.id} className="flex flex-col">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                              <CardTitle className="text-lg">
                                {oficio.numero}
                              </CardTitle>
                              <div className="mt-1">
                                <StatusBadge oficio={oficio} />
                              </div>
                            </div>
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/oficios/${oficio.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Visualizar</span>
                              </Link>
                            </Button>
                          </CardHeader>
                          <CardContent className="flex-1 space-y-1">
                            <p className="font-semibold leading-tight break-words">
                              {oficio.assunto}
                            </p>
                            <p className="text-sm text-muted-foreground break-words">
                              Dest.: {oficio.destinatario}
                            </p>
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
                      ))
                    : (
                        <div className="text-center text-muted-foreground py-8">
                          Nenhum ofício recente encontrado.
                        </div>
                      )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

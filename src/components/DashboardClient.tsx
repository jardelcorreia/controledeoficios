"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Oficio, 
  getNumeroFormatado, 
  NumeracaoConfig
} from "@/lib/oficios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Eye, User, Calendar, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import NovoOficioDialog from "@/components/NovoOficioDialog";
import TruncatedTooltipCell from "@/components/TruncatedTooltipCell";
import StatusBadge from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardClient() {
  const [oficiosRecentes, setOficiosRecentes] = useState<Oficio[]>([]);
  const [proximoNumero, setProximoNumero] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }, (err) => {
      console.error("Erro no listener de ofícios recentes:", err);
      setError("Falha ao sincronizar dados recentes.");
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
        
        const qUltimo = query(
          collection(db, "oficios"),
          where("ano", "==", configData.anoBase),
          orderBy("numeroSequencial", "desc"),
          limit(1)
        );

        const unsubscribeUltimo = onSnapshot(qUltimo, (ultimoSnap) => {
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
        }, (err) => {
          console.error("Erro ao calcular próximo número:", err);
          setError("Erro no cálculo da numeração automática.");
        });

        return () => unsubscribeUltimo();
      }
    }, (err) => {
      console.error("Erro ao carregar configurações:", err);
    });

    return () => unsubscribeConfig();
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Sincronização</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 flex flex-col border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Ofício</CardTitle>
            <FilePlus2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {proximoNumero || (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-normal">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculando...
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este será o próximo número de ofício a ser criado
              </p>
            </div>
            <NovoOficioDialog
              proximoNumero={proximoNumero}
              triggerButton={
                <Button className="mt-6 w-full shadow-md" disabled={!proximoNumero}>
                  Usar este número
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Ofícios Recentes</CardTitle>
          <CardDescription>
            Últimos ofícios criados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[140px]">Número</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="hidden md:table-cell">Destinatário</TableHead>
                      <TableHead className="hidden md:table-cell w-[180px]">Criado por:</TableHead>
                      <TableHead className="w-[110px]">Data / Hora</TableHead>
                      <TableHead className="w-[50px]"><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oficiosRecentes.length > 0 ? (
                      oficiosRecentes.map((oficio) => (
                        <TableRow key={oficio.id}>
                          <TableCell className="font-bold text-primary">{oficio.numero}</TableCell>
                          <TableCell><StatusBadge oficio={oficio} /></TableCell>
                          <TableCell><TruncatedTooltipCell text={oficio.assunto} /></TableCell>
                          <TableCell className="hidden md:table-cell"><TruncatedTooltipCell text={oficio.destinatario} /></TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{oficio.responsavel}</TableCell>
                          <TableCell>
                            <div className="flex flex-col text-[11px] leading-tight">
                              <span className="font-semibold">{new Date(oficio.data).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                              <span className="text-muted-foreground">{new Date(oficio.data).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <Link href={`/oficios/${oficio.id}`}><Eye className="h-4 w-4" /></Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground italic">Nenhum ofício encontrado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {oficiosRecentes.length > 0 ? (
                  oficiosRecentes.map((oficio) => (
                    <Card key={oficio.id} className="flex flex-col shadow-sm border-l-4 border-l-primary">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle className="text-lg font-bold text-primary">{oficio.numero}</CardTitle>
                          <div className="mt-1"><StatusBadge oficio={oficio} /></div>
                        </div>
                        <Button asChild variant="ghost" size="icon" className="h-10 w-10">
                          <Link href={`/oficios/${oficio.id}`}><Eye className="h-5 w-5" /></Link>
                        </Button>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-1 py-2">
                        <p className="font-semibold leading-tight text-sm break-words">{oficio.assunto}</p>
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
                            <span className="whitespace-nowrap font-medium">{new Date(oficio.data).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                            <span className="whitespace-nowrap">{new Date(oficio.data).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12 bg-muted/10 rounded-lg border border-dashed">Nenhum ofício encontrado.</div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

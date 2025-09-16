
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
import { getOficiosRecentes, getProximoNumeroOficio, Oficio, Status } from "@/lib/oficios";
import { FilePlus2, Eye, Terminal, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import NovoOficioDialog from "@/components/NovoOficioDialog";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

const statusColors: Record<Status, string> = {
  "Aguardando Envio": "bg-yellow-500",
  "Enviado": "bg-blue-500",
};

async function ProximoOficioCard() {
  const proximoNumero = await getProximoNumeroOficio();
  return (
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
            {proximoNumero || "..."}
          </div>
          <p className="text-xs text-muted-foreground">
            Este será o número do próximo ofício a ser criado.
          </p>
        </div>
        <NovoOficioDialog
          proximoNumero={proximoNumero}
          triggerButton={
            <Button className="mt-4 w-full" disabled={!proximoNumero}>
              Criar Novo Ofício
            </Button>
          }
        />
      </CardContent>
    </Card>
  )
}

async function OficiosRecentesTable() {
  const oficiosRecentes = await getOficiosRecentes(5);
  return (
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
                <TableHead className="hidden md:table-cell">
                  Responsável
                </TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
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
                      <TableCell className="hidden md:table-cell">
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
                  <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                    <div className="flex items-center truncate">
                        <User className="mr-1.5 h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{oficio.responsavel}</span>
                    </div>
                    <div className="flex items-center flex-shrink-0">
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
            : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum ofício recente encontrado.
                </div>
              )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de controle de ofícios."
      />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader><CardContent><p>Buscando próximo número...</p></CardContent></Card>}>
              <ProximoOficioCard />
          </Suspense>
        </div>
         <Suspense fallback={<Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader><CardContent><p>Buscando ofícios recentes...</p></CardContent></Card>}>
            <OficiosRecentesTable />
        </Suspense>
      </main>
    </div>
  );
}

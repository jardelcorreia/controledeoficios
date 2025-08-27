
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOficiosRecentes, getProximoNumeroOficio } from "@/lib/oficios";
import { FilePlus2, Eye, Terminal } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

async function DashboardPage() {
    let proximoNumero = null;
    let oficiosRecentes = [];
    let error = null;

    try {
        // Usando Promise.all para carregar dados em paralelo
        [proximoNumero, oficiosRecentes] = await Promise.all([
            getProximoNumeroOficio(),
            getOficiosRecentes(5)
        ]);
    } catch (e: any) {
        // Captura o erro para exibição
        console.error("Erro ao carregar dados do dashboard:", e);
        error = e;
    }

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
                <AlertTitle>
                  Erro ao carregar dados
                </AlertTitle>
                <AlertDescription>
                  <p>Não foi possível carregar os dados do dashboard. Isso pode ser devido a um índice ausente no Firestore.</p>
                  <p className="mt-2 text-xs font-mono">
                    <strong>Erro:</strong> {error.message}
                  </p>
                </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximo Ofício</CardTitle>
                <FilePlus2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-2xl font-bold">{proximoNumero || '...'}</div>
                  <p className="text-xs text-muted-foreground">
                    Este será o número do próximo ofício a ser criado.
                  </p>
                </div>
                <Button asChild className="mt-4 w-full" disabled={!proximoNumero}>
                  <Link href="/oficios/novo">
                    Criar Novo Ofício
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Ofícios Recentes</CardTitle>
              <CardDescription>Últimos ofícios criados no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oficiosRecentes.length > 0 ? oficiosRecentes.map((oficio) => (
                    <TableRow key={oficio.id}>
                      <TableCell className="font-medium">{oficio.numero}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{oficio.assunto}</TableCell>
                      <TableCell>
                        {oficio.destinatario}
                      </TableCell>
                      <TableCell>
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
                  )) : (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            {error ? "Não foi possível carregar os ofícios." : "Nenhum ofício recente encontrado."}
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    );
}

export default DashboardPage;

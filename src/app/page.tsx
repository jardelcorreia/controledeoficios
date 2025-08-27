
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOficiosRecentes, getProximoNumeroOficio } from "@/lib/oficios";
import { FilePlus2, Eye, Terminal } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

async function DashboardPage() {
  try {
    const proximoNumero = await getProximoNumeroOficio();
    const oficiosRecentes = await getOficiosRecentes(5);

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
                <CardTitle className="text-sm font-medium">Próximo Ofício</CardTitle>
                <FilePlus2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-2xl font-bold">{proximoNumero}</div>
                  <p className="text-xs text-muted-foreground">
                    Este será o número do próximo ofício a ser criado.
                  </p>
                </div>
                <Button asChild className="mt-4 w-full">
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
                  {oficiosRecentes.map((oficio) => (
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  } catch (error: any) {
    console.error("Erro ao carregar o dashboard:", error);
    const isPermissionError = error.message.includes("PERMISSION_DENIED");
    const isFirestoreApiDisabled = error.message.includes("firestore.googleapis.com");

    let title = "Erro de Conexão";
    let description = "Não foi possível carregar os dados. Verifique sua conexão com a internet ou as configurações do Firebase.";

    if (isPermissionError) {
      title = "Erro de Permissão";
      description = "As regras de segurança do Firestore não permitem o acesso. Verifique se o arquivo firestore.rules foi implantado corretamente e se a API do Firestore está ativa.";
    } else if (isFirestoreApiDisabled) {
      title = "API do Firestore Desativada";
      description = "A API Cloud Firestore pode estar desativada ou há um problema de conexão. Verifique o status da API no Console do Google Cloud e sua conexão com a internet.";
    }
    
    return (
       <div className="flex flex-col h-full">
        <PageHeader
          title="Dashboard"
          description="Visão geral do sistema de controle de ofícios."
        />
        <main className="flex-1 p-4 sm:p-6">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>
              {title}
            </AlertTitle>
            <AlertDescription>
              {description}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }
}

export default DashboardPage;

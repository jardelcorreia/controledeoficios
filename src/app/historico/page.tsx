
import PageHeader from "@/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHistorico } from "@/lib/oficios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


export default async function HistoricoPage() {
  try {
    const historico = await getHistorico();

    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Histórico de Ações"
          description="Auditoria de todas as atividades realizadas no sistema."
        />
        <main className="flex-1 p-4 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.acao}</TableCell>
                      <TableCell>
                        {new Date(item.data).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo", // Ajuste para o seu fuso horário
                        })}
                      </TableCell>
                      <TableCell>{item.detalhes}</TableCell>
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
    console.error("Erro ao carregar histórico:", error);
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
          title="Histórico de Ações"
          description="Auditoria de todas as atividades realizadas no sistema."
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


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
    } catch (e: any) {
        const isPermissionError = e.code === 'permission-denied';
         return (
            <div className="flex flex-col h-full">
                 <PageHeader
                    title="Erro ao carregar histórico"
                    description="Não foi possível buscar os dados do Firestore."
                 />
                 <main className="flex-1 p-4 sm:p-6">
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>
                            {isPermissionError ? "Erro de Permissão" : "Erro de Conexão"}
                        </AlertTitle>
                        <AlertDescription>
                            {isPermissionError
                                ? "Verifique as regras de segurança do Firestore. É necessário permitir a leitura da coleção 'historico'."
                                : "A API Cloud Firestore pode estar desativada ou há um problema de conexão. Verifique o status da API no Console do Google Cloud e sua conexão com a internet."
                            }
                             <p className="mt-2 text-xs font-mono">{e.message}</p>
                        </AlertDescription>
                    </Alert>
                 </main>
            </div>
        )
    }
}

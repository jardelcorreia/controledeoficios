
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
    let historico = [];
    let error = null;

    try {
        historico = await getHistorico();
    } catch (e: any) {
        console.error("Erro ao carregar histórico:", e);
        error = e;
    }

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
                  {historico.map((item) => (
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
                          timeZone: "America/Sao_Paulo", // Ajuste para o seu fuso horário
                        })}
                      </TableCell>
                      <TableCell>{item.detalhes}</TableCell>
                    </TableRow>
                  ))}
                   {historico.length === 0 && !error && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center">
                                Nenhum registro de histórico encontrado.
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

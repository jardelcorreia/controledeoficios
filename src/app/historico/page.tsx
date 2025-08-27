
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
                        <TableHead className="hidden md:table-cell">Data e Hora</TableHead>
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
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </main>
          </div>
        );
    } catch (e: any) {
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
                            Erro ao carregar dados
                        </AlertTitle>
                        <AlertDescription>
                           <p>Não foi possível carregar os dados. Verifique sua conexão ou a configuração do Firestore.</p>
                           <p className="mt-2 text-xs font-mono">{e.message}</p>
                        </AlertDescription>
                    </Alert>
                 </main>
            </div>
        )
    }
}

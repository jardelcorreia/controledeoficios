
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
import { mockHistorico } from "@/lib/mock-data";

export default function HistoricoPage() {
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
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHistorico.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.acao}</TableCell>
                    <TableCell>{item.usuario}</TableCell>
                    <TableCell>{item.data}</TableCell>
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
}

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockHistorico } from "@/lib/mock-data";
import { ArrowDownLeft, ArrowUpRight, Clock, Sigma } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Ofícios Enviados", value: "125", icon: ArrowUpRight },
    { title: "Ofícios Recebidos", value: "88", icon: ArrowDownLeft },
    { title: "Pendentes de Resposta", value: "12", icon: Clock },
    { title: "Total de Ofícios", value: "213", icon: Sigma },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de controle de ofícios."
      />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações registradas no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead className="hidden md:table-cell">Usuário</TableHead>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead className="hidden lg:table-cell">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHistorico.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.acao}</TableCell>
                    <TableCell className="hidden md:table-cell">{item.usuario}</TableCell>
                    <TableCell>{item.data}</TableCell>
                    <TableCell className="hidden lg:table-cell">{item.detalhes}</TableCell>
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

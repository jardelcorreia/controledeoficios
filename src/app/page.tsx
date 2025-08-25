
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockHistorico, mockOficios } from "@/lib/mock-data";
import { ArrowUpRight, Sigma, FilePlus2 } from "lucide-react";
import Link from "next/link";

function getProximoNumeroOficio() {
  const oficiosEnviados = mockOficios
    .filter(o => o.tipo === 'enviado' && o.numero.includes('/2024-GAB'))
    .map(o => {
      const match = o.numero.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .sort((a, b) => b - a);

  const ultimoNumero = oficiosEnviados.length > 0 ? oficiosEnviados[0] : 0;
  const proximoNumero = (ultimoNumero + 1).toString().padStart(3, '0');
  
  return `${proximoNumero}/2024-GAB`;
}


export default function DashboardPage() {
  const totalEnviados = mockOficios.filter(o => o.tipo === 'enviado').length;
  const totalRecebidos = mockOficios.filter(o => o.tipo === 'recebido').length;
  const proximoNumero = getProximoNumeroOficio();

  const stats = [
    { title: "Ofícios Enviados", value: totalEnviados.toString(), icon: ArrowUpRight },
    { title: "Total de Ofícios", value: (totalEnviados + totalRecebidos).toString(), icon: Sigma },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de controle de ofícios."
      />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Ofício</CardTitle>
              <FilePlus2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div>
                <div className="text-2xl font-bold">{proximoNumero}</div>
              </div>
              <Button asChild className="mt-2 w-full">
                <Link href="/oficios/novo">
                  Usar este número
                </Link>
              </Button>
            </CardContent>
          </Card>
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

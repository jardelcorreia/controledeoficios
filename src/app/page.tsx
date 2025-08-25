
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockOficios } from "@/lib/mock-data";
import { ArrowUpRight, Sigma, FilePlus2, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const statusVariantMap: {
  [key: string]: "default" | "secondary" | "destructive" | "outline";
} = {
  pendente: "secondary",
  respondido: "default",
  arquivado: "outline",
};


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
  const proximoNumero = getProximoNumeroOficio();

  const stats = [
    { title: "Ofícios Enviados", value: totalEnviados.toString(), icon: ArrowUpRight },
  ];

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
            <CardTitle>Ofícios Recentes</CardTitle>
            <CardDescription>Últimos ofícios criados no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead className="hidden md:table-cell">Destinatário</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOficios.filter(o => o.tipo === 'enviado').slice(0, 5).map((oficio) => (
                  <TableRow key={oficio.id}>
                    <TableCell className="font-medium">{oficio.numero}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{oficio.assunto}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {oficio.destinatario}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(oficio.data).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariantMap[oficio.status] || "default"}
                      >
                        {oficio.status.charAt(0).toUpperCase() +
                          oficio.status.slice(1)}
                      </Badge>
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
}

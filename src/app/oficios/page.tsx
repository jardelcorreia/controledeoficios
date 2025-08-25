
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockOficios } from "@/lib/mock-data";
import { PlusCircle, MoreHorizontal, FileEdit, Eye } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OficiosPage() {
  const oficiosEnviados = mockOficios.filter(o => o.tipo === 'enviado');

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Gerenciamento de Ofícios"
        description="Crie, edite e visualize os ofícios enviados."
      >
        <Button asChild>
          <Link href="/oficios/novo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Ofício
          </Link>
        </Button>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Ofícios</CardTitle>
            <CardDescription>
              Todos os documentos enviados.
            </CardDescription>
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
                {oficiosEnviados.map((oficio) => (
                  <TableRow key={oficio.id}>
                    <TableCell className="font-medium">{oficio.numero}</TableCell>
                    <TableCell className="max-w-[250px] truncate">{oficio.assunto}</TableCell>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/oficios/${oficio.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/oficios/${oficio.id}/editar`}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

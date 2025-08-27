
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
import { getOficios } from "@/lib/oficios";
import { PlusCircle, MoreHorizontal, FileEdit, Eye, Terminal } from "lucide-react";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


export default async function OficiosPage() {
    try {
        const oficiosEnviados = await getOficios();
        return (
          <div className="flex flex-col h-full">
            <PageHeader
              title="Gerenciamento de Ofícios"
              description="Crie, edite e visualize os ofícios enviados."
            >
              <Button asChild>
                <Link href="/oficios/novo">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Novo Ofício</span>
                  <span className="inline sm:hidden">Novo</span>
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
                        <TableHead className="w-[120px]">Número</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead className="hidden md:table-cell">Destinatário</TableHead>
                        <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                        <TableHead className="hidden sm:table-cell w-[120px]">Data</TableHead>
                        <TableHead>
                          <span className="sr-only">Ações</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oficiosEnviados.map((oficio) => (
                        <TableRow key={oficio.id}>
                          <TableCell className="font-medium">{oficio.numero}</TableCell>
                          <TableCell className="max-w-[200px] sm:max-w-[250px] truncate">{oficio.assunto}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {oficio.destinatario}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
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
    } catch(e: any) {
        return (
            <div className="flex flex-col h-full">
                 <PageHeader
                    title="Erro ao carregar ofícios"
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

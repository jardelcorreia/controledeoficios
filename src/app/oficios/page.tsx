
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
  } catch (error: any) {
    console.error("Erro ao carregar ofícios:", error);
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

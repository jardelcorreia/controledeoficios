
"use client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { mockOficios, Oficio } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  assunto: z.string().min(5, "O assunto deve ter pelo menos 5 caracteres."),
  destinatario: z.string().min(3, "O destinatário é obrigatório."),
  responsavel: z.string().min(3, "O responsável é obrigatório."),
});

export default function EditarOficioPage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const router = useRouter();

  const oficio = mockOficios.find((o) => o.id === params.id);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assunto: oficio?.assunto || "",
      destinatario: oficio?.destinatario || "",
      responsavel: oficio?.responsavel || "",
    },
  });

  if (!oficio) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Erro" description="Ofício não encontrado." />
        <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <p className="mb-4">
            O ofício que você está procurando não existe ou foi movido.
          </p>
          <Button asChild>
            <Link href="/oficios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Ofícios
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({ ...values, id: oficio?.id });
    toast({
      title: "Ofício Atualizado!",
      description: `O ofício nº ${oficio?.numero} foi atualizado com sucesso.`,
    });
    router.push(`/oficios/${oficio?.id}`);
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Editar Ofício Nº ${oficio.numero}`}
        description="Altere os dados necessários e salve."
      />
      <main className="flex-1 p-4 sm:p-6">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Detalhes do Ofício</CardTitle>
                <CardDescription>
                  Ajuste as informações abaixo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="assunto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Solicitação de informações"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinatario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinatário</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Secretaria de Obras"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Nome do responsável pelo envio"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/oficios/${oficio.id}`}>Cancelar</Link>
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}

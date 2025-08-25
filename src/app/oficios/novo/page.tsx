
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
import { mockOficios } from "@/lib/mock-data";

const formSchema = z.object({
  assunto: z.string().min(5, "O assunto deve ter pelo menos 5 caracteres."),
  destinatario: z.string().min(3, "O destinatário é obrigatório."),
  responsavel: z.string().min(3, "O responsável é obrigatório."),
});

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


export default function NovoOficioPage() {
  const { toast } = useToast();
  const router = useRouter();
  const proximoNumero = getProximoNumeroOficio();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assunto: "",
      destinatario: "",
      responsavel: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({ ...values, tipo: 'enviado', numero: proximoNumero });
    toast({
      title: "Ofício Criado!",
      description: `O ofício nº ${proximoNumero} foi salvo com sucesso.`,
    });
    router.push("/oficios");
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Novo Ofício"
        description="Preencha os dados para criar um novo ofício."
      />
      <main className="flex-1 p-4 sm:p-6">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Detalhes do Ofício</CardTitle>
                <CardDescription>
                  O número do ofício a ser criado é: <span className="font-bold text-primary">{proximoNumero}</span>
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
                  <Link href="/oficios">Cancelar</Link>
                </Button>
                <Button type="submit">Salvar Ofício</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}


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
import { getProximoNumeroOficio } from "@/lib/oficios";
import { createOficio } from "@/lib/oficios.actions";
import { useEffect, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  assunto: z.string().min(5, "O assunto deve ter pelo menos 5 caracteres."),
  destinatario: z.string().min(3, "O destinatário é obrigatório."),
  responsavel: z.string().min(3, "O responsável é obrigatório."),
});

export default function NovoOficioPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [proximoNumero, setProximoNumero] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getProximoNumeroOficio().then(setProximoNumero).catch(() => setProximoNumero('Erro!'));
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assunto: "",
      destinatario: "",
      responsavel: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await createOficio(values);
        toast({
          title: "Ofício Criado!",
          description: `O ofício nº ${proximoNumero} foi salvo com sucesso.`,
        });
        router.push("/oficios");
      } catch (err) {
         toast({
          title: "Erro ao criar ofício",
          description: "Não foi possível criar o ofício. Verifique as configurações e tente novamente.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Novo Ofício"
        description="Preencha os dados para criar um novo ofício."
      />
      <main className="flex-1 p-4 sm:p-6">
        <Card className="max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Detalhes do Ofício</CardTitle>
                <CardDescription>
                  O número do ofício a ser criado é:{" "}
                  {proximoNumero ? (
                     <span className="font-bold text-primary">
                        {proximoNumero}
                     </span>
                  ) : (
                     <Skeleton className="inline-block h-5 w-40" />
                  )
                  }
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
                          placeholder="Digite o assunto do ofício"
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
                          placeholder="Ex: Setor Financeiro"
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
                          placeholder="Digite o seu nome"
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
                <Button type="submit" disabled={isPending || !proximoNumero}>
                  {isPending ? "Salvando..." : "Salvar Ofício"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}

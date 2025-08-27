
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { getNumeracaoConfig, saveNumeracaoConfig, NumeracaoConfig } from "@/lib/oficios";
import { useEffect, useTransition, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


const formSchema = z.object({
  prefixo: z.string().optional(),
  sufixo: z.string().optional(),
  anoBase: z.coerce.number().min(2000).max(2100),
  numeroInicial: z.coerce.number().min(1),
});

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prefixo: "",
      sufixo: "",
      anoBase: new Date().getFullYear(),
      numeroInicial: 1,
    },
  });

  useEffect(() => {
    setLoading(true);
    getNumeracaoConfig().then((config) => {
        // A config sempre será retornada, com valores do DB ou padrão.
        form.reset(config);
        setLoading(false);
    }).catch(err => {
        // O catch agora só deve pegar erros de permissão ou conexão real.
        console.error(err);
        setError(err);
        setLoading(false);
    });
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
       try {
        await saveNumeracaoConfig(values);
        toast({
          title: "Configurações Salvas!",
          description: "As configurações de numeração foram atualizadas.",
        });
      } catch (error) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar as configurações.",
          variant: "destructive",
        });
      }
    });
  }
   if (error) {
    const isPermissionError = error.message.includes("PERMISSION_DENIED");
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Configurações"
          description="Ajuste as configurações gerais do sistema."
        />
        <main className="flex-1 p-4 sm:p-6">
          <Alert variant={isPermissionError ? "destructive" : "default"}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>
              {isPermissionError
                ? "Erro de Permissão"
                : "Erro de Conexão"}
            </AlertTitle>
            <AlertDescription>
              {isPermissionError
                ? "As regras de segurança do Firestore não permitem o acesso. Verifique se o arquivo firestore.rules foi implantado corretamente."
                : "Não foi possível carregar os dados. Verifique sua conexão com a internet ou as configurações do Firebase."}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
       <div className="flex flex-col h-full">
        <PageHeader
          title="Configurações"
          description="Ajuste as configurações gerais do sistema."
        />
        <main className="flex-1 p-4 sm:p-6">
          <Card className="max-w-2xl mx-auto">
             <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
               <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
               <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Skeleton className="h-10 w-40" />
            </CardFooter>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Configurações"
        description="Ajuste as configurações gerais do sistema."
      />
      <main className="flex-1 p-4 sm:p-6">
        <Card className="max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Numeração de Ofícios</CardTitle>
                <CardDescription>
                  Configure o formato para a numeração automática dos ofícios.
                  Exemplo: OF-001/2024-GAB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="prefixo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prefixo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: OF" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Texto que aparece antes do número do ofício.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sufixo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sufixo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: GAB" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Texto que aparece após o ano. (Opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="anoBase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Base</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 2024" {...field} />
                      </FormControl>
                      <FormDescription>
                        O ano corrente para a numeração. A contagem reinicia a
                        cada ano.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="numeroInicial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número Inicial</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 1" {...field} />
                      </FormControl>
                      <FormDescription>
                        A contagem iniciará a partir deste número a cada ano, a menos que já exista um número maior.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}

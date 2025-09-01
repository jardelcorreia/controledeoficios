
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
import { getNumeracaoConfig, NumeracaoConfig } from "@/lib/oficios";
import { saveNumeracaoConfig, savePushSubscription } from "@/lib/oficios.actions";
import { useEffect, useTransition, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, BellRing } from "lucide-react";


const formSchema = z.object({
  prefixo: z.string().optional(),
  sufixo: z.string().optional(),
  anoBase: z.coerce.number().min(2000).max(2100),
  numeroInicial: z.coerce.number().min(1),
});

// Chave pública VAPID - Substitua por suas chaves geradas
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [isSubscribing, setIsSubscribing] = useState(false);


  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleNotificationPermission = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast({ title: "Erro", description: "Este navegador não suporta notificações push.", variant: "destructive"});
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
        toast({ title: "Erro de Configuração", description: "A chave pública VAPID para notificações não está configurada.", variant: "destructive"});
        console.error("VAPID public key is not set in environment variables.");
        return;
    }

    if (Notification.permission === "granted") {
        toast({ title: "Notificações já ativadas", description: "Você já permitiu o envio de notificações."});
        return;
    }

    if (Notification.permission === "denied") {
        toast({ title: "Permissão bloqueada", description: "Você bloqueou as notificações. Altere nas configurações do seu navegador.", variant: "destructive"});
        return;
    }

    setIsSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        await navigator.serviceWorker.register('/sw.js');
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Enviar a inscrição para o servidor
        const result = await savePushSubscription(subscription);

        if (result.success) {
            toast({ title: "Sucesso!", description: "Você receberá notificações importantes."});
        } else {
             throw new Error(result.error || "Falha ao salvar inscrição.");
        }
      } else {
        toast({ title: "Permissão negada", description: "Você não receberá notificações.", variant: "destructive"});
      }
    } catch (err: any) {
      console.error("Erro ao solicitar permissão de notificação:", err);
      toast({ title: "Erro", description: err.message || "Não foi possível ativar as notificações.", variant: "destructive"});
    } finally {
      setIsSubscribing(false);
    }
  };


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
        if (config) {
          form.reset(config);
        }
        setLoading(false);
    }).catch(err => {
        console.error("Erro ao carregar configurações:", err);
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
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Configurações"
          description="Ajuste as configurações gerais do sistema."
        />
        <main className="flex-1 p-4 sm:p-6">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>
              Erro ao Carregar
            </AlertTitle>
            <AlertDescription>
              Não foi possível carregar as configurações. Tente novamente mais tarde.
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
      <main className="flex-1 p-4 sm:p-6 space-y-6">
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

        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                    Receba alertas sobre novos ofícios e ofícios enviados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center space-x-2">
                    <BellRing className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Status atual:{" "}
                        <span className="font-semibold">
                            {notificationPermission === 'granted' && "Ativadas"}
                            {notificationPermission === 'denied' && "Bloqueadas"}
                            {notificationPermission === 'default' && "Não solicitado"}
                        </span>
                    </p>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleNotificationPermission} disabled={notificationPermission === 'granted' || notificationPermission === 'denied' || isSubscribing}>
                    {isSubscribing ? "Ativando..." : notificationPermission === 'granted' ? "Notificações Ativadas" : "Ativar Notificações"}
                </Button>
            </CardFooter>
        </Card>

      </main>
    </div>
  );
}


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
import { getNumeracaoConfig } from "@/lib/oficios";
import { saveNumeracaoConfig } from "@/lib/oficios.actions";
import { useEffect, useTransition, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, BellRing, Download, BellOff, AlertCircle } from "lucide-react";
import { initializePushNotifications } from "@/lib/push";
import { getToken } from "firebase/messaging";
import { getMessaging } from "firebase/messaging";
import { app } from "@/lib/firebase";


type SubscriptionState = "SUBSCRIBED" | "UNSUBSCRIBED" | "BLOCKED";

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
  
  const [subState, setSubState] = useState<SubscriptionState>("UNSUBSCRIBED");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);


  const checkSubscriptionStatus = useCallback(async () => {
    setPushError(null);
    try {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            setSubState("BLOCKED");
            return;
        }

        const permission = Notification.permission;
        if (permission === 'denied') {
            setSubState('BLOCKED');
            return;
        }

        if (permission === 'granted') {
            const messagingInstance = getMessaging(app);
            const serviceWorkerRegistration = await navigator.serviceWorker.ready;
            const currentToken = await getToken(messagingInstance, { serviceWorkerRegistration });
            setSubState(currentToken ? 'SUBSCRIBED' : 'UNSUBSCRIBED');
        } else {
            setSubState('UNSUBSCRIBED');
        }
    } catch (e) {
        console.error("Erro ao verificar status da subscrição:", e);
        setSubState('UNSUBSCRIBED');
    }
  }, []);

  useEffect(() => {
    checkSubscriptionStatus();

    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Adiciona listener para mudanças de permissão
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
            permissionStatus.onchange = () => {
                checkSubscriptionStatus();
            };
        });
    }

    // Listener para quando o app volta a ficar visível
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkSubscriptionStatus();
        }
    });

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        document.removeEventListener('visibilitychange', checkSubscriptionStatus);
    };

  }, [checkSubscriptionStatus]);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    const promptEvent = installPrompt as any;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
       toast({ title: "Instalado!", description: "O aplicativo foi adicionado à sua tela inicial."});
    } else {
       toast({ title: "Instalação cancelada", description: "Você pode instalar o aplicativo a qualquer momento."});
    }
    setInstallPrompt(null);
  };

  const handleSubscription = async () => {
    setIsSubscribing(true);
    setPushError(null);
    try {
      const permissionResult = await initializePushNotifications();
       if (permissionResult === 'granted') {
            toast({ title: "Sucesso!", description: "As notificações foram ativadas." });
            setSubState('SUBSCRIBED');
      } else {
         toast({ 
            title: "Permissão Necessária", 
            description: "Você precisa permitir as notificações para ativá-las.",
            variant: "destructive"
          });
         setSubState('UNSUBSCRIBED');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido";
      console.error('Erro ao ativar notificações:', err);
      setPushError(message);
      toast({ 
        title: "Erro ao ativar notificações", 
        description: message,
        variant: "destructive"
      });
      checkSubscriptionStatus(); // Re-verifica em caso de erro
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
    }).catch((err: unknown) => {
        console.error("Erro ao carregar configurações:", err);
        setError(err instanceof Error ? err : new Error("Ocorreu um erro desconhecido"));
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
      } catch (err) {
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
                 {pushError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Falha na Ativação</AlertTitle>
                      <AlertDescription>
                          <p>{pushError}</p>
                          <p className="mt-2 text-xs">
                              Por favor, verifique as permissões de notificação no seu navegador e tente novamente.
                          </p>
                      </AlertDescription>
                    </Alert>
                 )}
                 <div className="flex items-center space-x-2">
                    {subState === 'SUBSCRIBED' ? <BellRing className="h-5 w-5 text-green-500" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                    <p className="text-sm text-muted-foreground">
                        Status atual:{" "}
                        <span className="font-semibold">
                            {subState === 'SUBSCRIBED' && "Ativadas"}
                            {subState === 'BLOCKED' && "Bloqueadas pelo navegador"}
                            {subState === 'UNSUBSCRIBED' && "Desativadas"}
                        </span>
                    </p>
                </div>
                 {subState === 'BLOCKED' && (
                     <p className="text-xs text-amber-600 mt-2">
                         Para reativar, você precisa ir às configurações do seu navegador, encontrar as permissões deste site e permitir as notificações.
                     </p>
                 )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
               <Button 
                onClick={handleSubscription} 
                disabled={subState !== 'UNSUBSCRIBED' || isSubscribing}
               >
                <BellRing className="mr-2 h-4 w-4" />
                {isSubscribing ? 'Aguardando...' : 'Ativar Notificações'}
              </Button>
            </CardFooter>
        </Card>

         {installPrompt && (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Instalar Aplicativo</CardTitle>
                    <CardDescription>
                        Instale o aplicativo em seu dispositivo para um acesso mais rápido.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleInstallClick}>
                        <Download className="mr-2 h-4 w-4" />
                        Instalar Aplicativo
                    </Button>
                </CardFooter>
            </Card>
        )}

      </main>
    </div>
  );
}

    
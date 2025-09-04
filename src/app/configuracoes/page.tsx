
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
import { Terminal, BellRing, Download, ShareSquare, BellOff } from "lucide-react";
import { initializePushNotifications, isSubscribed, unsubscribeFromPush } from "@/lib/push";

type SubscriptionState = "LOADING" | "SUBSCRIBED" | "UNSUBSCRIBED" | "BLOCKED";

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
  
  const [subState, setSubState] = useState<SubscriptionState>("LOADING");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstallCard, setShowIosInstallCard] = useState(false);


  useEffect(() => {
    // Detecção de iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    const isInStandaloneMode = 'standalone' in window.navigator && (window.navigator as any).standalone;
    
    if (isIosDevice && !isInStandaloneMode) {
      setShowIosInstallCard(true);
    }
    
    // Lógica robusta para verificar o estado da subscrição
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setSubState("BLOCKED");
      return;
    }
    
    try {
      const permission = Notification.permission;
      if (permission === 'denied') {
        setSubState('BLOCKED');
      } else if (permission === 'granted') {
        // Se a permissão já foi dada, verificamos a subscrição
        isSubscribed().then(subscribed => {
          setSubState(subscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED');
        }).catch(() => {
           setSubState('BLOCKED');
        });
      } else {
        // Se a permissão for 'default', o usuário ainda não decidiu.
        setSubState('UNSUBSCRIBED');
      }
    } catch(e) {
        setSubState('BLOCKED');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };

  }, []);

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

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      await initializePushNotifications();
      toast({ title: "Sucesso!", description: "As notificações foram ativadas." });
      setSubState("SUBSCRIBED");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido";
      console.error('Erro ao ativar notificações:', err);
      toast({ 
        title: "Erro ao ativar notificações", 
        description: message,
        variant: "destructive"
      });
      // Se der erro, voltamos ao estado original com base na permissão
      if (Notification.permission === 'denied') {
        setSubState("BLOCKED");
      } else {
        setSubState("UNSUBSCRIBED");
      }
    } finally {
        setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubscribing(true);
    try {
      await unsubscribeFromPush();
      toast({ title: "Sucesso!", description: "As notificações foram desativadas." });
      setSubState("UNSUBSCRIBED");
    } catch (err: unknown) {
       const message = err instanceof Error ? err.message : "Ocorreu um erro desconhecido";
       console.error('Erro ao desativar notificações:', err);
       toast({ 
        title: "Erro ao desativar notificações", 
        description: message,
        variant: "destructive"
      });
       // Mesmo se a desativação falhar, o mais provável é que o usuário queira tentar de novo.
       // Revertemos para o estado de subscrito para que ele possa tentar novamente.
       setSubState("SUBSCRIBED");
    } finally {
        setIsSubscribing(false);
    }
  }

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
  
  const getSubscriptionButton = () => {
    if (subState === 'LOADING') {
      return <Button disabled>Verificando...</Button>
    }

    if (subState === 'BLOCKED') {
      return <Button disabled variant="destructive">Notificações Bloqueadas</Button>
    }

    if (subState === 'SUBSCRIBED') {
      return (
        <Button onClick={handleUnsubscribe} disabled={isSubscribing} variant="outline">
          <BellOff className="mr-2 h-4 w-4" />
          {isSubscribing ? 'Desativando...' : 'Desativar Notificações'}
        </Button>
      );
    }
    
    // UNSUBSCRIBED
    return (
        <Button onClick={handleSubscribe} disabled={isSubscribing}>
          <BellRing className="mr-2 h-4 w-4" />
          {isSubscribing ? 'Ativando...' : 'Ativar Notificações'}
        </Button>
    );
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
                    Receba alertas sobre novos ofícios e ofícios enviados. Se o botão estiver desativado, verifique as permissões de notificação no seu navegador.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center space-x-2">
                    {subState === 'SUBSCRIBED' ? <BellRing className="h-5 w-5 text-green-500" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                    <p className="text-sm text-muted-foreground">
                        Status atual:{" "}
                        <span className="font-semibold">
                            {subState === 'SUBSCRIBED' && "Ativadas"}
                            {subState === 'BLOCKED' && "Bloqueadas pelo navegador"}
                            {subState === 'UNSUBSCRIBED' && "Desativadas"}
                            {subState === 'LOADING' && "Verificando..."}
                        </span>
                    </p>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              {getSubscriptionButton()}
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
        
        {showIosInstallCard && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Instalar no iPhone</CardTitle>
              <CardDescription>
                Para instalar o aplicativo em seu dispositivo, siga estes passos:
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center space-y-2">
              <p className="text-sm">
                1. Toque no ícone de <strong>Compartilhar</strong> na barra de ferramentas do Safari.
              </p>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-2 h-8 w-8 text-primary"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
               <p className="text-sm">
                2. Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}

    
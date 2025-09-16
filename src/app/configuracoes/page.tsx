
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
import { Terminal, Download, Bell, BellOff, BellRing } from "lucide-react";
import { initializePushNotifications } from "@/lib/push";

const formSchema = z.object({
  prefixo: z.string().optional(),
  sufixo: z.string().optional(),
  anoBase: z.coerce.number().min(2000).max(2100),
  numeroInicial: z.coerce.number().min(1),
});

type NotificationState = "GRANTED" | "DENIED" | "DEFAULT" | "LOADING";

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [notificationState, setNotificationState] = useState<NotificationState>("LOADING");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const checkNotificationStatus = useCallback(() => {
    if ('Notification' in window) {
      setNotificationState(Notification.permission === 'granted' ? 'GRANTED' : Notification.permission === 'denied' ? 'DENIED' : 'DEFAULT');
    } else {
      setNotificationState('DENIED'); // Navegador não suporta
    }
  }, []);

  useEffect(() => {
    checkNotificationStatus();
    
    // Opcional: ouvir por mudanças de permissão, se suportado
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
        permissionStatus.onchange = checkNotificationStatus;
      });
    }
  }, [checkNotificationStatus]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };

  }, []);

  const handleSubscription = async () => {
    setIsSubscribing(true);
    try {
      const permission = await initializePushNotifications();
      if (permission === 'granted') {
        setNotificationState('GRANTED');
        toast({
          title: "Notificações Ativadas!",
          description: "Você receberá atualizações importantes.",
        });
      } else {
        setNotificationState('DENIED');
        toast({
          title: "Ativação Cancelada",
          description: "Você pode ativar as notificações a qualquer momento.",
          variant: 'destructive'
        });
      }
    } catch (err: unknown) {
      setNotificationState('DENIED');
       toast({
          title: "Erro ao Ativar Notificações",
          description: err instanceof Error ? err.message : "Ocorreu um erro desconhecido.",
          variant: "destructive",
        });
    } finally {
        setIsSubscribing(false);
    }
  };


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

  const renderNotificationCard = () => {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Receba alertas quando ofícios forem criados ou enviados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificationState === 'LOADING' && (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
          )}
          {notificationState === 'GRANTED' && (
             <div className="flex items-center text-green-600">
              <Bell className="mr-2 h-5 w-5"/>
              <p className="font-medium">As notificações estão ativadas neste navegador.</p>
            </div>
          )}
          {notificationState === 'DENIED' && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Notificações Bloqueadas</AlertTitle>
              <AlertDescription>
                Você bloqueou as notificações. Para reativá-las, você precisa alterar as permissões nas configurações do seu navegador.
              </AlertDescription>
            </Alert>
          )}
           {notificationState === 'DEFAULT' && (
             <div className="flex items-center text-muted-foreground">
              <BellOff className="mr-2 h-5 w-5"/>
              <p>As notificações não estão ativas.</p>
            </div>
          )}
        </CardContent>
        {notificationState === 'DEFAULT' && (
          <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSubscription} disabled={isSubscribing}>
                <BellRing className="mr-2 h-4 w-4" />
                {isSubscribing ? "Ativando..." : "Ativar Notificações"}
              </Button>
          </CardFooter>
        )}
      </Card>
    );
  };

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

        {renderNotificationCard()}

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

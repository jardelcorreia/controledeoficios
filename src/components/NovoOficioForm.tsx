
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { 
  criadoresList, 
  getNumeracaoConfig, 
  getProximoNumeroSequencial, 
  getNumeroFormatado 
} from "@/lib/oficios";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  assunto: z.string().min(5, "O assunto deve ter pelo menos 5 caracteres."),
  destinatario: z.string().min(3, "O destinatário é obrigatório."),
  responsavel: z.enum(criadoresList, {
    errorMap: () => ({ message: "Selecione quem está criando o ofício." }),
  }),
});

type NovoOficioFormProps = {
    proximoNumero: string;
    onOficioCreated: () => void;
    onCancel: () => void;
}

export default function NovoOficioForm({ proximoNumero, onOficioCreated, onCancel }: NovoOficioFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assunto: "",
      destinatario: "",
      responsavel: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const config = await getNumeracaoConfig();
        const numeroSequencial = await getProximoNumeroSequencial(
          config.anoBase,
          config.numeroInicial
        );
        const numeroReal = await getNumeroFormatado(
          numeroSequencial,
          config.anoBase,
          config.prefixo,
          config.sufixo
        );

        const newOficio = {
          ...values,
          numero: numeroReal,
          numeroSequencial,
          ano: config.anoBase,
          data: new Date().toISOString(),
          status: 'Aguardando Envio',
        };

        // Adiciona o ofício
        await addDoc(collection(db, 'oficios'), newOficio);

        // Adiciona ao histórico
        await addDoc(collection(db, 'historico'), {
          acao: 'Criação de Ofício',
          detalhes: `Ofício nº ${numeroReal} criado com status 'Aguardando Envio'.`,
          data: new Date().toISOString(),
        });

        toast({
          title: "Ofício Criado!",
          description: `O ofício nº ${numeroReal} foi salvo com sucesso.`,
        });
        
        onOficioCreated();
      } catch (err) {
        console.error(err);
        toast({
          title: "Erro ao criar ofício",
          description: "Não foi possível criar o ofício. Tente novamente.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="assunto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assunto</FormLabel>
              <FormControl>
                <Input placeholder="Digite o assunto do ofício" {...field} />
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
                <Input placeholder="Ex: Setor Financeiro" {...field} />
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
              <FormLabel>Criado por:</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {criadoresList.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || !proximoNumero}>
            {isPending ? "Salvando..." : "Salvar Ofício"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

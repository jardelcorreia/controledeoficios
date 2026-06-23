
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import NovoOficioForm from "@/components/NovoOficioForm";
import { getProximoNumeroOficio } from "@/lib/oficios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { FilePlus2, Loader2, AlertCircle } from "lucide-react";


type NovoOficioDialogProps = {
  triggerButton: React.ReactNode;
  proximoNumero?: string | null;
  onOficioCreated?: () => void;
};

export default function NovoOficioDialog({ triggerButton, proximoNumero: initialProximoNumero, onOficioCreated }: NovoOficioDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [proximoNumero, setProximoNumero] = useState<string | null | undefined>(initialProximoNumero);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    if (isOpen && initialProximoNumero === undefined) {
      setLoading(true);
      getProximoNumeroOficio()
        .then(setProximoNumero)
        .catch(() => setProximoNumero("Erro!"))
        .finally(() => setLoading(false));
    } else if (isOpen) {
      setProximoNumero(initialProximoNumero);
    }
  }, [isOpen, initialProximoNumero]);


  const handleOficioCreated = () => {
    setIsOpen(false);
    if (onOficioCreated) {
        onOficioCreated();
    } else {
        router.refresh();
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FilePlus2 className="size-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Novo Ofício</DialogTitle>
          </div>
          
          {loading ? (
            <div className="flex items-center gap-2 pt-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <DialogDescription className="text-sm">
              {proximoNumero && proximoNumero !== "Erro!" ? (
                <span>
                  O documento será gerado sob o número:{" "}
                  <span className="font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {proximoNumero}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="size-4" />
                  Falha ao obter numeração automática.
                </span>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[80vh]">
          <div className="p-6">
            {!loading && proximoNumero && proximoNumero !== "Erro!" ? (
              <NovoOficioForm
                proximoNumero={proximoNumero}
                onOficioCreated={handleOficioCreated}
                onCancel={handleCancel}
              />
            ) : !loading && (
              <div className="py-8 text-center space-y-3">
                <AlertCircle className="size-10 text-destructive mx-auto opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Ocorreu um erro ao carregar as configurações do sistema.<br/>
                  Por favor, verifique a aba de configurações.
                </p>
              </div>
            )}
            
            {loading && (
              <div className="space-y-6 py-2">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-11 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-11 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-11 w-full" /></div>
                <div className="flex justify-end gap-3 pt-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-32" /></div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


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
import { cn } from "@/lib/utils";

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
      <DialogContent className="w-[92vw] max-w-[450px] p-0 overflow-hidden flex flex-col gap-0 rounded-2xl sm:rounded-xl shadow-2xl border-none sm:border">
        <DialogHeader className="p-6 sm:p-7 border-b bg-muted/5">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="bg-primary/10 p-2 rounded-lg">
                <FilePlus2 className="size-5 text-primary" />
            </div>
            Novo Ofício
          </DialogTitle>
          
          <DialogDescription className="text-sm mt-2">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : proximoNumero && proximoNumero !== "Erro!" ? (
              <span className="flex items-center gap-1.5">
                Número gerado: <span className="font-bold text-foreground px-2 py-0.5 bg-primary/5 rounded border border-primary/10">{proximoNumero}</span>
              </span>
            ) : (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" /> Erro na numeração
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[80vh]">
          <div className="p-6 sm:p-7">
            {!loading && proximoNumero && proximoNumero !== "Erro!" ? (
              <NovoOficioForm
                proximoNumero={proximoNumero}
                onOficioCreated={handleOficioCreated}
                onCancel={handleCancel}
              />
            ) : !loading && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <AlertCircle className="size-10 text-destructive/30 mx-auto mb-3" />
                Erro ao carregar configurações.
              </div>
            )}
            
            {loading && (
              <div className="space-y-6">
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

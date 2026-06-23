
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
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="p-5 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FilePlus2 className="size-5 text-primary" />
            Novo Ofício
          </DialogTitle>
          
          <DialogDescription className="text-sm mt-1">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : proximoNumero && proximoNumero !== "Erro!" ? (
              <span>
                Número gerado: <span className="font-bold text-foreground">{proximoNumero}</span>
              </span>
            ) : (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" /> Erro na numeração
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[85vh]">
          <div className="p-5">
            {!loading && proximoNumero && proximoNumero !== "Erro!" ? (
              <NovoOficioForm
                proximoNumero={proximoNumero}
                onOficioCreated={handleOficioCreated}
                onCancel={handleCancel}
              />
            ) : !loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <AlertCircle className="size-8 text-destructive/50 mx-auto mb-2" />
                Erro ao carregar configurações.
              </div>
            )}
            
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

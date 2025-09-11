"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import NovoOficioForm from "@/components/NovoOficioForm";
import { getProximoNumeroOficio } from "@/lib/oficios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";


type NovoOficioDialogProps = {
  triggerButton: React.ReactNode;
  proximoNumero?: string | null;
};

export default function NovoOficioDialog({ triggerButton, proximoNumero: initialProximoNumero }: NovoOficioDialogProps) {
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
    router.refresh();
  };

  const handleCancel = () => {
    setIsOpen(false);
  }

  const DialogHeaderContent = () => (
     <>
        <DialogTitle>Criar Novo Ofício</DialogTitle>
          {loading ? (
            <div className="text-sm text-muted-foreground pt-2">
              <Skeleton className="h-5 w-48" />
            </div>
          ) : (
            <DialogDescription>
              {proximoNumero && proximoNumero !== "Erro!" ? (
                <span>
                  O número do ofício a ser criado é:{" "}
                  <span className="font-bold text-primary">
                    {proximoNumero}
                  </span>
                </span>
              ) : (
                <span className="text-destructive">
                  Não foi possível carregar o número. Verifique as
                  configurações.
                </span>
              )}
            </DialogDescription>
          )}
     </>
  )

  const FormContent = () => (
     !loading && proximoNumero && proximoNumero !== "Erro!" && (
        <NovoOficioForm
          proximoNumero={proximoNumero}
          onOficioCreated={handleOficioCreated}
          onCancel={handleCancel}
        />
      )
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>{triggerButton}</Dialog.Trigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogHeaderContent/>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-12rem)] pr-6">
            <FormContent />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

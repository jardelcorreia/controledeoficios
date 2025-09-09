// src/components/NovoOficioDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import NovoOficioForm from "@/components/NovoOficioForm";
import { getProximoNumeroOficio } from "@/lib/oficios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type NovoOficioDialogProps = {
  triggerButton: React.ReactNode;
  proximoNumero?: string | null;
};

export default function NovoOficioDialog({ triggerButton, proximoNumero: initialProximoNumero }: NovoOficioDialogProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proximoNumero, setProximoNumero] = useState<string | null | undefined>(initialProximoNumero);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // If the component is opened and there's no initial number, fetch it.
    if (isModalOpen && initialProximoNumero === undefined) {
      setLoading(true);
      getProximoNumeroOficio()
        .then(setProximoNumero)
        .catch(() => setProximoNumero("Erro!"))
        .finally(() => setLoading(false));
    } else if (isModalOpen) {
      // If a number was passed, use it.
      setProximoNumero(initialProximoNumero);
    }
  }, [isModalOpen, initialProximoNumero]);


  const handleOficioCreated = () => {
    setIsModalOpen(false);
    router.refresh(); // Refreshes server components
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Ofício</DialogTitle>
          {loading ? (
            <div className="text-sm text-muted-foreground pt-2">
              <Skeleton className="h-5 w-48" />
            </div>
          ) : (
            <DialogDescription>
              {proximoNumero && proximoNumero !== "Erro!" ? (
                <>
                  O número do ofício a ser criado é:{" "}
                  <span className="font-bold text-primary">
                    {proximoNumero}
                  </span>
                </>
              ) : (
                <span className="text-destructive">
                  Não foi possível carregar o número. Verifique as
                  configurações.
                </span>
              )}
            </DialogDescription>
          )}
        </DialogHeader>
        {!loading && proximoNumero && proximoNumero !== "Erro!" && (
          <NovoOficioForm
            proximoNumero={proximoNumero}
            onOficioCreated={handleOficioCreated}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
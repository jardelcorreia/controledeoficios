
"use client";

import { useState, useTransition, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Oficio, Status, statusList } from "@/lib/oficios";
import { db } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<Status, string> = {
  "Aguardando Envio": "bg-yellow-500 hover:bg-yellow-500/80",
  "Enviado": "bg-blue-500 hover:bg-blue-500/80",
};

interface StatusBadgeProps {
  oficio: Oficio;
  onStatusChange?: (newStatus: Status) => void;
}

export default function StatusBadge({ oficio, onStatusChange }: StatusBadgeProps) {
  const [currentStatus, setCurrentStatus] = useState<Status>(oficio.status);
  const [isStatusPending, startStatusTransition] = useTransition();
  const { toast } = useToast();

  // Mantém o estado local sincronizado com a prop (útil para listeners em tempo real)
  useEffect(() => {
    setCurrentStatus(oficio.status);
  }, [oficio.status]);

  const handleStatusChange = (newStatus: Status) => {
    if (currentStatus === newStatus) return;

    startStatusTransition(async () => {
      try {
        const docRef = doc(db, "oficios", oficio.id);
        await updateDoc(docRef, { status: newStatus });
        
        await addDoc(collection(db, 'historico'), {
          acao: 'Alteração de Status',
          detalhes: `Status do ofício nº ${oficio.numero} alterado para '${newStatus}'.`,
          data: new Date().toISOString(),
        });

        setCurrentStatus(newStatus);
        
        if (onStatusChange) {
            onStatusChange(newStatus);
        }

        toast({
          title: newStatus === "Enviado" ? "Ofício Enviado!" : "Status Atualizado!",
          description: `O ofício nº ${oficio.numero} foi marcado como ${newStatus.toLowerCase()}.`,
        });
      } catch (err) {
        console.error(err);
        toast({
          title: "Erro ao alterar status",
          description: "Não foi possível alterar o status. Tente novamente.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Badge
                className={cn(
                "flex cursor-pointer items-center gap-1 text-white transition-colors duration-200",
                statusColors[currentStatus]
                )}
            >
                {isStatusPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span className="whitespace-nowrap">{currentStatus}</span>
                <ChevronDown className="h-4 w-4 shrink-0" />
            </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
            {statusList.map((status) => (
                <DropdownMenuItem
                key={status}
                onSelect={() => handleStatusChange(status)}
                disabled={currentStatus === status || isStatusPending}
                >
                {currentStatus === status && (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                )}
                {status}
                </DropdownMenuItem>
            ))}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}


"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Oficio, Status, statusList } from "@/lib/oficios";
import { updateOficio } from "@/lib/oficios.actions";
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

  const handleStatusChange = (newStatus: Status) => {
    if (currentStatus === newStatus) return;

    startStatusTransition(async () => {
      try {
        await updateOficio(oficio.id, { status: newStatus });
        setCurrentStatus(newStatus);
        
        if (onStatusChange) {
            onStatusChange(newStatus);
        }

        if (newStatus === "Enviado") {
          toast({
            title: "Ofício Enviado!",
            description: `O ofício nº ${oficio.numero} foi marcado como enviado.`,
          });
        } else {
          toast({
            title: "Status Atualizado!",
            description: `O status do ofício foi alterado para "${newStatus}".`,
          });
        }
      } catch (err) {
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
              "group flex cursor-pointer items-center text-white transition-all duration-200",
              statusColors[currentStatus]
            )}
          >
            {isStatusPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : null}
            <span className="whitespace-nowrap">{currentStatus}</span>
            <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
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

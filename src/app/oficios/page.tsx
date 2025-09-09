import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { getOficios } from "@/lib/oficios";
import { PlusCircle } from "lucide-react";
import OficiosClient from "@/components/OficiosClient";

export default async function OficiosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const oficios = await getOficios();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Gerenciamento de Ofícios"
        description="Crie, edite e visualize os ofícios enviados."
      >
        {/* O botão de novo ofício agora está dentro do OficiosClient para ter acesso ao modal */}
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6">
        <OficiosClient allOficios={oficios} />
      </main>
    </div>
  );
}

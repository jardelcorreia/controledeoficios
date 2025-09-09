import PageHeader from "@/components/PageHeader";
import { getOficios } from "@/lib/oficios";
import OficiosClient, { OficiosClientSkeleton } from "@/components/OficiosClient";
import { Suspense } from "react";

export default async function OficiosPage() {
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
        <Suspense fallback={<OficiosClientSkeleton />}>
          <OficiosClient allOficios={oficios} />
        </Suspense>
      </main>
    </div>
  );
}

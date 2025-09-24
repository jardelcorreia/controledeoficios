import PageHeader from "@/components/PageHeader";
import OficiosClient, { OficiosClientSkeleton } from "@/components/OficiosClient";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function OficiosPage() {
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
          <OficiosClient />
        </Suspense>
      </main>
    </div>
  );
}

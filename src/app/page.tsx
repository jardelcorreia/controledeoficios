
import PageHeader from "@/components/PageHeader";
import DashboardClient from "@/components/DashboardClient";

// Força o Next.js a não colocar esta página em cache estático, 
// resolvendo o problema de exibir dados antigos (como o "Ofício 20") no refresh.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de controle de ofícios."
      />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <DashboardClient />
      </main>
    </div>
  );
}

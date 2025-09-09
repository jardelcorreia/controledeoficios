
"use client";

import {
  FileText,
  History,
  LayoutDashboard,
  NotebookPen,
  Settings,
  Github,
  Linkedin,
  Instagram,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";

const AppSidebar = () => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/oficios", label: "Ofícios", icon: FileText },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <NotebookPen className="size-6 text-sidebar-primary" />
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            Controle de Ofícios
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                tooltip={{ children: item.label }}
                onClick={() => setOpenMobile(false)}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <div className="text-center text-xs text-sidebar-foreground/60 space-y-2">
           <div className="flex justify-center items-center gap-4">
               <a href="https://www.linkedin.com/in/jardel-correia-1b967916b" target="_blank" rel="noopener noreferrer" className="hover:text-sidebar-foreground transition-colors">
                    <Linkedin size={18} />
               </a>
                <a href="https://github.com/jardelcorreia" target="_blank" rel="noopener noreferrer" className="hover:text-sidebar-foreground transition-colors">
                    <Github size={18} />
                </a>
                 <a href="https://instagram.com/jardelcorreia" target="_blank" rel="noopener noreferrer" className="hover:text-sidebar-foreground transition-colors">
                    <Instagram size={18} />
                </a>
           </div>
          <p>
            Desenvolvido por Jardel Correia
          </p>
          <p>
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;

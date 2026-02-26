import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/app/_components/AppSidebar";
import TopHeader from "@/app/_components/TopHeader";

export default function DashboardLayout({ children }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1">
                <div className="flex items-center gap-4 p-4 border-b border-border/50">
                    <SidebarTrigger />
                    <TopHeader />
                </div>
                {children}
            </main>
        </SidebarProvider>
    );
}

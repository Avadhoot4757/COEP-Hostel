import "../globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hostel Allocation System",
  description: "Find roommates and select hostel rooms",
};

const managementItems = [
  {
    title: "Dashboard",
    url: "/student",
  },
  {
    title: "Students Directory",
    url: "/student/students-directory",
  },
  {
    title: "Invites",
    url: "/student/invites",
  },
  {
    title: "Room Preferences",
    url: "/student/room-preferences",
  },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <DynamicBreadcrumb managementItems={managementItems} />
              </div>
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider>
  );
}

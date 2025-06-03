import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/adminrole/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hostel Manager Dashboard",
  description: "Comprehensive hostel allotment management system",
}

export const managementItems = [
  {
    title: "Dashboard",
    url: "/managerHome",
  },
  {
    title: "Open Registrations",
    url: "/managerHome/open-registrations",
  },
  {
    title: "Seat Matrix",
    url: "/managerHome/seat-matrix",
  },
  {
    title: "Verify Students",
    url: "/managerHome/verify-students",
  },
  {
    title: "Select Students",
    url: "/managerHome/select-students",
  },
  {
    title: "Room Preference Period",
    url: "/managerHome/room-preference-period",
  },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
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

  )
}

"use client"

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Home, Bed, UserCheck, LogOut, Users, Calendar, Building2, FilePlus2} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"


const managementItems = [
  {
    title: "Dashboard",
    url: "/manager",
    icon: Home,
  },
  {
    title: "Insert Students Data",
    url: "/manager/insert-students-data",
    icon: FilePlus2,
  },
  {
    title: "Hostel Blocks",
    url: "/manager/blocks",
    icon: Building2,
  },
  {
    title: "Open Registrations",
    url: "/manager/open-registrations",
    icon: Users,
  },
  {
    title: "Seat Matrix",
    url: "/manager/seat-matrix",
    icon: Bed,
  },
  {
    title: "Verify Students",
    url: "/manager/verify-students",
    icon: UserCheck,
  },
  {
    title: "Select Students",
    url: "/manager/select-students",
    icon: Users,
  },
  {
    title: "Room Preference Period",
    url: "/manager/room-preference-period",
    icon: Calendar,
  },
];



export function AppSidebar() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/manager">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Home className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Hostel Manager</span>
                  <span className="truncate text-xs">Allotment System</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} data-title={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

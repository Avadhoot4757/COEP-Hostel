import type React from "react"
import "../globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SuperAdminNavbar } from "@/components/adminrole/superadminnav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hostel Allocation System - Super Admin",
  description: "Manage hostel allocation process and settings",
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (

        <div className="min-h-screen flex flex-col">
          <SuperAdminNavbar />
          <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
        </div>
  )
}

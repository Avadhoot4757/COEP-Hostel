import "../../globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ManagerNavbar } from "@/components/adminrole/managernav"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hostel Allocation System - Manager",
  description: "Manage hostel allocation process and settings for managers",
}

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <body className={inter.className}>
      <div className="min-h-screen flex flex-col">
        <ManagerNavbar />
        <main className="flex-1 p-4 sm:p-6 w-full">{children}</main>
        <Toaster />
      </div>
    </body>
  )
}

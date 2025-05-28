import type React from "react"
import Link from "next/link"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/AuthContext"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Hostel Allocation System</h1>
          <nav className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center text-gray-700 hover:text-gray-900">
              <span>Dashboard</span>
            </Link>
            <Link href="/manager" className="flex items-center text-gray-700 hover:text-gray-900">
              <span>Students</span>
            </Link>
            <Link href="/wardens" className="flex items-center text-gray-700 hover:text-gray-900">
              <span>Wardens</span>
            </Link>
            <Link href="/bvc" className="flex items-center text-gray-700 hover:text-gray-900">
              <span>BVC</span>
            </Link>
            <Link onClick={() => logout()} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              Logout
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
      <Toaster />
    </div>
  )
}

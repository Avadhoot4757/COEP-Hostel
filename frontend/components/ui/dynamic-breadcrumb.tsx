"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface ManagementItem {
  title: string
  url: string
}

interface DynamicBreadcrumbProps {
  managementItems: ManagementItem[]
}

export function DynamicBreadcrumb({ managementItems }: DynamicBreadcrumbProps) {
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState("Dashboard")

  useEffect(() => {
    const currentItem = managementItems.find(item => item.url === pathname)
    setPageTitle(currentItem?.title || "Dashboard")
  }, [pathname, managementItems])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/manager">Hostel Management</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

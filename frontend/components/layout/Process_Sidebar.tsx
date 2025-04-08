"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Mail, Home, Settings, LogOut } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Invites", href: "/invites", icon: Mail },
  { name: "Rooms", href: "/rooms", icon: Home },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r h-screen flex flex-col">
      <div className="flex-1 py-6 flex flex-col gap-0.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-sm font-medium",
                pathname === item.href
                  ? "bg-secondary"
                  : "hover:bg-secondary/50 transition-colors"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t">
        <button className="flex items-center gap-3 text-sm font-medium text-destructive">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
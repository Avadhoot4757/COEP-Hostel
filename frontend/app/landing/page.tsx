"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Mail, Home } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            Welcome to the Hostel Allocation
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Find roommates, form groups, and select your preferred hostel rooms.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" asChild>
              <Link href="/students">Browse Students</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 flex flex-col">
            <div className="mb-4">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Find Roommates</h2>
            <p className="text-sm text-muted-foreground mb-4 flex-grow">
              Browse through students and find compatible roommates. View profiles of other students, filter by branch, and search by name to find the perfect roommates for your hostel stay.
            </p>
            <Button className="w-full mt-auto" variant="outline" asChild>
              <Link href="/students">Browse Students →</Link>
            </Button>
          </Card>

          <Card className="p-4 sm:p-6 flex flex-col">
            <div className="mb-4">
              <Mail className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Manage Invites</h2>
            <p className="text-sm text-muted-foreground mb-4 flex-grow">
              Send, accept, or reject roommate invitations. Create a group of up to 4 students by sending and managing invites. View your current roommates and group status.
            </p>
            <Button className="w-full mt-auto" variant="outline" asChild>
              <Link href="/invites">View Invites →</Link>
            </Button>
          </Card>

          <Card className="p-4 sm:p-6 flex flex-col sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Home className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Select Rooms</h2>
            <p className="text-sm text-muted-foreground mb-4 flex-grow">
              Choose your preferred rooms once your group is formed. After forming a complete group of 4, browse through available rooms and set your preferences in order of priority.
            </p>
            <Button className="w-full mt-auto" variant="outline" asChild>
              <Link href="/rooms">View Rooms →</Link>
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
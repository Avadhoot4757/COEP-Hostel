"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Mail, Home } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <main className="flex-1 max-w-4xl mx-auto w-full py-16 px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Welcome to the Hostel Allocation System</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find roommates, form groups, and select your preferred hostel rooms.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/students">Browse Students</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6">
            <div className="mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Find Roommates</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Browse through students and find compatible roommates.
            </p>
            <p className="text-sm text-muted-foreground">
              View profiles of other students, filter by branch, and search by name to find the perfect roommates for your hostel stay.
            </p>
            <Button className="w-full mt-4" variant="outline" asChild>
              <Link href="/students">Browse Students →</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Manage Invites</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Send, accept, or reject roommate invitations.
            </p>
            <p className="text-sm text-muted-foreground">
              Create a group of up to 4 students by sending and managing invites. View your current roommates and group status.
            </p>
            <Button className="w-full mt-4" variant="outline" asChild>
              <Link href="/invites">View Invites →</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Select Rooms</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your preferred rooms once your group is formed.
            </p>
            <p className="text-sm text-muted-foreground">
              After forming a complete group of 4, browse through available rooms and set your preferences in order of priority.
            </p>
            <Button className="w-full mt-4" variant="outline" asChild>
              <Link href="/rooms">View Rooms →</Link>
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}

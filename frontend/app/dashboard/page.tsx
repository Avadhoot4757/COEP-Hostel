"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, Users, Bell, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h2 className="font-semibold">Room Selection Opens Soon</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Room selection for the upcoming semester will open on April 15, 2025. Make sure your group is complete before then.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold">Roommate Status</h3>
          </div>
          <div className="text-2xl font-bold mb-2">2/4</div>
          <Progress value={50} className="mb-2" />
          <p className="text-sm text-muted-foreground">You need 2 more roommates</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5" />
            <h3 className="font-semibold">Pending Invites</h3>
          </div>
          <div className="text-2xl font-bold mb-4">3</div>
          <Button asChild size="sm">
            <Link href="/invites">View Invites</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5" />
            <h3 className="font-semibold">Room Preferences</h3>
          </div>
          <div className="text-2xl font-bold mb-4">0/5</div>
          <Button asChild size="sm">
            <Link href="/rooms">Set Preferences</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Time Remaining</h3>
          </div>
          <div className="text-2xl font-bold mb-2">14 days</div>
          <p className="text-sm text-muted-foreground">Until room selection begins</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Roommates (2/4)</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  RK
                </div>
                <div>
                  <div className="font-medium">Rahul Kumar</div>
                  <div className="text-sm text-muted-foreground">Computer Science</div>
                </div>
              </div>
              <div className="text-xs bg-primary/10 px-2 py-1 rounded">You</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  AP
                </div>
                <div>
                  <div className="font-medium">Amit Patel</div>
                  <div className="text-sm text-muted-foreground">Computer Science</div>
                </div>
              </div>
              <Button variant="destructive" size="sm">Remove</Button>
            </div>
          </div>

          <Button className="w-full mt-4" asChild>
            <Link href="/students">Invite More Students</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
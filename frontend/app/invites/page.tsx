"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X } from "lucide-react";

const receivedInvites = [
  {
    id: "VS",
    name: "Vikram Singh",
    details: "Mechanical Engineering, 2nd Year",
  },
  {
    id: "NG",
    name: "Neha Gupta",
    details: "Electrical Engineering, 3rd Year",
  },
  {
    id: "RJ",
    name: "Raj Joshi",
    details: "Computer Science, 3rd Year",
  },
];

export default function InvitesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Roommate Invites</h1>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="received">Received Invites</TabsTrigger>
          <TabsTrigger value="sent">Sent Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <div className="space-y-4">
            {receivedInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {invite.id}
                  </div>
                  <div>
                    <div className="font-medium">{invite.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {invite.details}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm">
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="text-center text-muted-foreground py-8">
            No sent invites
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
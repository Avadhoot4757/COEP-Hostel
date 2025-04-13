"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Invite {
  id: number;
  sender: string;
  receiver: string;
  status: string;
  timestamp: string;
}

interface InvitesResponse {
  sent_invites: Invite[];
  received_invites: Invite[];
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<InvitesResponse>({
    sent_invites: [],
    received_invites: [],
  });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/?auth=login"); // Changed from /login
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        setLoading(true);
        const response = await api.get("/allot/invites/");
        setInvites({
          sent_invites: response.data.sent_invites || [],
          received_invites: response.data.received_invites || [],
        });
      } catch (error) {
        console.error("Error fetching invites:", error);
        setInvites({ sent_invites: [], received_invites: [] });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchInvites();
    }
  }, [isAuthenticated]);

  const parseMember = (member: string) => {
    const nameMatch = member.match(/^(.*?)\s*\(/);
    const name = nameMatch ? nameMatch[1].trim() : member;
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return { name, initials };
  };

  const handleAccept = async (inviteId: number) => {
    try {
      await api.post("/allot/invites/", { invite_id: inviteId, action: "accept" });
      alert("Invite accepted successfully");
      const response = await api.get("/allot/invites/");
      setInvites({
        sent_invites: response.data.sent_invites || [],
        received_invites: response.data.received_invites || [],
      });
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      alert(error.response?.data?.error || "Failed to accept invite");
    }
  };

  const handleReject = async (inviteId: number) => {
    try {
      await api.post("/allot/invites/", { invite_id: inviteId, action: "reject" });
      alert("Invite rejected successfully");
      const response = await api.get("/allot/invites/");
      setInvites({
        sent_invites: response.data.sent_invites || [],
        received_invites: response.data.received_invites || [],
      });
    } catch (error: any) {
      console.error("Error rejecting invite:", error);
      alert(error.response?.data?.error || "Failed to reject invite");
    }
  };

  const handleCancel = async (inviteId: number) => {
    try {
      await api.post("/allot/invites/", { invite_id: inviteId, action: "cancel" });
      alert("Invite cancelled successfully");
      const response = await api.get("/allot/invites/");
      setInvites({
        sent_invites: response.data.sent_invites || [],
        received_invites: response.data.received_invites || [],
      });
    } catch (error: any) {
      console.error("Error cancelling invite:", error);
      alert(error.response?.data?.error || "Failed to cancel invite");
    }
  };

  if (authLoading || loading) {
    return <div>Loading...</div>;
  }

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
            {invites.received_invites.length > 0 ? (
              invites.received_invites.map((invite) => {
                const { name, initials } = parseMember(invite.sender);
                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-muted-foreground">
                          Computer Science, 2nd Year
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Rejecting this invite will decline the request to
                              join your room group.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleReject(invite.id)}
                            >
                              Reject
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm">
                            <Check className="h-4 w-4 mr-1" /> Accept
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Accepting this invite will add {name} to your room
                              group. All other invites you received will be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleAccept(invite.id)}
                            >
                              Accept
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No received invites
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="sent">
          <div className="space-y-4">
            {invites.sent_invites.length > 0 ? (
              invites.sent_invites.map((invite) => {
                const { name, initials } = parseMember(invite.receiver);
                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-muted-foreground">
                          Computer Science, 2nd Year
                          {invite.status === "pending" && " (Pending)"}
                          {invite.status === "accepted" && " (Accepted)"}
                          {invite.status === "rejected" && " (Rejected)"}
                        </div>
                      </div>
                    </div>
                    {invite.status === "pending" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <X className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cancelling this invite will remove your request to
                              add {name} to your room group.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(invite.id)}
                            >
                              Confirm Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No sent invites
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

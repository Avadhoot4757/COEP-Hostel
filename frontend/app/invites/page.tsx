"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Loader2 } from "lucide-react";
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
  sender_first_name: string;
  sender_last_name: string | null;
  sender_branch: string;
  receiver: string;
  receiver_first_name: string;
  receiver_last_name: string | null;
  receiver_branch: string;
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
  const { isAuthenticated, loading: authLoading, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const isValid = await checkAuth();
      if (!isValid) {
        router.push("/?auth=login");
      }
    };

    if (!authLoading && !isAuthenticated) {
      verifyAuth();
    } else if (isAuthenticated) {
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

      fetchInvites();
    }
  }, [authLoading, isAuthenticated, checkAuth, router]);

  const getMemberDisplay = (first_name: string, last_name: string | null) => {
    const fullName = [first_name, last_name].filter(Boolean).join(" ");
    const initials = fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return { fullName, initials };
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading invites...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
                const { fullName, initials } = getMemberDisplay(
                  invite.sender_first_name,
                  invite.sender_last_name
                );
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
                        <div className="font-medium">{fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {invite.sender.split("(")[0].trim()}, {invite.sender_branch}
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
                              Accepting this invite will add {fullName} to your room
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
                const { fullName, initials } = getMemberDisplay(
                  invite.receiver_first_name,
                  invite.receiver_last_name
                );
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
                        <div className="font-medium">{fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {invite.receiver.split("(")[0].trim()}, {invite.receiver_branch}
                        </div>
                      </div>
                    </div>
                    {(
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
                              add {fullName} to your room group.
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

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, Users, Bell, Home } from "lucide-react";
import Link from "next/link";
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

interface RoomStatus {
  id: number;
  name: string;
  members: string[];
}

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

export default function DashboardPage() {
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [invites, setInvites] = useState<InvitesResponse>({
    sent_invites: [],
    received_invites: [],
  });
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/?auth=login"); // Changed from /login
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchRoomStatus = async () => {
      try {
        setLoadingRoom(true);
        const response = await api.get("/allot/room-status/");
        setRoomStatus(response.data[0] || null);
      } catch (error) {
        console.error("Error fetching room status:", error);
        setRoomStatus(null);
      } finally {
        setLoadingRoom(false);
      }
    };

    const fetchInvites = async () => {
      try {
        setLoadingInvites(true);
        const response = await api.get("/allot/invites/");
        setInvites({
          sent_invites: response.data.sent_invites || [],
          received_invites: response.data.received_invites || [],
        });
      } catch (error) {
        console.error("Error fetching invites:", error);
        setInvites({ sent_invites: [], received_invites: [] });
      } finally {
        setLoadingInvites(false);
      }
    };

    if (isAuthenticated) {
      fetchRoomStatus();
      fetchInvites();
    }
  }, [isAuthenticated]);

  const maxRoommates = 4;
  const currentRoommates = roomStatus?.members.length || 0;
  const roommatesNeeded = maxRoommates - currentRoommates;
  const pendingReceivedInvitesCount = invites.received_invites.filter(
    (invite) => invite.status === "pending"
  ).length;
  const pendingSentInvitesCount = invites.sent_invites.filter(
    (invite) => invite.status === "pending"
  ).length;

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

  const handleLeaveRoom = async () => {
    try {
      await api.post("/allot/room-status/", {});
      setRoomStatus(null);
      alert("Successfully left the room group");
    } catch (error: any) {
      console.error("Error leaving room group:", error);
      alert(error.response?.data?.error || "Failed to leave room group");
    }
  };

  if (authLoading || loadingRoom || loadingInvites) {
    return <div>Loading...</div>;
  }

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
            Room selection for the upcoming semester will open on April 15, 2025.
            Make sure your group is complete before then.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold">Roommate Status</h3>
          </div>
          <div className="text-2xl font-bold mb-2">
            {currentRoommates}/{maxRoommates}
          </div>
          <Progress
            value={(currentRoommates / maxRoommates) * 100}
            className="mb-2"
          />
          <p className="text-sm text-muted-foreground">
            {roommatesNeeded > 0
              ? `You need ${roommatesNeeded} more roommate${roommatesNeeded > 1 ? "s" : ""}`
              : "Your room is full"}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5" />
            <h3 className="font-semibold">Pending Invites</h3>
          </div>
          <div className="mb-4">
            <div className="text-2xl font-bold">
              Received: {pendingReceivedInvitesCount}
            </div>
            <div className="text-2xl font-bold">
              Sent: {pendingSentInvitesCount}
            </div>
          </div>
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
          <p className="text-sm text-muted-foreground">
            Until room selection begins
          </p>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              Your Roommates ({currentRoommates}/{maxRoommates})
            </h3>
            {roomStatus && currentRoommates > 1 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Leave Room
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Leaving the room group will remove you from the current
                      group. You’ll need to join or create a new group to
                      continue.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeaveRoom}>
                      Leave
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="space-y-4">
            {roomStatus && roomStatus.members.length > 0 ? (
              roomStatus.members.map((member, index) => {
                const { name, initials } = parseMember(member);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-muted-foreground">
                          Computer Science
                        </div>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="text-xs bg-primary/10 px-2 py-1 rounded">
                        You
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No roommates assigned yet.
              </p>
            )}
          </div>
          {currentRoommates < maxRoommates && (
            <Button className="w-full mt-4" asChild>
              <Link href="/students">Invite More Students</Link>
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}

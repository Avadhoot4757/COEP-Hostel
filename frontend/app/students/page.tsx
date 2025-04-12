"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api"; // Import the Axios utility
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X } from "lucide-react";
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

interface Student {
  mis: string;
  name: string;
  branch: string | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all-branches");
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/?auth=login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get("/allot/student-available/");
        setStudents(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  const handleInvite = async (receiverId: number) => {
    try {
      const response = await api.post("/allot/student-available/", { receiver_id: receiverId });
      alert(response.data.message);
      // Refresh students list
      const updatedResponse = await api.get("/allot/student-available/");
      setStudents(updatedResponse.data);
    } catch (error: any) {
      console.error("Error sending invite:", error);
      alert(error.response?.data?.error || "Failed to send invite");
    }
  };

  // const handleAction = async (receiverId: number, action: "accept" | "reject") => {
  //   try {
  //     // Note: Backend endpoint for accept/reject not provided; assuming a placeholder
  //     const response = await api.post(`/allot/invite-action/`, {
  //       receiver_id: receiverId,
  //       action,
  //     });
  //     alert(response.data.message);
  //     // Refresh students list
  //     const updatedResponse = await api.get("/allot/student-available/");
  //     setStudents(updatedResponse.data);
  //   } catch (error: any) {
  //     console.error(`Error ${action}ing invite:`, error);
  //     alert(error.response?.data?.error || `Failed to ${action} invite`);
  //   }
  // };

  // const handleRemoveRoommate = async (receiverId: number) => {
  //   try {
  //     // Note: Backend endpoint for removing roommate not provided; assuming a placeholder
  //     const response = await api.post(`/allot/remove-roommate/`, {
  //       receiver_id: receiverId,
  //     });
  //     alert(response.data.message);
  //     // Refresh students list
  //     const updatedResponse = await api.get("/allot/student-available/");
  //     setStudents(updatedResponse.data);
  //   } catch (error: any) {
  //     console.error("Error removing roommate:", error);
  //     alert(error.response?.data?.error || "Failed to remove roommate");
  //   }
  // };

  // Filter students based on search and branch
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.username.toLowerCase().includes(search.toLowerCase());
    const matchesBranch =
      branchFilter === "all-branches" ||
      (branchFilter === "cs" && student.branch === "Computer Science") ||
      (branchFilter === "me" && student.branch === "Mechanical Engineering") ||
      (branchFilter === "ee" && student.branch === "Electrical Engineering") ||
      (branchFilter === "ce" && student.branch === "Civil Engineering");
    return matchesSearch && matchesBranch;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Students Directory</h1>

      <div className="flex gap-4 mb-8">
        <Input
          placeholder="Search by name..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-branches">All Branches</SelectItem>
            <SelectItem value="cs">Computer Science</SelectItem>
            <SelectItem value="me">Mechanical Engineering</SelectItem>
            <SelectItem value="ee">Electrical Engineering</SelectItem>
            <SelectItem value="ce">Civil Engineering</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">MIS</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Branch</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b last:border-0">
                <td className="p-4">{student.username}</td>
                <td className="p-4">{student.username}</td>
                <td className="p-4">{student.branch || "N/A"}</td>
                <td className="p-4 text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm">Invite</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sending this invite will request {student.username} to join your room group.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleInvite(student.id)}>
                          Confirm Invite
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";

interface Student {
  id: number;
  username: string;
  first_name: string;
  last_name: string | null;
  branch: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all-branches");
  const [loading, setLoading] = useState(true); // Added loading state
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
      const fetchStudents = async () => {
        try {
          setLoading(true);
          const response = await api.get("/allot/student-available/");
          setStudents(response.data);
        } catch (error) {
          console.error("Error fetching students:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchStudents();
    }
  }, [authLoading, isAuthenticated, checkAuth, router]);

  const handleInvite = async (receiverId: number) => {
    try {
      const response = await api.post("/allot/student-available/", {
        receiver_id: receiverId,
      });
      // alert(response.data.message);
      const updatedResponse = await api.get("/allot/student-available/");
      setStudents(updatedResponse.data);
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send invite",
        variant: "destructive",
        duration: 3000,
      })
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = [student.first_name, student.last_name]
      .filter(Boolean)
      .join(" ");
    const matchesSearch =
      student.username.toLowerCase().includes(search.toLowerCase()) ||
      fullName.toLowerCase().includes(search.toLowerCase());
    const matchesBranch =
      branchFilter === "all-branches" ||
      (branchFilter === "cs" && student.branch === "Computer Science") ||
      (branchFilter === "me" && student.branch === "Mechanical Engineering") ||
      (branchFilter === "ee" && student.branch === "Electrical Engineering") ||
      (branchFilter === "ce" && student.branch === "Civil Engineering");
    return matchesSearch && matchesBranch;
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading student directory...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Students Directory</h1>

      <div className="flex gap-4 mb-8">
        <Input
          placeholder="Search by name or MIS..."
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
                <td className="p-4">
                  {[student.first_name, student.last_name]
                    .filter(Boolean)
                    .join(" ")}
                </td>
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
                          Sending this invite will request {student.first_name}{" "}
                          {student.last_name || ""} to join your room group.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleInvite(student.id)}
                        >
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

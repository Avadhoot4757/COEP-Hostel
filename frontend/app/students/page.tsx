"use client";

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

const students = [
  { name: "Amit Patel", branch: "Computer Science", year: "3rd", status: "Roommate" },
  { name: "Vikram Singh", branch: "Mechanical Engineering", year: "2nd", status: "Pending" },
  { name: "Neha Gupta", branch: "Electrical Engineering", year: "3rd", status: "Pending" },
  { name: "Raj Joshi", branch: "Computer Science", year: "3rd", status: "Pending" },
  { name: "Priya Sharma", branch: "Civil Engineering", year: "2nd", status: "Not Connected" },
  { name: "Karan Malhotra", branch: "Computer Science", year: "3rd", status: "Not Connected" },
  { name: "Ananya Desai", branch: "Electronics Engineering", year: "3rd", status: "Not Connected" },
  { name: "Rohan Kapoor", branch: "Mechanical Engineering", year: "2nd", status: "Not Connected" },
  { name: "Divya Reddy", branch: "Computer Science", year: "3rd", status: "Not Connected" },
  { name: "Arjun Nair", branch: "Civil Engineering", year: "3rd", status: "Not Connected" },
];

export default function StudentsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Students Directory</h1>

      <div className="flex gap-4 mb-8">
        <Input placeholder="Search by name..." className="max-w-sm" />
        <Select defaultValue="all-branches">
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
        <Select defaultValue="all-years">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-years">All Years</SelectItem>
            <SelectItem value="1">1st Year</SelectItem>
            <SelectItem value="2">2nd Year</SelectItem>
            <SelectItem value="3">3rd Year</SelectItem>
            <SelectItem value="4">4th Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Branch</th>
              <th className="text-left p-4">Year</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.name} className="border-b last:border-0">
                <td className="p-4">{student.name}</td>
                <td className="p-4">{student.branch}</td>
                <td className="p-4">{student.year}</td>
                <td className="p-4">
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm ${
                      student.status === "Roommate"
                        ? "bg-green-100 text-green-800"
                        : student.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {student.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {student.status === "Roommate" ? (
                    <Button variant="destructive" size="sm">Remove</Button>
                  ) : student.status === "Pending" ? (
                    <div className="flex gap-2 justify-end">
                      <Button size="icon" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm">Invite</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
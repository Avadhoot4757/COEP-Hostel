"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { fetchStudentsByYear } from "@/lib/api-utils"

interface Student {
  roll_no: string
  first_name: string
  middle_name?: string
  last_name?: string
  class_name: string
  branch: {
    name: string
  }
  verified: boolean | null
  caste: {
    name: string
  }
  admission_category: {
    name: string
  }
}

export default function ManagerPage() {
  const [selectedYear, setSelectedYear] = useState<string>("fy")
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>("pending")
  const router = useRouter()
  const { toast } = useToast()

  const yearOptions = [
    { value: "fy", label: "First Year" },
    { value: "sy", label: "Second Year" },
    { value: "ty", label: "Third Year" },
    { value: "btech", label: "Final Year" },
  ]

  useEffect(() => {
    loadStudents()
  }, [selectedYear, activeTab])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const status = activeTab as "pending" | "verified" | "rejected"
      const data = await fetchStudentsByYear(selectedYear, status)
      setStudents(data)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load student data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
  }

  const handleViewStudent = (rollNo: string) => {
    router.push(`/manager/student/${rollNo}`)
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) {
      return <Badge className="bg-yellow-500">Pending</Badge>
    } else if (status === true) {
      return <Badge className="bg-green-500">Verified</Badge>
    } else {
      return <Badge className="bg-red-500">Rejected</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Manager Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Academic Year 2024-25</span>
          <Badge className="bg-green-500">Active</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Verification</CardTitle>
          <CardDescription>View and verify student applications by year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-64">
                <label className="text-sm font-medium mb-1 block">Select Year</label>
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <p className="text-sm text-blue-600 flex items-center">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Currently viewing: {yearOptions.find((y) => y.value === selectedYear)?.label}
                </p>
              </div>
            </div>

            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="text-center py-8">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No {activeTab} students found for {yearOptions.find((y) => y.value === selectedYear)?.label}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.roll_no}>
                          <TableCell className="font-medium">{student.roll_no}</TableCell>
                          <TableCell>
                            {student.first_name} {student.middle_name || ""} {student.last_name || ""}
                          </TableCell>
                          <TableCell>{student.branch.name}</TableCell>
                          <TableCell>
                            {student.admission_category.name} ({student.caste.name})
                          </TableCell>
                          <TableCell>{getStatusBadge(student.verified)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" onClick={() => handleViewStudent(student.roll_no)}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
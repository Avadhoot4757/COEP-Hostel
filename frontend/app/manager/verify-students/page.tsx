"use client"

import { useState, useEffect, useMemo } from "react"
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
    branch: string
  }
  verified: boolean | null
  caste: {
    name: string
  }
  admission_category: {
    admission_category: string
  }
  gender: string
}

export default function ManagerPage() {
  const [selectedYear, setSelectedYear] = useState<string>("fy")
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>("pending")
  const [selectedGender, setSelectedGender] = useState<string>("all")
  const router = useRouter()
  const { toast } = useToast()

  const yearOptions = [
    { value: "fy", label: "First Year" },
    { value: "sy", label: "Second Year" },
    { value: "ty", label: "Third Year" },
    { value: "btech", label: "Final Year" },
  ]

  const genderOptions = [
    { value: "all", label: "All Genders" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ]

  // Load students only when year changes (single API call)
  useEffect(() => {
    loadStudents()
  }, [selectedYear])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const data = await fetchStudentsByYear(selectedYear);
      setAllStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to load student data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false)
    }
  }

  // Frontend filtering - applied instantly without API calls
  const filteredStudents = useMemo(() => {
    let filtered = [...allStudents]

    // Filter by verification status
    switch (activeTab) {
      case "pending":
        filtered = filtered.filter(student => student.verified === null)
        break
      case "verified":
        filtered = filtered.filter(student => student.verified === true)
        break
      case "rejected":
        filtered = filtered.filter(student => student.verified === false)
        break
    }
    
    if (selectedGender !== "all") {
      filtered = filtered.filter(student => student.gender === selectedGender);
    }

    return filtered
  }, [allStudents, activeTab, selectedGender])

  // Calculate status counts for tab badges
  const statusCounts = useMemo(() => {
    const genderFiltered = selectedGender === "all" 
      ? allStudents 
      : allStudents.filter(s => s.gender?.toLowerCase() === selectedGender.toLowerCase())

    return {
      pending: genderFiltered.filter(s => s.verified === null).length,
      verified: genderFiltered.filter(s => s.verified === true).length,
      rejected: genderFiltered.filter(s => s.verified === false).length,
      total: genderFiltered.length
    }
  }, [allStudents, selectedGender])

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    // Reset filters when changing year
    setActiveTab("pending")
    setSelectedGender("all")
  }

  const handleViewStudent = (rollNo: string) => {
    router.push(`/manager/student/${rollNo}`)
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) {
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>
    } else if (status === true) {
      return <Badge className="bg-green-500 text-white">Verified</Badge>
    } else {
      return <Badge className="bg-red-500 text-white">Rejected</Badge>
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
          <CardDescription>
            View and verify student applications by year • 
            <span className="text-blue-600 font-medium"> Total: {statusCounts.total} students</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Academic Year</label>
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

              <div>
                <label className="text-sm font-medium mb-1 block">Gender Filter</label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-blue-600">
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    <span className="font-medium">
                      {yearOptions.find((y) => y.value === selectedYear)?.label}
                    </span>
                  </div>
                  {selectedGender !== "all" && (
                    <div className="text-xs text-gray-500 mt-1">
                      Filtered by: {genderOptions.find((g) => g.value === selectedGender)?.label}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Tabs with Counts */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="relative">
                  Pending
                  <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-800">
                    {statusCounts.pending}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="verified" className="relative">
                  Verified
                  <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                    {statusCounts.verified}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="relative">
                  Rejected
                  <Badge variant="secondary" className="ml-2 text-xs bg-red-100 text-red-800">
                    {statusCounts.rejected}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading students...</p>
                    </div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-4.586a1 1 0 00-.707.293L16 15H8l-2.707-1.707A1 1 0 004.586 13H0" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                    <p className="text-gray-500">
                      No {activeTab} students found for {yearOptions.find((y) => y.value === selectedYear)?.label}
                      {selectedGender !== "all" && ` with gender filter: ${genderOptions.find((g) => g.value === selectedGender)?.label}`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                      <span>
                        Showing <span className="font-semibold text-blue-600">{filteredStudents.length}</span> of{" "}
                        <span className="font-semibold">{allStudents.length}</span> students
                      </span>
                      <span className="text-xs">
                        Status: <span className="capitalize font-medium">{activeTab}</span>
                      </span>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Roll No</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Branch</TableHead>
                            <TableHead className="font-semibold">Gender</TableHead>
                            <TableHead className="font-semibold">Category</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student, index) => (
                            <TableRow 
                              key={student.roll_no} 
                              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                            >
                              <TableCell className="font-medium text-blue-600">
                                {student.roll_no}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {student.first_name} {student.middle_name || ""} {student.last_name || ""}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {student.branch?.branch}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="capitalize text-sm font-medium">
                                  {student.gender || "Not specified"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{student.admission_category.admission_category }</div>
                                  <div className="text-gray-500">({student.caste.name})</div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(student.verified)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewStudent(student.roll_no)}
                                  className="hover:bg-blue-50 hover:border-blue-300"
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { FileText, AlertTriangle } from "lucide-react"
import { fetchStudentDetails } from "@/lib/api-utils"

interface Student {
  roll_no: string
  first_name: string
  middle_name?: string
  last_name?: string
  personal_mail: string
  college_mail?: string
  mobile_number: string
  gender: string
  class_name: string
  branch: {
    branch: string
  }
  blood_group: string
  admission_category: {
    admission_category: string
  }
  caste: {
    name: string
  }
  creamy_layer: boolean
  orphan: boolean
  pwd: boolean
  parent_name: string
  parent_contact: string
  parent_occupation?: string
  permanent_address: string
  annual_income?: string
  local_guardian_name?: string
  local_guardian_address?: string
  local_guardian_contact?: string
  emergency_contact?: string
  entrance_exam?: string
  rank?: number
  cgpa?: number
  verified: boolean | null
  application_form?: string
  hostel_no_dues?: string
  mess_no_dues?: string
  address_proof?: string
  caste_validity_certificate?: string
  income_certificate?: string
  caste_certificate?: string
  ews_certificate?: string
  pwd_certificate?: string
  admission_confirmation_letter?: string
  college_fee_receipt?: string
  non_creamy_layer_certificate?: string
}

interface StudentDetailsModalProps {
  rollNo: string
  isOpen: boolean
  onClose: () => void
  onStudentUpdated?: () => void
}

export default function StudentDetailsModal({ 
  rollNo, 
  isOpen, 
  onClose,
  onStudentUpdated 
}: StudentDetailsModalProps) {
  const { toast } = useToast()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (isOpen && rollNo) {
      fetchStudentData()
    }
  }, [isOpen, rollNo])

  const fetchStudentData = async () => {
    setLoading(true)
    try {
      const data = await fetchStudentDetails(rollNo)
      setStudent(data)
    } catch (error) {
      console.error("Error fetching student details:", error)
      toast({
        title: "Error",
        description: "Failed to load student details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  const getYearLabel = (classCode: string) => {
    switch (classCode) {
      case "fy":
        return "First Year"
      case "sy":
        return "Second Year"
      case "ty":
        return "Third Year"
      case "btech":
        return "Final Year"
      default:
        return classCode
    }
  }

  const renderDocumentLink = (url: string | undefined, label: string) => {
    if (!url) return <p className="text-gray-500 italic">Not provided</p>

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-blue-600 hover:underline"
      >
        <FileText className="h-4 w-4 mr-2" />
        {label}
      </a>
    )
  }

  const renderModalContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <p>Loading student details...</p>
        </div>
      )
    }

    if (!student) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
          <p className="text-gray-500 mb-6">The student with roll number {rollNo} could not be found.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Student Details</h1>
          <div className="flex items-center space-x-2">{getStatusBadge(student.verified)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Personal and academic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Roll Number</p>
                <p className="font-semibold">{student.roll_no}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="font-semibold">
                  {student.first_name} {student.middle_name || ""} {student.last_name || ""}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{student.personal_mail}</p>
                {student.college_mail && <p>{student.college_mail}</p>}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Mobile</p>
                <p>{student.mobile_number}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p>{student.gender}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Year & Branch</p>
                <p>
                  {getYearLabel(student.class_name)} - {student.branch?.branch}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Documents & Verification</CardTitle>
              <CardDescription>Review student documents and verify eligibility</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="documents">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="family">Family & Address</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Application Form</h3>
                      {renderDocumentLink(student.application_form, "Application Form")}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">College Fee Receipt</h3>
                      {renderDocumentLink(student.college_fee_receipt, "Fee Receipt")}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Address Proof</h3>
                      {renderDocumentLink(student.address_proof, "Address Proof")}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="family" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Parent Information</h3>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p><span className="font-medium">Name:</span> {student.parent_name}</p>
                        <p><span className="font-medium">Contact:</span> {student.parent_contact}</p>
                        {student.parent_occupation && (
                          <p><span className="font-medium">Occupation:</span> {student.parent_occupation}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Permanent Address</h3>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p>{student.permanent_address}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {renderModalContent()}
        </DialogContent>
      </Dialog>
    </>
  )
}
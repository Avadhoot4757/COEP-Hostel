"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { fetchStudentDetails, updateStudentStatus } from "@/lib/api-utils"

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

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [rejectReason, setRejectReason] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const [action, setAction] = useState<"verify" | "reject" | null>(null)

  const rollNo = params.rollNo as string

  useEffect(() => {
    fetchstddata();
  }, [rollNo])

  const fetchstddata = async () => {
    setLoading(true)
    try {
      const data = await fetchStudentDetails(rollNo);
      console.log(data);
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
   const handleConfirmAction = async () => {
    if (!student || !action) return

    setIsSubmitting(true)

    const verified = action === "verify";

    try {
      const updatedStudent = await updateStudentStatus(
        rollNo,
        verified,
        student.verified
      )

      toast({
        title: "Success",
        description: `Student has been ${verified ? "verified" : "rejected"} successfully.`,
        variant: "success",
      })
      
      fetchstddata();
      setOpenDialog(false)
      
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActionClick = (actionType: "verify" | "reject") => {
    setAction(actionType)
    setOpenDialog(true)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p>Loading student details...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
        <p className="text-gray-500 mb-6">The student with roll number {rollNo} could not be found.</p>
        <Button onClick={() => router.back()}>Back to Student List</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            Back to List
          </Button>
          <h1 className="text-2xl font-bold">Student Details</h1>
        </div>
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
              <p>{student.gender === "male" ? "Male" : "Female"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Year & Branch</p>
              <p>
                {getYearLabel(student.class_name)} - {student.branch?.branch}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Blood Group</p>
              <p>{student.blood_group}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Category</p>
              <p>
                {student.admission_category.admission_category} ({student.caste.name})
              </p>
              {student.creamy_layer && <Badge variant="outline">Creamy Layer</Badge>}
            </div>

            {student.orphan && (
              <div className="space-y-1">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                  Orphan
                </Badge>
              </div>
            )}

            {student.pwd && (
              <div className="space-y-1">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  PWD
                </Badge>
              </div>
            )}

            {student.entrance_exam && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Entrance Exam</p>
                <p>{student.entrance_exam}</p>
                {student.rank && <p>Rank: {student.rank}</p>}
              </div>
            )}

            {student.cgpa !== null && student.cgpa !== undefined && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">CGPA</p>
                <p>{student.cgpa.toFixed(2)}</p>
              </div>
            )}
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
                    <h3 className="font-medium">Application Documents</h3>
                    <div className="space-y-3">
                      {renderDocumentLink(student.application_form, "Application Form")}
                      {renderDocumentLink(student.admission_confirmation_letter, "Admission Confirmation Letter")}
                      {renderDocumentLink(student.college_fee_receipt, "College Fee Receipt")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Hostel Documents</h3>
                    <div className="space-y-3">
                      {renderDocumentLink(student.hostel_no_dues, "Hostel No Dues")}
                      {renderDocumentLink(student.mess_no_dues, "Mess No Dues")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Personal Documents</h3>
                    <div className="space-y-3">{renderDocumentLink(student.address_proof, "Address Proof")}</div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Category Documents</h3>
                    <div className="space-y-3">
                      {renderDocumentLink(student.caste_certificate, "Caste Certificate")}
                      {renderDocumentLink(student.caste_validity_certificate, "Caste Validity Certificate")}
                      {renderDocumentLink(student.income_certificate, "Income Certificate")}
                      {renderDocumentLink(student.non_creamy_layer_certificate, "Non-Creamy Layer Certificate")}
                      {renderDocumentLink(student.ews_certificate, "EWS Certificate")}
                      {renderDocumentLink(student.pwd_certificate, "PWD Certificate")}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="family" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Parent Information</h3>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Parent Name</p>
                      <p>{student.parent_name}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Parent Contact</p>
                      <p>{student.parent_contact}</p>
                    </div>

                    {student.parent_occupation && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Occupation</p>
                        <p>{student.parent_occupation}</p>
                      </div>
                    )}

                    {student.annual_income && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Annual Income</p>
                        <p>{student.annual_income}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Address & Emergency Contacts</h3>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Permanent Address</p>
                      <p className="whitespace-pre-line">{student.permanent_address}</p>
                    </div>

                    {student.local_guardian_name && (
                      <>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-500">Local Guardian</p>
                          <p>{student.local_guardian_name}</p>
                        </div>

                        {student.local_guardian_contact && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Guardian Contact</p>
                            <p>{student.local_guardian_contact}</p>
                          </div>
                        )}

                        {student.local_guardian_address && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Guardian Address</p>
                            <p className="whitespace-pre-line">{student.local_guardian_address}</p>
                          </div>
                        )}
                      </>
                    )}

                    {student.emergency_contact && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Emergency Contact</p>
                        <p>{student.emergency_contact}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={() => router.back()}>
              Back to List
            </Button>
            <div className="space-x-2">
              {student.verified !== true && (
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleActionClick("verify")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Student
                </Button>
              )}

              {student.verified !== false && (
                <Button variant="destructive" onClick={() => handleActionClick("reject")}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Student
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "verify" ? "Verify Student" : "Reject Student"}</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to ${action} the student?`}
            </DialogDescription>
          </DialogHeader>

          {action === "reject" && (
            <div className="py-4">
              <Textarea
                placeholder="Enter reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={(action === "reject" && !rejectReason.trim()) || isSubmitting}
              variant={action === "verify" ? "default" : "destructive"}
            >
              {isSubmitting ? "Processing..." : action === "verify" ? "Verify" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

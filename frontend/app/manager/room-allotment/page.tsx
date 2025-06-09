  "use client"

  import api from "@/lib/api"
  import { useState, useEffect } from "react"
  import { Button } from "@/components/ui/button"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { Badge } from "@/components/ui/badge"
  import { Building, Download, FileSpreadsheet, RefreshCcw } from "lucide-react"
  import { useToast } from "@/components/ui/use-toast"
  import { ToastAction } from "@/components/ui/toast"
  import { Switch } from "@/components/ui/switch"
  import { Label } from "@/components/ui/label"

  // Mock data for blocks - replace with API call later
  const mockBlocks: { id: string; name: string; totalRooms: number; occupiedRooms: number }[] = [
    { id: "A", name: "A Block", totalRooms: 50, occupiedRooms: 35 },
    { id: "B", name: "B Block", totalRooms: 45, occupiedRooms: 28 },
    { id: "C", name: "C Block", totalRooms: 40, occupiedRooms: 22 },
    { id: "D", name: "D Block", totalRooms: 35, occupiedRooms: 15 },
  ]

  export default function RoomAllotmentPage() {
    const [selectedYear, setSelectedYear] = useState<string>("")
    const [selectedGender, setSelectedGender] = useState<string>("")
    const [availableBlocks, setAvailableBlocks] = useState(mockBlocks)
    const [allottedRooms, setAllottedRooms] = useState<{ group_id: number; room_id: number; room_number: string }[]>([])
    const [isAllotmentLoading, setIsAllotmentLoading] = useState<boolean>(false)
    const [isResetLoading, setIsResetLoading] = useState<boolean>(false)
    const [isDownloadLoading, setIsDownloadLoading] = useState<boolean>(false)
    const [isOverrideLoading, setIsOverrideLoading] = useState<boolean>(false)
    const [isAllotted, setIsAllotted] = useState<boolean>(false)
    const [canReallocate, setCanReallocate] = useState<boolean>(false)
    const { toast } = useToast()

    // Function to check if allotment has already been done
    const checkAllotmentStatus = async (year: string, gender: string) => {
      try {
        const response = await api.post(
          "adminrole/check_allotment/",
          { year, gender },
          { timeout: 5000 }
        )
        setIsAllotted(response.data.is_allotted)
        setCanReallocate(response.data.can_reallocate)
      } catch (error: any) {
        console.error("Error checking allotment status:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check allotment status.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
      }
    }

    // Function to record the allotment after successful allocation
    const recordAllotment = async (year: string, gender: string) => {
      try {
        const response = await api.post(
          "adminrole/record_allotment/",
          { year, gender },
          { timeout: 5000 }
        )
        if (response.status === 200) {
          setIsAllotted(true)
          setCanReallocate(false)
        }
      } catch (error: any) {
        console.error("Error recording allotment:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to record allotment status.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
      }
    }

    // Function to fetch blocks based on year and gender
    const fetchAvailableBlocks = async (year: string, gender: string) => {
      setIsAllotmentLoading(true)
      try {
        setTimeout(() => {
          setAvailableBlocks(mockBlocks)
          setIsAllotmentLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching blocks:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch block data.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
        setIsAllotmentLoading(false)
      }
    }

    // Function to handle room allotment
    const handleRoomAllotment = async () => {
      if (!selectedYear || !selectedGender) {
        toast({
          variant: "destructive",
          title: "Missing Filters",
          description: "Please select both year and gender.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
        return
      }

      // Check allotment status before proceeding
      const checkResponse = await api.post(
        "adminrole/check_allotment/",
        { year: selectedYear, gender: selectedGender },
        { timeout: 5000 }
      )
      if (checkResponse.data.is_allotted && !checkResponse.data.can_reallocate) {
        toast({
          variant: "destructive",
          title: "Allotment Already Done",
          description: "Allotment has already been done for this combination. Enable re-allocation or reset to proceed.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
        return
      }

      setIsAllotmentLoading(true)
      try {
        const response = await api.post(
          "adminrole/allot_rooms/",
          { year: selectedYear, gender: selectedGender },
          { timeout: 10000 }
        )

        if (response.status === 200) {
          const { message, allocated_rooms } = response.data
          setAllottedRooms(allocated_rooms)
          await recordAllotment(selectedYear, selectedGender) // Record the allotment
          toast({
            title: "Success",
            description: `${message} for ${selectedYear.charAt(0).toUpperCase() + selectedYear.slice(1)} Year (${selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)})`,
            action: <ToastAction altText="Close">Close</ToastAction>,
          })
        } else {
          throw new Error("Unexpected response status: " + response.status)
        }
      } catch (error: any) {
        console.error("Room allotment error:", error)
        const errorMessage = error.response?.data?.error || error.message || "An error occurred while initiating room allotment"
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
      } finally {
        setIsAllotmentLoading(false)
      }
    }

    // Function to handle PDF download
    const handleDownloadPDF = async () => {
      if (!selectedYear || !selectedGender) {
        toast({
          variant: "destructive",
          title: "Missing Filters",
          description: "Please select both year and gender.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
        return
      }

      setIsDownloadLoading(true)
      try {
        const response = await api.post(
          "adminrole/generate_pdf/",
          { year: selectedYear, gender: selectedGender },
          { responseType: "blob", timeout: 10000 }
        )

        if (response.data.type === "application/pdf") {
          const blob = new Blob([response.data], { type: "application/pdf" })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.setAttribute("download", `room_allotment_${selectedYear}_${selectedGender}.pdf`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)

          toast({
            title: "Success",
            description: `PDF downloaded for ${selectedYear.charAt(0).toUpperCase() + selectedYear.slice(1)} Year (${selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)})`,
            action: <ToastAction altText="Close">Close</ToastAction>,
          })
        } else {
          const text = await response.data.text()
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || "Invalid response from server")
        }
      } catch (error: any) {
        console.error("Error downloading PDF:", error)
        const errorMessage = error.message || "An error occurred while downloading the PDF"
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
      } finally {
        setIsDownloadLoading(false)
      }
    }

    // Function to handle allotment reset
    const handleResetAllotment = async () => {
      if (!selectedYear || !selectedGender) {
        toast({
          variant: "destructive",
          title: "Missing Filters",
          description: "Please select both year and gender.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
        return
      }

      setIsResetLoading(true)
      try {
        const response = await api.post(
          "adminrole/reset_allotment/",
          { year: selectedYear, gender: selectedGender },
          { timeout: 10000 }
        )

        if (response.status === 200) {
          setAllottedRooms([])
          setIsAllotted(false)
          setCanReallocate(false)
          toast({
            title: "Success",
            description: response.data.message,
            action: <ToastAction altText="Close">Close</ToastAction>,
          })
        } else {
          throw new Error("Unexpected response status: " + response.status)
        }
      } catch (error: any) {
        console.error("Reset allotment error:", error)
        const errorMessage = error.response?.data?.error || error.message || "An error occurred while resetting allotment"
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
      } finally {
        setIsResetLoading(false)
      }
    }

    // Function to handle manual override toggle
    const handleManualOverride = async (checked: boolean) => {
      if (!selectedYear || !selectedGender) {
        toast({
          variant: "destructive",
          title: "Missing Filters",
          description: "Please select both year and gender.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
        return
      }

      setIsOverrideLoading(true)
      try {
        const response = await api.post(
          "adminrole/manual_override/",
          { year: selectedYear, gender: selectedGender, allow_reallocation: checked },
          { timeout: 5000 }
        )

        if (response.status === 200) {
          setCanReallocate(checked)
          toast({
            title: "Success",
            description: response.data.message,
            action: <ToastAction altText="Close">Close</ToastAction>,
          })
        } else {
          throw new Error("Unexpected response status: " + response.status)
        }
      } catch (error: any) {
        console.error("Manual override error:", error)
        const errorMessage = error.response?.data?.error || error.message || "An error occurred while updating manual override"
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
          action: <ToastAction altText="Close">Close</ToastAction>,
        })
      } finally {
        setIsOverrideLoading(false)
      }
    }

    // Fetch blocks and check allotment status when year or gender changes
    useEffect(() => {
      if (selectedYear && selectedGender) {
        fetchAvailableBlocks(selectedYear, selectedGender)
        checkAllotmentStatus(selectedYear, selectedGender)
      } else {
        setIsAllotted(false)
        setCanReallocate(false)
        setAllottedRooms([])
      }
    }, [selectedYear, selectedGender])

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>Hostel Management</span>
              <span>›</span>
              <span>Room Allotment</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Room Allotment</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Academic Year 2024-25</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownloadPDF}
            disabled={!selectedYear || !selectedGender || isDownloadLoading}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </Button>
        </div>

        {/* Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Room Allotment Filters</CardTitle>
            <CardDescription>Select year and gender to view and manage room allotments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First Year</SelectItem>
                      <SelectItem value="second">Second Year</SelectItem>
                      <SelectItem value="third">Third Year</SelectItem>
                      <SelectItem value="fourth">Fourth Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Gender</label>
                  <Select value={selectedGender} onValueChange={setSelectedGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleRoomAllotment}
                  disabled={!selectedYear || !selectedGender || isAllotmentLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAllotmentLoading ? "Processing..." : "Start Room Allotment"}
                </Button>
              </div>

              {selectedYear && selectedGender && (
                <div className="flex gap-4 items-center">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="manual-override"
                      checked={canReallocate}
                      onCheckedChange={handleManualOverride}
                      disabled={!isAllotted || isOverrideLoading || !selectedYear || !selectedGender}
                    />
                    <Label htmlFor="manual-override">
                      {isOverrideLoading ? "Updating..." : "Allow Re-allocation"}
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleResetAllotment}
                    disabled={!selectedYear || !selectedGender || isResetLoading || !isAllotted}
                  >
                    <RefreshCcw className="w-4 h-4" />
                    {isResetLoading ? "Resetting..." : "Reset Allotment"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Room Allotment Status */}
        {selectedYear && selectedGender && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Room Allotment Status - {selectedYear.charAt(0).toUpperCase() + selectedYear.slice(1)} Year (
                {selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)})
              </h2>
              <p className="text-gray-600 mb-6">View and manage room allotments organized by hostel blocks</p>
              {isAllotted && !canReallocate && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <p className="text-yellow-700">
                    Allotment has already been done for this combination. Enable "Allow Re-allocation" or reset the allotment to start again.
                  </p>
                </div>
              )}
            </div>

            {/* Block Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {availableBlocks.map((block) => (
                <Card key={block.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{block.name}</h3>
                      <Badge variant="secondary">
                        {block.occupiedRooms}/{block.totalRooms}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Occupied:</span>
                        <span className="font-medium">{block.occupiedRooms} rooms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium text-green-600">{block.totalRooms - block.occupiedRooms} rooms</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(block.occupiedRooms / block.totalRooms) * 100}%`}}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Block-wise Room Allotments */}
            <div className="space-y-6">
              {availableBlocks.map((block) => {
                const blockRooms = allottedRooms.filter((room) => room.room_number.startsWith(block.id))
                return (
                  <Card key={block.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        {block.name} - Allotted Rooms
                      </CardTitle>
                      <CardDescription>
                        Currently showing {blockRooms.length} allotted rooms in {block.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {blockRooms.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4 font-medium text-gray-700">Room No.</th>
                                <th className="text-left py-2 px-4 font-medium text-gray-700">Group ID</th>
                                <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blockRooms.map((room, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4 font-medium">{room.room_number}</td>
                                  <td className="py-3 px-4">{room.group_id}</td>
                                  <td className="py-3 px-4">
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                      Allotted
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No rooms allotted in {block.name} for the selected criteria
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!selectedYear || !selectedGender) && (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Filters to View Room Allotments</h3>
              <p className="text-gray-500">
                Please select both year and gender to view room allotment status and manage allotments.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }
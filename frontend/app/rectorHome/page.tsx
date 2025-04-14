"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, AlertCircle, Users, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Event mapping between frontend and backend - Updated to match the new backend structure
const EVENT_MAPPING = {
  registrationStart: {
    name: "Registration Start Date",
    event: "Registration",
    dateType: "start_date",
    description: "When students can begin registering for hostel allocation",
  },
  registrationEnd: {
    name: "Registration End Date",
    event: "Registration",
    dateType: "end_date",
    description: "Last date for students to register",
  },
  resultDeclaration: {
    name: "Result Declaration Date",
    event: "Result Declaration",
    dateType: "start_date",
    description: "When initial results will be declared",
  },
  roommakingStart: {
    name: "Room Making Process Start Date",
    event: "Roommaking",
    dateType: "start_date",
    description: "When students can begin selecting roommates",
  },
  roommakingEnd: {
    name: "Room Making Process End Date",
    event: "Roommaking",
    dateType: "end_date",
    description: "Last date for selecting roommates",
  },
  finalAllotment: {
    name: "Final Room Allotment Declaration Date",
    event: "Final Allotment",
    dateType: "start_date",
    description: "When final room allotments will be announced",
  },
  verificationStart: {
    name: "Offline Verification Start Date",
    event: "Verification",
    dateType: "start_date",
    description: "When physical verification begins",
  },
  verificationEnd: {
    name: "Offline Verification End Date",
    event: "Verification",
    dateType: "end_date",
    description: "Last date for physical verification",
  },
}

const YEAR_OPTIONS = ["First Year", "Second Year", "Third Year", "Fourth Year"]

interface DateSetting {
  id: string
  name: string
  date: string
  description: string
  eventType: string
  dateType: string
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("set-dates")
  const [dates, setDates] = useState<DateSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("First Year")

  // Fetch initial dates from the backend
  useEffect(() => {
    setLoading(true)
    setError(null)

    // Append the year as a query parameter
    const yearParam = encodeURIComponent(selectedYear.toLowerCase().replace(" ", "_"))
    fetch(`http://127.0.0.1:8000/adminrole/setDates/?year=${yearParam}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch dates: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        const initialDates: DateSetting[] = Object.entries(EVENT_MAPPING).map(([id, info]) => ({
          id,
          name: info.name,
          date: data[id] || "",
          description: info.description,
          eventType: info.event,
          dateType: info.dateType,
        }))

        setDates(initialDates)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching dates:", error)
        setError("Failed to load dates. Please refresh the page or contact support.")

        // Fallback to default empty dates if API fails
        const fallbackDates: DateSetting[] = Object.entries(EVENT_MAPPING).map(([id, info]) => ({
          id,
          name: info.name,
          date: "",
          description: info.description,
          eventType: info.event,
          dateType: info.dateType,
        }))

        setDates(fallbackDates)
        setLoading(false)
      })
  }, [selectedYear]) // Add selectedYear as a dependency

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleDateChange = (id: string, newDate: string) => {
    setDates(dates.map((date) => (date.id === id ? { ...date, date: newDate } : date)))
  }

  const handleSaveDates = async () => {
    try {
      // Format the data for the backend
      const dataToSave = {
        year: selectedYear.toLowerCase().replace(" ", "_"),
        dates: dates.reduce(
          (acc, date) => {
            if (date.date) {
              acc[date.id] = date.date
            }
            return acc
          },
          {} as { [key: string]: string },
        ),
      }

      const response = await fetch("http://127.0.0.1:8000/adminrole/setDates/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToSave),
      })

      if (!response.ok) {
        throw new Error(`Failed to save dates: ${response.status}`)
      }

      const result = await response.json()

      setNotification({
        type: "success",
        message: result.status || `Dates for ${selectedYear} saved successfully!`,
      })

      setActiveTab("current-dates")
    } catch (error) {
      console.error("Error saving dates:", error)

      setNotification({
        type: "error",
        message: "Failed to save dates. Please try again.",
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dates...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Academic Year 2024-25</span>
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-green-600">Active</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-64">
          <Label htmlFor="year-select" className="mb-2 block">
            Select Year
          </Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger id="year-select" className="w-full">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <p className="text-sm text-blue-700">
            Currently viewing: <strong>{selectedYear}</strong>
          </p>
        </div>
      </div>

      {notification && (
        <Alert variant={notification.type === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{notification.type === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && dates.every((date) => date.date === "") && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Please set the dates for the {selectedYear} hostel allocation process to begin.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="set-dates" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="set-dates">Set Process Dates</TabsTrigger>
          <TabsTrigger value="current-dates">Current Dates</TabsTrigger>
        </TabsList>

        <TabsContent value="set-dates">
          <Card>
            <CardHeader>
              <CardTitle>Set Hostel Allocation Process Dates for {selectedYear}</CardTitle>
              <CardDescription>
                Configure the timeline for the {selectedYear} hostel allocation process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {dates.map((date) => (
                  <div key={date.id} className="space-y-2">
                    <Label htmlFor={date.id} className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {date.name}
                    </Label>
                    <Input
                      id={date.id}
                      type="datetime-local"
                      value={date.date}
                      onChange={(e) => handleDateChange(date.id, e.target.value)}
                    />
                    <p className="text-sm text-gray-500">{date.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveDates}>Save {selectedYear} Dates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current-dates">
          <Card>
            <CardHeader>
              <CardTitle>Current Process Timeline for {selectedYear}</CardTitle>
              <CardDescription>Overview of the {selectedYear} hostel allocation process timeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dates.map((date) => (
                    <TableRow key={date.id}>
                      <TableCell className="font-medium">{date.name}</TableCell>
                      <TableCell>{date.date ? new Date(date.date).toLocaleString() : "Not set"}</TableCell>
                      <TableCell>
                        {date.date ? (
                          new Date(date.date) > new Date() ? (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              <Clock className="mr-1 h-3 w-3" />
                              Upcoming
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Completed
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            Not Set
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setActiveTab("set-dates")}>
                  Edit Dates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {YEAR_OPTIONS.map((year) => (
          <Card key={year} className={selectedYear === year ? "border-2 border-primary" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{year}</CardTitle>
              {selectedYear === year && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
            </CardHeader>
            <CardContent>
              <Button
                variant={selectedYear === year ? "default" : "outline"}
                className="w-full"
                onClick={() => setSelectedYear(year)}
              >
                {selectedYear === year ? "Currently Selected" : "View Dates"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students ({selectedYear})</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedYear === "First Year"
                ? "1,245"
                : selectedYear === "Second Year"
                  ? "1,120"
                  : selectedYear === "Third Year"
                    ? "980"
                    : "850"}
            </div>
            <p className="text-xs text-gray-500">+5% from last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms Available ({selectedYear})</CardTitle>
            <Building className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedYear === "First Year"
                ? "850"
                : selectedYear === "Second Year"
                  ? "750"
                  : selectedYear === "Third Year"
                    ? "650"
                    : "550"}
            </div>
            <p className="text-xs text-gray-500">Across all hostels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocation Progress ({selectedYear})</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dates.some((date) => date.date && new Date(date.date) < new Date()) ? "In Progress" : "0%"}
            </div>
            <p className="text-xs text-gray-500">
              {dates.some((date) => date.date && new Date(date.date) < new Date())
                ? "Process started"
                : "Process not started"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

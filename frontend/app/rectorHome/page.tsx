"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle, Users, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DateSetting {
  id: string;
  name: string;
  date: string;
  description: string;
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("set-dates");
  const [dates, setDates] = useState<DateSetting[]>([]);

  // Fetch initial dates from the /adminrole/setDates endpoint
  useEffect(() => {
    fetch("http://127.0.0.1:8000/adminrole/setDates/", {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("inside hello ", data);
        const initialDates: DateSetting[] = [
          { id: "registrationStart", name: "Registration Start Date", date: data.registrationStart || "", description: "When students can begin registering for hostel allocation" },
          { id: "registrationEnd", name: "Registration End Date", date: data.registrationEnd || "", description: "Last date for students to register" },
          { id: "resultDeclaration", name: "Result Declaration Date", date: data.resultDeclaration || "", description: "When initial results will be declared" },
          { id: "roommakingStart", name: "Room Making Process Start Date", date: data.roommakingStart || "", description: "When students can begin selecting roommates" },
          { id: "roommakingEnd", name: "Room Making Process End Date", date: data.roommakingEnd || "", description: "Last date for selecting roommates" },
          { id: "finalAllotment", name: "Final Room Allotment Declaration Date", date: data.finalAllotment || "", description: "When final room allotments will be announced" },
          { id: "verificationStart", name: "Offline Verification Start Date", date: data.verificationStart || "", description: "When physical verification begins" },
          { id: "verificationEnd", name: "Offline Verification End Date", date: data.verificationEnd || "", description: "Last date for physical verification" },
        ];
        setDates(initialDates);
      })
      .catch((error) => {
        console.error("Error fetching dates:", error);
        // Fallback to default empty dates if API fails
        setDates([
          { id: "registrationStart", name: "Registration Start Date", date: "", description: "When students can begin registering for hostel allocation" },
          { id: "registrationEnd", name: "Registration End Date", date: "", description: "Last date for students to register" },
          { id: "resultDeclaration", name: "Result Declaration Date", date: "", description: "When initial results will be declared" },
          { id: "roommakingStart", name: "Room Making Process Start Date", date: "", description: "When students can begin selecting roommates" },
          { id: "roommakingEnd", name: "Room Making Process End Date", date: "", description: "Last date for selecting roommates" },
          { id: "finalAllotment", name: "Final Room Allotment Declaration Date", date: "", description: "When final room allotments will be announced" },
          { id: "verificationStart", name: "Offline Verification Start Date", date: "", description: "When physical verification begins" },
          { id: "verificationEnd", name: "Offline Verification End Date", date: "", description: "Last date for physical verification" },
        ]);
      });
  }, []); // Runs once on component mount

  const handleDateChange = (id: string, newDate: string) => {
    setDates(dates.map((date) => (date.id === id ? { ...date, date: newDate } : date)));
  };

  const handleSaveDates = () => {
    // Prepare data for POST request
    const dataToSave = dates.reduce((acc, date) => {
      acc[date.id] = date.date || null; // Send null for empty dates
      return acc;
    }, {} as { [key: string]: string | null });
    console.log(dataToSave);
    fetch("http://127.0.0.1:8000/adminrole/setDates/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(dataToSave),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Dates saved successfully!");
        setActiveTab("current-dates");
      })
      .catch((error) => {
        console.error("Error saving dates:", error);
        alert("Failed to save dates. Please try again.");
      });
  };

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

      {dates.every((date) => date.date === "") && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>Please set the dates for the hostel allocation process to begin.</AlertDescription>
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
              <CardTitle>Set Hostel Allocation Process Dates</CardTitle>
              <CardDescription>Configure the timeline for the entire hostel allocation process.</CardDescription>
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
                <Button onClick={handleSaveDates}>Save Dates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current-dates">
          <Card>
            <CardHeader>
              <CardTitle>Current Process Timeline</CardTitle>
              <CardDescription>Overview of the hostel allocation process timeline.</CardDescription>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-gray-500">+5% from last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms Available</CardTitle>
            <Building className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">850</div>
            <p className="text-xs text-gray-500">Across all hostels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocation Progress</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-gray-500">Process not started</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
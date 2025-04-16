// pages/RectorHome.tsx
"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/lib/api";
import { format, parse, addHours, isToday } from "date-fns";

interface DateSetting {
  event_id: number;
  event: string;
  start_date: string;
  end_date?: string;
  year: string;
}

interface EventForm {
  event: string;
  start_date: string; // yyyy-MM-dd
  start_time: string; // HH:mm
  end_date?: string; // yyyy-MM-dd
  end_time?: string; // HH:mm
}

const EVENT_CONFIG = [
  { event: "Registration", label: "Registration", requiresEndDate: true },
  { event: "Student Data Verification", label: "Student Data Verification", requiresEndDate: true },
  { event: "Result Declaration", label: "Result Declaration", requiresEndDate: false },
  { event: "Roommaking", label: "Roommaking", requiresEndDate: true },
  { event: "Final Allotment", label: "Final Allotment", requiresEndDate: false },
  { event: "Verification", label: "Verification", requiresEndDate: true },
];

const YEAR_OPTIONS = ["fy", "sy", "ty", "btech"];
const YEAR_LABELS = {
  fy: "First Year",
  sy: "Second Year",
  ty: "Third Year",
  btech: "Fourth Year",
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2).toString().padStart(2, "0");
  const minutes = (i % 2 === 0 ? "00" : "30");
  return `${hours}:${minutes}`;
});

export default function RectorHome() {
  const [activeTab, setActiveTab] = useState("current-dates");
  const [allDates, setAllDates] = useState<DateSetting[]>([]);
  const [formData, setFormData] = useState<EventForm[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedViewYear, setSelectedViewYear] = useState<string>("fy");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [openTimePicker, setOpenTimePicker] = useState<{ index: number; field: string } | null>(null);

  // Define viewDates for current-dates tab
  const viewDates = allDates.filter(d => d.year === selectedViewYear);

  const initializeForm = (existingDates: DateSetting[], targetYears: string[]) => {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");

    return EVENT_CONFIG.map((event, index) => {
      // Find existing dates for any selected year
      const existing = existingDates.find(
        d => d.event === event.event && targetYears.includes(d.year)
      );

      if (existing) {
        const startDate = new Date(existing.start_date);
        const endDate = existing.end_date ? new Date(existing.end_date) : undefined;
        return {
          event: event.event,
          start_date: format(startDate, "yyyy-MM-dd"),
          start_time: format(startDate, "HH:mm"),
          end_date: endDate && event.requiresEndDate ? format(endDate, "yyyy-MM-dd") : undefined,
          end_time: endDate && event.requiresEndDate ? format(endDate, "HH:mm") : undefined,
        };
      }

      // Default for new entries
      const startDate = addHours(now, (index + 1) * 24); // Stagger by 1 day per event
      const endDate = event.requiresEndDate ? addHours(startDate, 24) : undefined;
      const defaultTime = "09:00";
      const startTime = format(startDate, "yyyy-MM-dd") === today
        ? TIME_OPTIONS.find(t => {
            const [hours, minutes] = t.split(":").map(Number);
            const timeInMinutes = hours * 60 + minutes;
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            return timeInMinutes > nowMinutes;
          }) || "23:30"
        : defaultTime;

      return {
        event: event.event,
        start_date: format(startDate, "yyyy-MM-dd"),
        start_time: startTime,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        end_time: endDate ? defaultTime : undefined,
      };
    });
  };

  useEffect(() => {
    const fetchDates = async () => {
      try {
        setLoading(true);
        const response = await api.get("/adminrole/set-dates/");
        console.log("GET response:", response.data);
        setAllDates(response.data || []);
        setFormData(initializeForm(response.data || [], selectedYears.length ? selectedYears : YEAR_OPTIONS));
      } catch (err) {
        console.error("Error fetching dates:", err);
        setAllDates([]);
        setFormData(initializeForm([], selectedYears.length ? selectedYears : YEAR_OPTIONS));
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  useEffect(() => {
    setFormData(initializeForm(allDates, selectedYears.length ? selectedYears : YEAR_OPTIONS));
  }, [selectedYears, allDates]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleFormChange = (index: number, field: keyof EventForm, value: string) => {
    setFormData(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleTimeSelect = (index: number, field: keyof EventForm, value: string) => {
    handleFormChange(index, field, value);
    setOpenTimePicker(null);
  };

  const toggleYear = (year: string) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const getValidTimeOptions = (
    date: string | undefined,
    isEndTime: boolean,
    startDate: string | undefined,
    startTime: string | undefined
  ) => {
    if (!date) return TIME_OPTIONS;

    const today = format(new Date(), "yyyy-MM-dd");
    let validTimes = TIME_OPTIONS;

    if (date === today) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      validTimes = validTimes.filter(time => {
        const [hours, minutes] = time.split(":").map(Number);
        const timeInMinutes = hours * 60 + minutes;
        return timeInMinutes > currentTimeInMinutes;
      });
    }

    if (isEndTime && date === startDate && startTime) {
      const startTimeInMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
      validTimes = validTimes.filter(time => {
        const [hours, minutes] = time.split(":").map(Number);
        const timeInMinutes = hours * 60 + minutes;
        return timeInMinutes > startTimeInMinutes;
      });
    }

    return validTimes.length > 0 ? validTimes : [TIME_OPTIONS[TIME_OPTIONS.length - 1]];
  };

  const validateForm = () => {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < formData.length; i++) {
      const event = formData[i];
      if (!event.start_date || !event.start_time) {
        return `Start date and time are required for ${event.event}.`;
      }
      if (EVENT_CONFIG[i].requiresEndDate && (!event.end_date || !event.end_time)) {
        return `End date and time are required for ${event.event}.`;
      }

      if (event.start_date === today) {
        const [startHours, startMinutes] = event.start_time.split(":").map(Number);
        const startTimeInMinutes = startHours * 60 + startMinutes;
        if (startTimeInMinutes <= currentTimeInMinutes) {
          return `Start time for ${event.event} on today must be after the current time.`;
        }
      }

      if (event.end_date === today && event.end_time) {
        const [endHours, endMinutes] = event.end_time.split(":").map(Number);
        const endTimeInMinutes = endHours * 60 + endMinutes;
        if (endTimeInMinutes <= currentTimeInMinutes) {
          return `End time for ${event.event} on today must be after the current time.`;
        }
      }

      if (event.end_date && event.end_time && event.start_date === event.end_date) {
        const [startHours, startMinutes] = event.start_time.split(":").map(Number);
        const [endHours, endMinutes] = event.end_time.split(":").map(Number);
        const startTimeInMinutes = startHours * 60 + startMinutes;
        const endTimeInMinutes = endHours * 60 + endMinutes;
        if (endTimeInMinutes <= startTimeInMinutes) {
          return `End time for ${event.event} must be after start time on the same day.`;
        }
      }

      const currentStart = parse(`${event.start_date} ${event.start_time}`, "yyyy-MM-dd HH:mm", new Date());
      const currentEnd = event.end_date && event.end_time
        ? parse(`${event.end_date} ${event.end_time}`, "yyyy-MM-dd HH:mm", new Date())
        : currentStart;

      if (event.end_date && currentEnd < currentStart) {
        return `End date and time for ${event.event} must be on or after start date and time.`;
      }

      if (i > 0) {
        const prev = formData[i - 1];
        const prevEnd = prev.end_date && prev.end_time
          ? parse(`${prev.end_date} ${prev.end_time}`, "yyyy-MM-dd HH:mm", new Date())
          : parse(`${prev.start_date} ${prev.start_time}`, "yyyy-MM-dd HH:mm", new Date());
        if (currentStart < prevEnd) {
          return `Start date and time for ${event.event} must be on or after end date and time of ${prev.event}.`;
        }
      }
    }

    if (selectedYears.length === 0) {
      return "Please select at least one year to apply the dates to.";
    }

    return null;
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    try {
      const dataToSave = formData.map(item => ({
        event: item.event,
        start_date: new Date(`${item.start_date}T${item.start_time}:00.000Z`).toISOString(),
        end_date: item.end_date && item.end_time
          ? new Date(`${item.end_date}T${item.end_time}:00.000Z`).toISOString()
          : undefined,
        years: selectedYears,
      }));

      console.log("POST data:", dataToSave);
      const response = await api.post("/adminrole/set-dates/", dataToSave);
      setNotification({
        type: "success",
        message: response.data.message || "Dates saved successfully!",
      });
      setActiveTab("current-dates");

      const fetchResponse = await api.get("/adminrole/set-dates/");
      console.log("GET after POST:", fetchResponse.data);
      setAllDates(fetchResponse.data || []);
      setFormData(initializeForm(fetchResponse.data || [], selectedYears));
    } catch (err: any) {
      console.error("Error saving dates:", err);
      setValidationError(
        err.response?.data?.errors?.[0]?.errors?.start_date?.[0] ||
        err.response?.data?.errors?.[0]?.errors?.end_date?.[0] ||
        "Failed to save dates."
      );
    }
  };

  const handleSaveDates = () => {
    const validationError = validateForm();
    if (validationError) {
      setValidationError(validationError);
      return;
    }
    setShowConfirmDialog(true);
  };

  const isEditable = (event: string, year: string) => {
    const eventDate = allDates.find(d => d.event === event && d.year === year)?.start_date;
    if (!eventDate) return true;
    return new Date(eventDate) > new Date();
  };

  const isYearEditable = (year: string) => {
    const eventsForYear = allDates.filter(d => d.year === year);
    return eventsForYear.some(d => isEditable(d.event, d.year));
  };

  const getEventStatus = (start_date?: string, end_date?: string) => {
    if (!start_date) return "Not Set";
    const now = new Date();
    const start = new Date(start_date);
    const end = end_date ? new Date(end_date) : start;

    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dates...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Rector Dashboard</h1>

      {notification && (
        <Alert variant={notification.type === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{notification.type === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {validationError && (
        <AlertDialog open={!!validationError} onOpenChange={() => setValidationError(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Validation Error</AlertDialogTitle>
              <AlertDialogDescription>{validationError}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setValidationError(null)}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Date Submission</AlertDialogTitle>
            <AlertDialogDescription>
              <p>Please confirm the following dates for {selectedYears.map(y => YEAR_LABELS[y]).join(", ")}:</p>
              <ul className="mt-2 space-y-2">
                {formData.map(event => (
                  <li key={event.event}>
                    <strong>{event.event}:</strong>{" "}
                    {format(
                      parse(`${event.start_date} ${event.start_time}`, "yyyy-MM-dd HH:mm", new Date()),
                      "PPP 'at' p"
                    )}
                    {event.end_date && event.end_time && (
                      <>
                        {" to "}
                        {format(
                          parse(`${event.end_date} ${event.end_time}`, "yyyy-MM-dd HH:mm", new Date()),
                          "PPP 'at' p"
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current-dates">View Dates</TabsTrigger>
          <TabsTrigger value="set-dates">Set Dates</TabsTrigger>
        </TabsList>

        <TabsContent value="current-dates">
          <Card>
            <CardHeader>
              <CardTitle>Current Process Timeline</CardTitle>
              <CardDescription>View the hostel allocation timeline by year.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 w-64">
                <Label htmlFor="year-select">Select Year</Label>
                <Select value={selectedViewYear} onValueChange={setSelectedViewYear}>
                  <SelectTrigger id="year-select">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map(year => (
                      <SelectItem key={year} value={year}>
                        {YEAR_LABELS[year]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewDates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No dates set for {YEAR_LABELS[selectedViewYear]}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    EVENT_CONFIG.map(config => {
                      const date = viewDates.find(d => d.event === config.event);
                      return (
                        <TableRow key={config.event}>
                          <TableCell>{config.label}</TableCell>
                          <TableCell>
                            {date?.start_date
                              ? format(new Date(date.start_date), "PPP 'at' p")
                              : "Not set"}
                          </TableCell>
                          <TableCell>
                            {date?.end_date
                              ? format(new Date(date.end_date), "PPP 'at' p")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                getEventStatus(date?.start_date, date?.end_date) === "Upcoming"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : getEventStatus(date?.start_date, date?.end_date) === "Ongoing"
                                  ? "bg-blue-100 text-blue-800"
                                  : getEventStatus(date?.start_date, date?.end_date) === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              {getEventStatus(date?.start_date, date?.end_date)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setActiveTab("set-dates")}>Edit Dates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="set-dates">
          <Card>
            <CardHeader>
              <CardTitle>Set Hostel Allocation Dates</CardTitle>
              <CardDescription>Configure the timeline for the hostel allocation process.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {formData.map((event, index) => {
                  const isEventEditable = selectedYears.every(year => isEditable(event.event, year));
                  return (
                    <div key={event.event} className="space-y-4 border-b pb-4">
                      <h3 className="font-medium">{event.event}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date and Time</Label>
                          <div className="flex gap-2">
                            <Input
                              id={`${event.event}-start-date`}
                              type="date"
                              value={event.start_date}
                              onChange={e => handleFormChange(index, "start_date", e.target.value)}
                              min={format(new Date(), "yyyy-MM-dd")}
                              disabled={!isEventEditable}
                            />
                            <Popover
                              open={openTimePicker?.index === index && openTimePicker?.field === "start_time"}
                              onOpenChange={open => setOpenTimePicker(open ? { index, field: "start_time" } : null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-32 justify-start text-left font-normal"
                                  disabled={!isEventEditable}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  {event.start_time || "Select time"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-32 p-0">
                                <div className="max-h-60 overflow-y-auto">
                                  {getValidTimeOptions(event.start_date, false, undefined, undefined).map(time => (
                                    <Button
                                      key={time}
                                      variant="ghost"
                                      className="w-full justify-start rounded-none"
                                      onClick={() => handleTimeSelect(index, "start_time", time)}
                                    >
                                      {time}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        {event.end_date !== undefined && (
                          <div className="space-y-2">
                            <Label>End Date and Time</Label>
                            <div className="flex gap-2">
                              <Input
                                id={`${event.event}-end-date`}
                                type="date"
                                value={event.end_date}
                                onChange={e => handleFormChange(index, "end_date", e.target.value)}
                                min={event.start_date || format(new Date(), "yyyy-MM-dd")}
                                disabled={!isEventEditable}
                              />
                              <Popover
                                open={openTimePicker?.index === index && openTimePicker?.field === "end_time"}
                                onOpenChange={open => setOpenTimePicker(open ? { index, field: "end_time" } : null)}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-32 justify-start text-left font-normal"
                                    disabled={!isEventEditable}
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {event.end_time || "Select time"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-32 p-0">
                                  <div className="max-h-60 overflow-y-auto">
                                    {getValidTimeOptions(event.end_date, true, event.start_date, event.start_time).map(time => (
                                      <Button
                                        key={time}
                                        variant="ghost"
                                        className="w-full justify-start rounded-none"
                                        onClick={() => handleTimeSelect(index, "end_time", time)}
                                      >
                                        {time}
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="space-y-4">
                  <Label>Apply to Years (select at least one)</Label>
                  <div className="flex flex-wrap gap-6">
                    {YEAR_OPTIONS.map(year => (
                      <div key={year} className="flex items-center gap-2">
                        <Checkbox
                          id={`year-${year}`}
                          checked={selectedYears.includes(year)}
                          onCheckedChange={() => toggleYear(year)}
                          className="h-5 w-5"
                          disabled={false}
                        />
                        <Label htmlFor={`year-${year}`} className="text-base">
                          {YEAR_LABELS[year]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveDates}>Save Dates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { CalendarIcon, Clock, Trash2 } from 'lucide-react';
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast"

// Types
type RegistrationPhase = {
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

type YearOption = 'FY' | 'SY' | 'TY' | 'BTech';

type Event = {
  event: string;
  start_date: string;
  end_date: string | null;
  year: string;
};

// Map UI year options to backend year values
const yearMap: Record<YearOption, string> = {
  FY: 'fy',
  SY: 'sy',
  TY: 'ty',
  BTech: 'btech',
};

const displayYearMap: Record<string, string> = {
  fy: 'First Year',
  sy: 'Second Year',
  ty: 'Third Year',
  btech: 'Fourth Year',
};

// Main component
function OpenRegistration() {
  const yearOptions: YearOption[] = ['FY', 'SY', 'TY', 'BTech'];
  const [selectedYears, setSelectedYears] = useState<YearOption[]>([]);
  const [phases, setPhases] = useState<RegistrationPhase[]>([
    { name: 'Open Registrations', startDate: '', startTime: '', endDate: '', endTime: '' },
  ]);
  const [ongoingEvents, setOngoingEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast()

  // Fetch ongoing and upcoming events
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/adminrole/open-registration/');
        const now = new Date();
        const ongoing = response.data.filter((event: Event) => {
          const startDate = new Date(event.start_date);
          const endDate = event.end_date ? new Date(event.end_date) : null;
          return startDate <= now && (!endDate || endDate >= now);
        });
        const upcoming = response.data.filter((event: Event) => {
          const startDate = new Date(event.start_date);
          return startDate > now;
        });
        setOngoingEvents(ongoing);
        setUpcomingEvents(upcoming);
      } catch (err) {
        toast({
          title: "Error",
          description: err.response?.data?.error || "Failed to fetch events.",
          variant: "destructive",
        })
        // setError('Failed to fetch events');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleYearChange = (year: YearOption) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleDateTimeChange = (
    index: number,
    field: 'startDate' | 'endDate' | 'startTime' | 'endTime',
    value: string
  ) => {
    const updatedPhases = [...phases];
    updatedPhases[index][field] = value;
    setPhases(updatedPhases);
  };

  const handleDelete = async (year: string) => {
    if (!confirm(`Are you sure you want to delete the Open Registrations event for ${displayYearMap[year]}?`)) {
      return;
    }
    try {
      await api.delete(`/adminrole/open-registration/?year=${year}`);
      setOngoingEvents((prev) => prev.filter((event) => event.year !== year));
      setUpcomingEvents((prev) => prev.filter((event) => event.year !== year));
      // alert('Event deleted successfully');
      toast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "default",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to delete event.",
        variant: "destructive",
      })
      // setError(err.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const phase = phases[0];
    if (!phase.startDate || !phase.startTime) {
      setError('Start date and time are required');
      setIsSubmitting(false);
      return;
    }
    if (selectedYears.length === 0) {
      setError('At least one year must be selected');
      setIsSubmitting(false);
      return;
    }

    const startDateTime = `${phase.startDate}T${phase.startTime}:00Z`;
    const endDateTime = phase.endDate && phase.endTime ? `${phase.endDate}T${phase.endTime}:00Z` : null;
    const payload = {
      start_date: startDateTime,
      end_date: endDateTime,
      years: selectedYears.map((year) => yearMap[year]),
    };
    console.log("Payload sent to /adminrole/open-registration/:", payload);

    try {
      await api.post('/adminrole/open-registration/', payload);
      // alert('Open Registrations dates saved successfully');
      toast({
        title: "Success",
        description: "Open Registrations dates saved successfully",
        variant: "default",
      })
      // Refresh events
      const response = await api.get('/adminrole/open-registration/');
      const now = new Date();
      const ongoing = response.data.filter((event: Event) => {
        const startDate = new Date(event.start_date);
        const endDate = event.end_date ? new Date(event.end_date) : null;
        return startDate <= now && (!endDate || endDate >= now);
      });
      const upcoming = response.data.filter((event: Event) => {
        const startDate = new Date(event.start_date);
        return startDate > now;
      });
      setOngoingEvents(ongoing);
      setUpcomingEvents(upcoming);
    } catch (err: any) {
      console.error("API error:", err.response?.data);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to save dates.",
        variant: "destructive",
      })
      // setError(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to save dates');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 rounded-xl"> {/* Added rounded-xl */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="p-4 rounded-lg"> {/* Added rounded-lg */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Open Registration</h1>
            <p className="text-gray-600">Set registration schedule by student year</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
              Loading events...
            </div>
          )}

          {ongoingEvents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Ongoing Events</h2>
              <div className="space-y-4">
                {ongoingEvents.map((event) => (
                  <div key={event.year} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <div>
                      <p className="font-medium">{event.event} - {displayYearMap[event.year]}</p>
                      <p className="text-sm text-gray-600">
                        Start: {new Date(event.start_date).toLocaleString()} | End:{' '}
                        {event.end_date ? new Date(event.end_date).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(event.year)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title="Delete event"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Year(s)
                </label>
                <div className="flex flex-wrap gap-4">
                  {yearOptions.map((year) => (
                    <label key={year} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => handleYearChange(year)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{year}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {phases.map((phase, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 shadow-sm"> {/* Changed to rounded-xl */}
                    <div className="font-medium mb-4">{phase.name}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor={`${phase.name}-start-date`}
                            className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                          >
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Start Date
                          </label>
                          <input
                            type="date"
                            id={`${phase.name}-start-date`}
                            value={phase.startDate}
                            onChange={(e) => handleDateTimeChange(index, 'startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /* Changed to rounded-lg */
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`${phase.name}-start-time`}
                            className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Start Time
                          </label>
                          <input
                            type="time"
                            id={`${phase.name}-start-time`}
                            value={phase.startTime}
                            onChange={(e) => handleDateTimeChange(index, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /* Changed to rounded-lg */
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor={`${phase.name}-end-date`}
                            className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                          >
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            End Date
                          </label>
                          <input
                            type="date"
                            id={`${phase.name}-end-date`}
                            value={phase.endDate}
                            onChange={(e) => handleDateTimeChange(index, 'endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min={phase.startDate}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`${phase.name}-end-time`}
                            className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            End Time
                          </label>
                          <input
                            type="time"
                            id={`${phase.name}-end-time`}
                            value={phase.endTime}
                            onChange={(e) => handleDateTimeChange(index, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  className="mr-4 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" /* Changed to rounded-lg */
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>

          {upcomingEvents.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Upcoming Events</h2>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.year} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <div>
                      <p className="font-medium">{event.event} - {displayYearMap[event.year]}</p>
                      <p className="text-sm text-gray-600">
                        Start: {new Date(event.start_date).toLocaleString()} | End:{' '}
                        {event.end_date ? new Date(event.end_date).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(event.year)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title="Delete event"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OpenRegistration;

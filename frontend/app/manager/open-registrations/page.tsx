'use client';

import React, { useState } from 'react';
import { CalendarIcon, Clock } from 'lucide-react';

// Types
type RegistrationPhase = {
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

type YearOption = 'FY' | 'SY' | 'TY' | 'BTech';

// Main component
function App() {
  const yearOptions: YearOption[] = ['FY', 'SY', 'TY', 'BTech'];
  const [selectedYear, setSelectedYear] = useState<YearOption>('FY');
  
  const initialPhases: RegistrationPhase[] = [
    { name: "Registration", startDate: "", startTime: "", endDate: "", endTime: "" }
  ];
  
  const [phases, setPhases] = useState<RegistrationPhase[]>(initialPhases);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value as YearOption);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Open Registration</h1>
            <p className="text-gray-600">Set registration schedule by student year</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Year
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-6">
                {phases.map((phase, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <div className="font-medium mb-4">{phase.name}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor={`${phase.name}-start-date`} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Start Date
                          </label>
                          <input
                            type="date"
                            id={`${phase.name}-start-date`}
                            value={phase.startDate}
                            onChange={(e) => handleDateTimeChange(index, 'startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor={`${phase.name}-start-time`} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Start Time
                          </label>
                          <input
                            type="time"
                            id={`${phase.name}-start-time`}
                            value={phase.startTime}
                            onChange={(e) => handleDateTimeChange(index, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor={`${phase.name}-end-date`} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            End Date
                          </label>
                          <input
                            type="date"
                            id={`${phase.name}-end-date`}
                            value={phase.endDate}
                            onChange={(e) => handleDateTimeChange(index, 'endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            min={phase.startDate}
                          />
                        </div>
                        <div>
                          <label htmlFor={`${phase.name}-end-time`} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            End Time
                          </label>
                          <input
                            type="time"
                            id={`${phase.name}-end-time`}
                            value={phase.endTime}
                            onChange={(e) => handleDateTimeChange(index, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
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
                  className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
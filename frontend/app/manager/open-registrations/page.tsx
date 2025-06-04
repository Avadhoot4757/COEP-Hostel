'use client';
import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';

// Types
type RegistrationPhase = {
  name: string;
  startDate: string;
  endDate: string;
};

type YearOption = 'FY' | 'SY' | 'TY' | 'BTech';

interface RegistrationSchedule {
  year: YearOption;
  phases: RegistrationPhase[];
}

// Utility functions
const isValidDateRange = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Main component
function App() {
  const yearOptions: YearOption[] = ['FY', 'SY', 'TY', 'BTech'];
  const [selectedYear, setSelectedYear] = useState<YearOption>('FY');
  
  const initialPhases: RegistrationPhase[] = [
    { name: "Registration", startDate: "", endDate: "" },
    { name: "Student Data Verification", startDate: "", endDate: "" },
    { name: "Result Declaration", startDate: "", endDate: "" },
    { name: "Roommaking", startDate: "", endDate: "" },
    { name: "Final Allotment", startDate: "", endDate: "" },
    { name: "Verification", startDate: "", endDate: "" },
  ];
  
  const [phases, setPhases] = useState<RegistrationPhase[]>(initialPhases);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value as YearOption);
  };

  const handleDateChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const updatedPhases = [...phases];
    updatedPhases[index][field] = value;
    setPhases(updatedPhases);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    //api idhar hoga
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Open Registration</h1>
            <p className="text-gray-600">Set registration schedules by student year</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`${phase.name}-start`} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Start Date
                        </label>
                        <input
                          type="date"
                          id={`${phase.name}-start`}
                          value={phase.startDate}
                          onChange={(e) => handleDateChange(index, 'startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`${phase.name}-end`} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          End Date
                        </label>
                        <input
                          type="date"
                          id={`${phase.name}-end`}
                          value={phase.endDate}
                          onChange={(e) => handleDateChange(index, 'endDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          min={phase.startDate}
                        />
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
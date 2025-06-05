"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"

interface Student {
  roll_no: string
  first_name: string
  middle_name?: string
  last_name?: string
  class_name: string
  branch: { name: string }
  verified: boolean
  selected: boolean
  caste: { name: string }
  admission_category: { name: string }
  last_selection_year: string
}

export default function ViewVerifiedStudentsPage() {
  const [selectedYear, setSelectedYear] = useState<string>("fy")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedGender, setSelectedGender] = useState<string>("male")
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [branches, setBranches] = useState<string[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [nonSelectedStudents, setNonSelectedStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [currentNonSelectedPage, setCurrentNonSelectedPage] = useState<number>(1)
  const [showToast, setShowToast] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string>("")
  const [showRemoveDialog, setShowRemoveDialog] = useState<boolean>(false)
  const [studentToRemove, setStudentToRemove] = useState<string>("")
  const [hasAllocated, setHasAllocated] = useState<boolean>(false)
  const [noSeatMatrix, setNoSeatMatrix] = useState<boolean>(false)

  const yearOptions = [
    { value: "fy", label: "First Year" },
    { value: "sy", label: "Second Year" },
    { value: "ty", label: "Third Year" },
    { value: "btech", label: "Final Year" },
  ]

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ]

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "open", label: "Open" },
    { value: "sc", label: "SC" },
    { value: "st", label: "ST" },
    { value: "obc", label: "OBC" },
    { value: "vjnt", label: "VJNT" },
    { value: "nt-b", label: "NT-B" },
    { value: "nt-c", label: "NT-C" },
    { value: "nt-d", label: "NT-D" },
    { value: "sebc", label: "SEBC" },
    { value: "ews", label: "EWS" },
    { value: "ai", label: "AI" },
    { value: "pwd", label: "PWD" },
  ]

  const studentsPerPage = 10

  useEffect(() => {
    loadBranches()
    loadStudents()
  }, [selectedYear, selectedGender])

  useEffect(() => {
    loadStudents()
  }, [selectedCategory, selectedBranch])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  const loadBranches = async () => {
    try {
      const response = await api.get(`/adminrole/get-branches/`, {
        params: { year: selectedYear, gender: selectedGender },
      })
      setBranches(response.data.branches)
      setNoSeatMatrix(response.data.branches.length === 0)
      setSelectedBranch("all")
    } catch (error) {
      console.error("Error fetching branches:", error)
      setBranches([])
      setNoSeatMatrix(true)
      showToastMessage("Failed to load branches. Please try again.")
    }
  }

  const loadStudents = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/adminrole/get-students/`, {
        params: { year: selectedYear, gender: selectedGender, category: selectedCategory, branch: selectedBranch },
      })
      const students = response.data.students
      setSelectedStudents(students.filter((s: Student) => s.selected))
      setNonSelectedStudents(students.filter((s: Student) => !s.selected))
      setHasAllocated(students.some((s: Student) => s.last_selection_year === selectedYear))
      setCurrentPage(1)
      setCurrentNonSelectedPage(1)
    } catch (error) {
      console.error("Error fetching students:", error)
      showToastMessage("Failed to load student data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAllotBranchRanks = async () => {
    setLoading(true)
    try {
      const response = await api.post("/adminrole/allot-branch-ranks/", {
        year: selectedYear,
        gender: selectedGender,
      })
      showToastMessage(response.data.message)
      await loadStudents()
      setHasAllocated(true)
    } catch (error: any) {
      console.error("Error allotting branch ranks:", error)
      showToastMessage(error.response?.data?.error || "Failed to allot branch ranks. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/adminrole/exp_stu/`, {
        params: { year: selectedYear, gender: selectedGender, category: selectedCategory, format: "pdf" },
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `students_${selectedYear}_${selectedGender}_${selectedCategory}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showToastMessage("PDF downloaded successfully.")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      showToastMessage("Failed to download PDF. Please try again.")
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/adminrole/export-students/`, {
        params: { year: selectedYear, gender: selectedGender, category: selectedCategory, format: "excel" },
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `students_${selectedYear}_${selectedGender}_${selectedCategory}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showToastMessage("Excel file exported successfully.")
    } catch (error) {
      console.error("Error exporting Excel:", error)
      showToastMessage("Failed to export Excel. Please try again.")
    }
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    setSelectedBranch("all")
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
  }

  const handleGenderChange = (value: string) => {
    setSelectedGender(value)
    setSelectedBranch("all")
  }

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value)
  }

  const handleRemoveStudent = async (rollNo: string) => {
    try {
      await api.post(`/adminrole/remove-student/`, { roll_no: rollNo })
      const removedStudent = selectedStudents.find((s) => s.roll_no === rollNo)
      if (removedStudent) {
        setSelectedStudents((prev) => prev.filter((student) => student.roll_no !== rollNo))
        setNonSelectedStudents((prev) => [...prev, { ...removedStudent, selected: false }])
        showToastMessage(`Student with Roll No ${rollNo} has been removed from selection.`)
      }
      setShowRemoveDialog(false)
      setStudentToRemove("")
      setHasAllocated(false)
    } catch (error) {
      console.error("Error removing student:", error)
      showToastMessage("Failed to remove student. Please try again.")
    }
  }

  const handleSelectStudent = async (rollNo: string) => {
    try {
      await api.post(`/adminrole/select-student/`, { roll_no: rollNo })
      const studentToSelect = nonSelectedStudents.find((s) => s.roll_no === rollNo)
      if (studentToSelect) {
        setNonSelectedStudents((prev) => prev.filter((student) => student.roll_no !== rollNo))
        setSelectedStudents((prev) => [...prev, { ...studentToSelect, selected: true }])
        showToastMessage(`Student with Roll No ${rollNo} has been added to selection.`)
      }
      setHasAllocated(false)
    } catch (error) {
      console.error("Error selecting student:", error)
      showToastMessage("Failed to select student. Please try again.")
    }
  }

  const openRemoveDialog = (rollNo: string) => {
    setStudentToRemove(rollNo)
    setShowRemoveDialog(true)
  }

  const totalSelectedPages = Math.ceil(selectedStudents.length / studentsPerPage)
  const totalNonSelectedPages = Math.ceil(nonSelectedStudents.length / studentsPerPage)

  const paginatedSelectedStudents = selectedStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage,
  )

  const paginatedNonSelectedStudents = nonSelectedStudents.slice(
    (currentNonSelectedPage - 1) * studentsPerPage,
    currentNonSelectedPage * studentsPerPage,
  )

  const renderPagination = (currentPageNum: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPageNum - 1))}
          disabled={currentPageNum === 1}
          className={`px-3 py-2 text-sm border rounded-md ${
            currentPageNum === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum = i + 1
          if (totalPages > 5 && currentPageNum > 3) {
            pageNum = currentPageNum - 2 + i
            if (pageNum > totalPages) pageNum = totalPages - (4 - i)
          }
          return (
            <button
              key={i}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 text-sm border rounded-md ${
                pageNum === currentPageNum ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {pageNum}
            </button>
          )
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPageNum + 1))}
          disabled={currentPageNum === totalPages}
          className={`px-3 py-2 text-sm border rounded-md ${
            currentPageNum === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Next
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg">
          {toastMessage}
        </div>
      )}

      {showRemoveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Remove Student</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove this student from the selection? This action will move them to the non-selected list.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRemoveDialog(false)
                  setStudentToRemove("")
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveStudent(studentToRemove)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {noSeatMatrix && (
        <div className="fixed top-4 left-4 z-50 bg-yellow-600 text-white px-4 py-2 rounded-md shadow-lg">
          No seat matrix found for {yearOptions.find((y) => y.value === selectedYear)?.label} -{" "}
          {genderOptions.find((g) => g.value === selectedGender)?.label}. Please create a seat matrix to proceed.
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">View Verified Students</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Academic Year 2024-25</span>
            <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs">Active</span>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleAllotBranchRanks}
            disabled={loading || hasAllocated || noSeatMatrix}
            className={`px-4 py-2 text-sm rounded-md text-white ${
              loading || hasAllocated || noSeatMatrix ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Processing..." : hasAllocated ? "Ranks Already Allotted" : "Allot Branch Ranks"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={loading || noSeatMatrix}
            className={`px-4 py-2 text-sm rounded-md text-white ${
              loading || noSeatMatrix ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Download PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || noSeatMatrix}
            className={`px-4 py-2 text-sm rounded-md text-white ${
              loading || noSeatMatrix ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            Export to Excel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Selected Students</h2>
            <p className="text-sm text-gray-600 mt-1">
              View and manage students who have been verified and selected for hostel allocation
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-64">
                  <label className="text-sm font-medium mb-1 block">Select Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {yearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-64">
                  <label className="text-sm font-medium mb-1 block">Select Gender</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-64">
                  <label className="text-sm font-medium mb-1 block">Select Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-64">
                  <label className="text-sm font-medium mb-1 block">Select Branch</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-blue-600 flex items-center">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    Currently viewing: {yearOptions.find((y) => y.value === selectedYear)?.label} -{" "}
                    {genderOptions.find((g) => g.value === selectedGender)?.label} -{" "}
                    {categoryOptions.find((c) => c.value === selectedCategory)?.label} -{" "}
                    {selectedBranch === "all" ? "All Branches" : selectedBranch}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Selected: {selectedStudents.length} students</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading students...</p>
                </div>
              ) : paginatedSelectedStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No selected students found for the selected criteria</div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Roll No
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Branch
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedSelectedStudents.map((student) => (
                          <tr key={student.roll_no}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.roll_no}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}
                              {student.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.branch.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.admission_category.name} ({student.caste.name})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Selected
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openRemoveDialog(student.roll_no)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(currentPage, totalSelectedPages, setCurrentPage)}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Verified But Not Selected Students</h2>
            <p className="text-sm text-gray-600 mt-1">
              Students who have been verified but not yet selected for hostel allocation
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Available: {nonSelectedStudents.length} students</p>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading students...</p>
                </div>
              ) : paginatedNonSelectedStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No non-selected students found for the selected criteria
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Roll No
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Branch
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedNonSelectedStudents.map((student) => (
                          <tr key={student.roll_no}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.roll_no}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}
                              {student.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.branch.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.admission_category.name} ({student.caste.name})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Verified
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleSelectStudent(student.roll_no)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(currentNonSelectedPage, totalNonSelectedPages, setCurrentNonSelectedPage)}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
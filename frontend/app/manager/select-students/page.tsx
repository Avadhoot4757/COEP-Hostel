"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"

interface Student {
  roll_no: string
  name: string
  admission_category: string
  caste: string
  cgpa: number | null
  backlogs: number | null
  branch_rank: number
  seat_alloted: string | null
}

interface SeatMatrix {
  id: number
  year: string
  gender: string
  total_seats: number
  ews_seats: number
  all_india_seats: number
  branch_seats: {
    [branch: string]: {
      [category: string]: number | { [key: string]: string[] }
    }
  }
  reserved_seats: {
    id: number
    goi_jk_seats: number
    nri_fn_pio_gulf_seats: number
  }
}

interface Branch {
  branch: string
  year: string
  seat_allocation_weight: number
}

export default function ViewStudentsPage() {
  const [selectedYear, setSelectedYear] = useState<string>("fy")
  const [selectedGender, setSelectedGender] = useState<string>("male")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [branches, setBranches] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [seatMatrix, setSeatMatrix] = useState<SeatMatrix | null>(null)
  const [slots, setSlots] = useState<{ [key: string]: Student | null }>({})
  const [waitingList, setWaitingList] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [showToast, setShowToast] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string>("")
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false)
  const [studentToAdd, setStudentToAdd] = useState<Student | null>(null)
  const [availableSeats, setAvailableSeats] = useState<string[]>([])

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

  useEffect(() => {
    loadBranches()
  }, [selectedYear])

  useEffect(() => {
    if (selectedBranch) {
      loadStudentsAndSeatMatrix()
    }
  }, [selectedBranch])

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
      const response = await api.get(`/auth/branches/`, {
        params: { year: selectedYear },
      })
      const branchNames = response.data.map((branch: Branch) => branch.branch)
      setBranches(branchNames)
      console.log("Branches fetched:", branchNames)
      setSelectedBranch(branchNames?.[0] || "")
    } catch (error) {
      console.error("Error fetching branches:", error)
      setBranches([])
      setSelectedBranch("")
      showToastMessage("Failed to load branches. Please try again.")
    }
  }

  const loadStudentsAndSeatMatrix = async () => {
    setLoading(true)
    try {
      const [studentsResponse, seatMatrixResponse] = await Promise.all([
        api.get(`/adminrole/select-students/`, {
          params: { year: selectedYear, gender: selectedGender, branch: selectedBranch },
        }),
        api.get(`/adminrole/seat-matrix/`, {
          params: { year: selectedYear, gender: selectedGender },
        }),
      ])

      const studentsData = studentsResponse.data.students || []
      const seatMatrixData = seatMatrixResponse.data || {}

      setStudents(studentsData)
      setSeatMatrix(seatMatrixData)

      if (studentsData.some((s: Student) => s.seat_alloted)) {
        const newSlots: { [key: string]: Student | null } = {}
        const waiting: Student[] = []
        studentsData.forEach((student: Student) => {
          if (student.seat_alloted && student.seat_alloted !== "WAITING") {
            newSlots[student.seat_alloted] = student
          } else {
            waiting.push(student)
          }
        })
        setSlots(newSlots)
        setWaitingList(waiting.sort((a, b) => a.branch_rank - b.branch_rank))
      } else {
        setSlots({})
        setWaitingList([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      showToastMessage("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const allocateSeats = () => {
    if (!seatMatrix || !selectedBranch || !students.length) return

    const branchMatrix = seatMatrix.branch_seats[selectedBranch] || {}
    const slots: { [key: string]: Student | null } = {}
    let waiting: Student[] = [...students].sort((a, b) => a.branch_rank - b.branch_rank)

    const categories = Object.keys(branchMatrix).filter(key => !key.startsWith("common") && !key.includes("-"))
    const commonGroups = branchMatrix.common || {}

    // Pre-populate all slots, even if empty
    categories.forEach(category => {
      const seatCount = branchMatrix[category] as number
      for (let i = 1; i <= seatCount; i++) {
        const slotName = `${category}-${i}`
        if (waiting.length > 0) {
          slots[slotName] = waiting.shift()!
        } else {
          slots[slotName] = null
        }
      }
    })

    Object.keys(commonGroups).forEach(commonGroup => {
      const seatCount = branchMatrix[commonGroup] as number
      for (let i = 1; i <= seatCount; i++) {
        const slotName = `${commonGroup}-${i}`
        if (waiting.length > 0) {
          slots[slotName] = waiting.shift()!
        } else {
          slots[slotName] = null
        }
      }
    })

    let waitingIndex = 1
    waiting.forEach(student => {
      slots[`WAITING-${waitingIndex}`] = student
      waitingIndex++
    })

    setSlots(slots)
    setWaitingList(waiting)
  }

  const removeStudent = (slot: string) => {
    const student = slots[slot]
    if (!student) return

    const newSlots = { ...slots }
    newSlots[slot] = null

    const newWaiting = [...waitingList, student].sort((a, b) => a.branch_rank - b.branch_rank)
    let waitingIndex = 1
    Object.keys(newSlots).forEach(key => {
      if (key.startsWith("WAITING")) {
        delete newSlots[key]
      }
    })
    newWaiting.forEach(student => {
      newSlots[`WAITING-${waitingIndex}`] = student
      waitingIndex++
    })

    setSlots(newSlots)
    setWaitingList(newWaiting)
  }

  const openAddDialog = (student: Student) => {
    // Derive available seats from the seat matrix, not just existing slots
    if (!seatMatrix || !selectedBranch) return

    const branchMatrix = seatMatrix.branch_seats[selectedBranch] || {}
    const categories = Object.keys(branchMatrix).filter(key => !key.startsWith("common") && !key.includes("-"))
    const commonGroups = branchMatrix.common || {}

    const allPossibleSeats: string[] = []
    
    // Add all seats from categories
    categories.forEach(category => {
      const seatCount = branchMatrix[category] as number
      for (let i = 1; i <= seatCount; i++) {
        const slotName = `${category}-${i}`
        allPossibleSeats.push(slotName)
      }
    })

    // Add all seats from common groups
    Object.keys(commonGroups).forEach(commonGroup => {
      const seatCount = branchMatrix[commonGroup] as number
      for (let i = 1; i <= seatCount; i++) {
        const slotName = `${commonGroup}-${i}`
        allPossibleSeats.push(slotName)
      }
    })

    // Filter for available seats (not in waiting list and not occupied)
    const available = allPossibleSeats.filter(seat => {
      const studentInSlot = slots[seat]
      return !seat.startsWith("WAITING") && (!studentInSlot || studentInSlot === null)
    })

    console.log("All possible seats:", allPossibleSeats)
    console.log("Available seats:", available)

    setAvailableSeats(available)
    setStudentToAdd(student)
    setShowAddDialog(true)
  }

  const addStudent = (seat: string) => {
    console.log("Adding student to seat:", seat, studentToAdd)
    if (!studentToAdd) return

    const newSlots = { ...slots }
    newSlots[seat] = studentToAdd

    const newWaiting = waitingList.filter(s => s.roll_no !== studentToAdd.roll_no)
    let waitingIndex = 1
    Object.keys(newSlots).forEach(key => {
      if (key.startsWith("WAITING")) {
        delete newSlots[key]
      }
    })
    newWaiting.forEach(student => {
      newSlots[`WAITING-${waitingIndex}`] = student
      waitingIndex++
    })

    setSlots(newSlots)
    setWaitingList(newWaiting)
    setShowAddDialog(false)
    setStudentToAdd(null)
    setAvailableSeats([])
  }

  const saveAllocations = async () => {
    setLoading(true)
    try {
      const allocations = Object.entries(slots).map(([seat, student]) => ({
        roll_no: student?.roll_no,
        seat_alloted: seat.startsWith("WAITING") ? null : seat,
      })).filter(alloc => alloc.roll_no)

      await api.post(`/adminrole/select-students/`, {
        year: selectedYear,
        gender: selectedGender,
        branch: selectedBranch,
        allocations,
      })

      showToastMessage("Allocations saved successfully.")
    } catch (error) {
      console.error("Error saving allocations:", error)
      showToastMessage("Failed to save allocations. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Separate selected and waiting slots
  const selectedSlots = Object.entries(slots).filter(([slot]) => !slot.startsWith("WAITING"))
  const waitingSlots = Object.entries(slots).filter(([slot]) => slot.startsWith("WAITING"))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg">
          {toastMessage}
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Add Student</h3>
            <p className="text-gray-600 mb-4">
              Select a seat for {studentToAdd?.name} (Roll No: {studentToAdd?.roll_no})
            </p>
            <div className="space-y-2">
              {availableSeats.length > 0 ? (
                availableSeats.map(seat => (
                  <button
                    key={seat}
                    onClick={() => addStudent(seat)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Allot {seat}
                  </button>
                ))
              ) : (
                <p className="text-gray-500">No available seats.</p>
              )}
            </div>
            <button
              onClick={() => setShowAddDialog(false)}
              className="mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Hostel Allocation</h1>

        <div className="flex space-x-4">
          <div className="w-64">
            <label className="text-sm font-medium mb-1 block">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
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
              onChange={(e) => setSelectedGender(e.target.value)}
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
            <label className="text-sm font-medium mb-1 block">Select Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={allocateSeats}
            disabled={loading || !selectedBranch}
            className={`px-4 py-2 mt-6 text-sm rounded-md text-white ${
              loading || !selectedBranch ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Processing..." : "Select Students"}
          </button>
          <button
            onClick={saveAllocations}
            disabled={loading || !Object.keys(slots).length}
            className={`px-4 py-2 mt-6 text-sm rounded-md text-white ${
              loading || !Object.keys(slots).length ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Save Allocations
          </button>
        </div>

        {seatMatrix && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Seat Matrix Details</h2>
            <p className="text-sm text-gray-600">
              Total Seats: {seatMatrix.total_seats} | EWS Seats: {seatMatrix.ews_seats} | All India Seats: {seatMatrix.all_india_seats} | 
              GOI & J&K Seats: {seatMatrix.reserved_seats.goi_jk_seats} | NRI/FN/PIO/Gulf Seats: {seatMatrix.reserved_seats.nri_fn_pio_gulf_seats}
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        ) : Object.keys(slots).length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Selected Students Section */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Selected Students</h2>
            </div>
            <div className="p-6">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MIS No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Caste
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CGPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No of Backlogs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedSlots.map(([slot, student]) => (
                      <tr key={slot}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student?.roll_no || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.admission_category || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.caste || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.cgpa ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.backlogs ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {slot}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeStudent(slot)}
                            disabled={!student}
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
            </div>

            {/* Waiting Students Section */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Waiting Students</h2>
            </div>
            <div className="p-6">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MIS No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Caste
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CGPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No of Backlogs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {waitingSlots.map(([slot, student]) => (
                      <tr key={slot}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student?.roll_no || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.admission_category || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.caste || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.cgpa ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student?.backlogs ?? "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {slot}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openAddDialog(student!)}
                            disabled={!student || availableSeats.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Select a branch and click "Select Students" to allocate seats.
          </div>
        )}
      </div>
    </div>
  )
}

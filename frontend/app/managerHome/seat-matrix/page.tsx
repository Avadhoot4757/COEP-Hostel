
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"

interface Caste {
  caste: string
  year: string
  seat_matrix_percentage: number
}

interface Branch {
  branch: string
  year: string
  seat_allocation_weight: number
}

interface SeatMatrix {
  year: string
  gender: string
  total_seats: number
  ews_seats: number
  all_india_seats: number
  branch_seats: { [branch: string]: { [caste: string]: number | { [key: string]: string[] } } }
  reserved_seats: {
    goi_jk_seats: number
    nri_fn_pio_gulf_seats: number
  }
}

interface BranchAllocation {
  [branch: string]: {
    ewsSeats: number
    allIndiaSeats: number
  }
}

export default function SeatMatrixPage() {
  const [className, setClassName] = useState<string>("fy")
  const [gender, setGender] = useState<string>("male")
  const [totalSeats, setTotalSeats] = useState<number>(0)
  const [ewsSeats, setEwsSeats] = useState<number>(0)
  const [allIndiaSeats, setAllIndiaSeats] = useState<number>(0)
  const [goiJkSeats, setGoiJkSeats] = useState<number>(0)
  const [nriSeats, setNriSeats] = useState<number>(0)
  const [castes, setCastes] = useState<Caste[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [matrix, setMatrix] = useState<{ [branch: string]: { [caste: string]: number } }>({})
  const [branchAllocations, setBranchAllocations] = useState<BranchAllocation>({})
  const [mergedCastes, setMergedCastes] = useState<{ [branch: string]: { [mergedName: string]: string[] } }>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [isEditingCastes, setIsEditingCastes] = useState<boolean>(false)
  const [isEditingBranches, setIsEditingBranches] = useState<boolean>(false)
  const [selectedCastes, setSelectedCastes] = useState<string[]>([])
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [newCasteName, setNewCasteName] = useState<string>("")
  const [newCastePercentage, setNewCastePercentage] = useState<number>(0)
  const [newBranchName, setNewBranchName] = useState<string>("")
  const [newBranchWeight, setNewBranchWeight] = useState<number>(1)
  const [mergeModalOpen, setMergeModalOpen] = useState<boolean>(false)
  const [mergeModalBranch, setMergeModalBranch] = useState<string>("")
  const [mergeModalCastes, setMergeModalCastes] = useState<string[]>([])
  const { toast } = useToast()

  const classOptions = [
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
    const loadData = async () => {
      try {
        setLoading(true)
        const [casteResponse, branchResponse, seatMatrixResponse] = await Promise.all([
          api.get(`/auth/castes/?year=${className}`),
          api.get(`/auth/branches/?year=${className}`),
          api.get(`/adminrole/seat-matrix/?year=${className}&gender=${gender}`).catch((error) => {
            if (error.response?.status === 404) return null
            throw error
          }),
        ])
        setCastes(casteResponse.data || [])
        setBranches(branchResponse.data || [])

        if (seatMatrixResponse?.data) {
          setTotalSeats(seatMatrixResponse.data.total_seats)
          setEwsSeats(seatMatrixResponse.data.ews_seats)
          setAllIndiaSeats(seatMatrixResponse.data.all_india_seats)
          setGoiJkSeats(seatMatrixResponse.data.reserved_seats.goi_jk_seats)
          setNriSeats(seatMatrixResponse.data.reserved_seats.nri_fn_pio_gulf_seats)

          const newMatrix: { [branch: string]: { [caste: string]: number } } = {}
          const newMergedCastes: { [branch: string]: { [mergedName: string]: string[] } } = {}
          const newBranchAllocations: BranchAllocation = {}

          Object.keys(seatMatrixResponse.data.branch_seats).forEach(branch => {
            newMatrix[branch] = {}
            const branchData = seatMatrixResponse.data.branch_seats[branch]

            // Step 1: Initialize merged castes if they exist
            if (branchData.common) {
              newMergedCastes[branch] = branchData.common
              Object.keys(branchData.common).forEach(mergedName => {
                const castesInGroup = branchData.common[mergedName]
                castesInGroup.forEach((caste: string) => {
                  newMatrix[branch][caste] = 0 // Initialize to 0
                })
              })
            }

            // Step 2: Process branch data
            Object.keys(branchData).forEach(key => {
              if (key === "common") return // Skip the "common" key

              const value = branchData[key]
              // Check if the key is a merged caste group
              if (newMergedCastes[branch] && key in newMergedCastes[branch]) {
                const castesInGroup = newMergedCastes[branch][key]
                const totalSeats = Number(value) || 0 // The value is a number (e.g., "SC-ST": 20)
                const seatsPerCaste = Math.floor(totalSeats / castesInGroup.length)
                const remainder = totalSeats % castesInGroup.length
                castesInGroup.forEach((caste: string, index: number) => {
                  newMatrix[branch][caste] = seatsPerCaste + (index < remainder ? 1 : 0)
                })
              } else {
                // Handle individual caste (e.g., "OPEN": 50)
                newMatrix[branch][key] = Number(value) || 0
              }
            })

            // Step 3: Calculate EWS and All India seats for the branch
            newBranchAllocations[branch] = {
              ewsSeats: Math.round((seatMatrixResponse.data.ews_seats * (branchResponse.data.find((b: Branch) => b.branch === branch)?.seat_allocation_weight || 1)) / branchResponse.data.reduce((sum: number, b: Branch) => sum + b.seat_allocation_weight, 0)),
              allIndiaSeats: Math.round((seatMatrixResponse.data.all_india_seats * (branchResponse.data.find((b: Branch) => b.branch === branch)?.seat_allocation_weight || 1)) / branchResponse.data.reduce((sum: number, b: Branch) => sum + b.seat_allocation_weight, 0)),
            }
          })

          setMatrix(newMatrix)
          setMergedCastes(newMergedCastes)
          setBranchAllocations(newBranchAllocations)
        } else {
          setTotalSeats(0)
          setEwsSeats(0)
          setAllIndiaSeats(0)
          setGoiJkSeats(0)
          setNriSeats(0)
          setMatrix({})
          setMergedCastes({})
          setBranchAllocations({})
        }
      } catch (error: any) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [className, gender])

  const calculateMatrix = () => {
    // Debug: Log initial values
    console.log('Debug - Initial values:', {
      totalSeats,
      branches: branches.map(b => ({ branch: b.branch, weight: b.seat_allocation_weight })),
      castes: castes.map(c => ({ caste: c.caste, percentage: c.seat_matrix_percentage })),
      ewsSeats,
      allIndiaSeats
    })
  
    // Validation checks
    if (totalSeats <= 0) {
      toast({
        title: "Error",
        description: "Total seats must be greater than 0.",
        variant: "destructive",
      })
      return
    }
  
    if (!branches || branches.length === 0) {
      toast({
        title: "Error", 
        description: "No branches available.",
        variant: "destructive",
      })
      return
    }
  
    if (!castes || castes.length === 0) {
      toast({
        title: "Error",
        description: "No castes available.", 
        variant: "destructive",
      })
      return
    }
  
    const totalWeight = branches.reduce((sum, b) => sum + (Number(b.seat_allocation_weight) || 0), 0)
    console.log('Debug - Total weight:', totalWeight)
  
    if (totalWeight <= 0) {
      toast({
        title: "Error",
        description: "Total branch weight must be greater than 0.",
        variant: "destructive",
      })
      return
    }
  
    const seatsPerWeight = totalSeats / totalWeight
    console.log('Debug - Seats per weight:', seatsPerWeight)
  
    const newMatrix = {}
    const newBranchAllocations = {}
  
    // Step 1: Calculate seat allocations for each branch
    let remainingTotalSeats = totalSeats
    const branchSeatAllocations = {}
  
    branches.forEach((branch, index) => {
      const branchWeight = Number(branch.seat_allocation_weight) || 0
      const isLastBranch = index === branches.length - 1
      
      let branchSeats
      if (isLastBranch) {
        branchSeats = remainingTotalSeats
      } else {
        branchSeats = Math.round(seatsPerWeight * branchWeight)
      }
      
      branchSeats = Math.max(branchSeats, 0) // Ensure non-negative
      branchSeatAllocations[branch.branch] = branchSeats
      remainingTotalSeats -= branchSeats
      
      console.log(`Debug - Branch ${branch.branch}: weight=${branchWeight}, seats=${branchSeats}`)
    })
  
    // Step 2: Distribute seats within each branch across castes  
    branches.forEach(branch => {
      const branchSeats = branchSeatAllocations[branch.branch]
      console.log(`Debug - Processing branch ${branch.branch} with ${branchSeats} seats`)
      
      newMatrix[branch.branch] = {}
      
      // Initialize all castes to 0
      castes.forEach(caste => {
        newMatrix[branch.branch][caste.caste] = 0
      })
  
      if (branchSeats <= 0) {
        console.log(`Debug - Branch ${branch.branch} has no seats, skipping`)
        return
      }
  
      // Calculate total percentage
      const totalPercentage = castes.reduce((sum, caste) => {
        const percentage = Number(caste.seat_matrix_percentage) || 0
        return sum + percentage
      }, 0)
      
      console.log(`Debug - Total percentage for branch ${branch.branch}:`, totalPercentage)
  
      if (totalPercentage <= 0) {
        toast({
          title: "Error",
          description: `Total caste percentage must be greater than 0 for branch ${branch.branch}.`,
          variant: "destructive",
        })
        return
      }
  
      // Step 3: Distribute seats proportionally to castes
      let remainingSeatsToDistribute = branchSeats
      let totalAllocated = 0
  
      castes.forEach((caste, index) => {
        if (remainingSeatsToDistribute <= 0) return
        
        const castePercentage = Number(caste.seat_matrix_percentage) || 0
        const isLastCaste = index === castes.length - 1
        
        let seats
        if (isLastCaste) {
          // Last caste gets all remaining seats
          seats = remainingSeatsToDistribute
        } else {
          const expectedSeats = (branchSeats * castePercentage) / totalPercentage
          seats = Math.round(expectedSeats)
          
          // Ensure at least 1 seat if percentage > 0 but rounds to 0
          if (castePercentage > 0 && seats === 0) {
            seats = 1
          }
        }
        
        // Don't allocate more than remaining
        seats = Math.min(seats, remainingSeatsToDistribute)
        seats = Math.max(seats, 0) // Ensure non-negative
        
        newMatrix[branch.branch][caste.caste] = seats
        remainingSeatsToDistribute -= seats
        totalAllocated += seats
        
        console.log(`Debug - Caste ${caste.caste}: percentage=${castePercentage}%, seats=${seats}`)
      })
  
      console.log(`Debug - Branch ${branch.branch} total allocated: ${totalAllocated} out of ${branchSeats}`)
  
      // Step 4: Handle any remaining seats (add to OPEN category if exists)
      if (remainingSeatsToDistribute > 0) {
        const openCaste = castes.find(c => c.caste.toUpperCase() === 'OPEN')
        if (openCaste) {
          newMatrix[branch.branch]['OPEN'] += remainingSeatsToDistribute
          console.log(`Debug - Added ${remainingSeatsToDistribute} remaining seats to OPEN category`)
        } else {
          // If no OPEN category, add to first caste
          const firstCaste = castes[0]
          if (firstCaste) {
            newMatrix[branch.branch][firstCaste.caste] += remainingSeatsToDistribute
            console.log(`Debug - Added ${remainingSeatsToDistribute} remaining seats to ${firstCaste.caste}`)
          }
        }
      }
  
      // Step 5: Calculate EWS and All India seats for the branch
      const ewsSeatsForBranch = ewsSeats && ewsSeats > 0 
        ? Math.round((Number(ewsSeats) * Number(branch.seat_allocation_weight)) / totalWeight) 
        : 0
      
      const allIndiaSeatsForBranch = allIndiaSeats && allIndiaSeats > 0
        ? Math.round((Number(allIndiaSeats) * Number(branch.seat_allocation_weight)) / totalWeight)
        : 0
  
      newBranchAllocations[branch.branch] = {
        ewsSeats: ewsSeatsForBranch,
        allIndiaSeats: allIndiaSeatsForBranch,
      }
      
      console.log(`Debug - Branch ${branch.branch} allocations:`, newBranchAllocations[branch.branch])
    })
  
    console.log('Debug - Final matrix:', newMatrix)
    console.log('Debug - Final branch allocations:', newBranchAllocations)
  
    setMatrix(newMatrix)
    setBranchAllocations(newBranchAllocations)
    
    toast({
      title: "Success",
      description: "Seat matrix calculated successfully!",
      variant: "default",
    })
  } 

  const handleMatrixChange = (branch: string, caste: string, value: string) => {
    const newMatrix = { ...matrix }
    const parsedValue = parseInt(value) || 0
    newMatrix[branch][caste] = parsedValue
    setMatrix(newMatrix)

    const newTotalSeats = Object.values(newMatrix).reduce((sum, branchSeats) => {
      return sum + Object.values(branchSeats).reduce((bSum, val) => bSum + val, 0)
    }, 0)
    setTotalSeats(newTotalSeats)
  }

  const handleMergedSeatsChange = (branch: string, mergedName: string, value: string) => {
    const parsedValue = parseInt(value) || 0
    const castesInGroup = mergedCastes[branch][mergedName]
    const seatsPerCaste = Math.floor(parsedValue / castesInGroup.length)
    const remainder = parsedValue % castesInGroup.length

    const newMatrix = { ...matrix }
    castesInGroup.forEach((caste: string, index: number) => {
      newMatrix[branch][caste] = seatsPerCaste + (index < remainder ? 1 : 0)
    })
    setMatrix(newMatrix)

    const newTotalSeats = Object.values(newMatrix).reduce((sum, branchSeats) => {
      return sum + Object.values(branchSeats).reduce((bSum, val) => bSum + val, 0)
    }, 0)
    setTotalSeats(newTotalSeats)
  }

  const handleBranchAllocationChange = (branch: string, field: "ewsSeats" | "allIndiaSeats", value: string) => {
    const parsedValue = parseInt(value) || 0
    const newAllocations = { ...branchAllocations }
    newAllocations[branch] = {
      ...newAllocations[branch],
      [field]: parsedValue,
    }
    setBranchAllocations(newAllocations)

    if (field === "ewsSeats") {
      const newEwsSeats = Object.values(newAllocations).reduce((sum, alloc) => sum + alloc.ewsSeats, 0)
      setEwsSeats(newEwsSeats)
    } else {
      const newAllIndiaSeats = Object.values(newAllocations).reduce((sum, alloc) => sum + alloc.allIndiaSeats, 0)
      setAllIndiaSeats(newAllIndiaSeats)
    }
  }

  const calculateBranchTotal = (branch: string) => {
    if (!matrix[branch]) return 0
    return Object.values(matrix[branch]).reduce((sum, val) => sum + val, 0)
  }

  const getMergedSeatsBreakdown = (branch: string, mergedName: string) => {
    const castesInGroup = mergedCastes[branch][mergedName]
    const seats = castesInGroup.map(caste => matrix[branch][caste] || 0)
    const total = seats.reduce((sum, val) => sum + val, 0)
    return `${total} (${seats.join("+")})`
  }

  const handleConfirm = async () => {
    try {
      const updatedBranchSeats: { [branch: string]: { [caste: string]: number | { [key: string]: string[] } } } = {}
      branches.forEach(branch => {
        updatedBranchSeats[branch.branch] = { ...matrix[branch.branch] }
        if (branch.branch in mergedCastes) {
          Object.keys(mergedCastes[branch.branch]).forEach(mergedName => {
            const castesInGroup = mergedCastes[branch.branch][mergedName]
            const totalSeatsForMerged = castesInGroup.reduce((sum, caste) => sum + (matrix[branch.branch][caste] || 0), 0)
            updatedBranchSeats[branch.branch][mergedName] = totalSeatsForMerged
            castesInGroup.forEach(caste => {
              delete updatedBranchSeats[branch.branch][caste]
            })
          })
          updatedBranchSeats[branch.branch]["common"] = mergedCastes[branch.branch]
        }
      })

      const data = {
        year: className,
        gender,
        total_seats: totalSeats,
        ews_seats: ewsSeats,
        all_india_seats: allIndiaSeats,
        branch_seats: updatedBranchSeats,
        reserved_seats: {
          goi_jk_seats: goiJkSeats,
          nri_fn_pio_gulf_seats: nriSeats,
        },
      }
      await api.post("/adminrole/seat-matrix/", data)
      toast({
        title: "Success",
        description: "Seat matrix saved successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error saving seat matrix:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save seat matrix. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleCasteSelection = (caste: string) => {
    setSelectedCastes(prev =>
      prev.includes(caste) ? prev.filter(c => c !== caste) : [...prev, caste]
    )
  }

  const toggleBranchSelection = (branch: string) => {
    setSelectedBranches(prev =>
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    )
  }

  const handleCasteEditSave = async () => {
    const totalPercentage = castes.reduce((sum, c) => sum + c.seat_matrix_percentage, 0)
    if (totalPercentage !== 100) {
      toast({
        title: "Error",
        description: "Total percentage must be 100%",
        variant: "destructive",
      })
      return
    }
    try {
      await Promise.all(
        castes.map(caste =>
          api.put(`/auth/castes/${caste.caste}/?year=${className}`, { seat_matrix_percentage: caste.seat_matrix_percentage })
        )
      )
      setIsEditingCastes(false)
      toast({
        title: "Success",
        description: "Castes updated successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error updating castes:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update castes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCasteDelete = async () => {
    if (selectedCastes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one caste to delete.",
        variant: "destructive",
      })
      return
    }
    try {
      await Promise.all(selectedCastes.map(caste => api.delete(`/auth/castes/${caste}/?year=${className}`)))
      setCastes(castes.filter(c => !selectedCastes.includes(c.caste)))
      setSelectedCastes([])
      toast({
        title: "Success",
        description: "Selected castes deleted successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error deleting castes:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete castes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddCaste = async () => {
    if (!newCasteName || newCastePercentage <= 0) {
      toast({
        title: "Error",
        description: "Please provide a valid caste name and percentage.",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await api.post("/auth/castes/", {
        caste: newCasteName,
        year: className,
        seat_matrix_percentage: newCastePercentage,
      })
      setCastes([...castes, response.data])
      setNewCasteName("")
      setNewCastePercentage(0)
      toast({
        title: "Success",
        description: "Caste added successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error adding caste:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add caste. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBranchEditSave = async () => {
    try {
      await Promise.all(
        branches.map(branch =>
          api.put(`/auth/branches/${branch.branch}/?year=${className}`, { seat_allocation_weight: branch.seat_allocation_weight })
        )
      )
      setIsEditingBranches(false)
      toast({
        title: "Success",
        description: "Branches updated successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error updating branches:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update branches. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBranchDelete = async () => {
    if (selectedBranches.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one branch to delete.",
        variant: "destructive",
      })
      return
    }
    try {
      await Promise.all(selectedBranches.map(branch => api.delete(`/auth/branches/${branch}/?year=${className}`)))
      setBranches(branches.filter(b => !selectedBranches.includes(b.branch)))
      setSelectedBranches([])
      toast({
        title: "Success",
        description: "Selected branches deleted successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error deleting branches:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete branches. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddBranch = async () => {
    if (!newBranchName || newBranchWeight <= 0) {
      toast({
        title: "Error",
        description: "Please provide a valid branch name and weight.",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await api.post("/auth/branches/", {
        branch: newBranchName,
        year: className,
        seat_allocation_weight: newBranchWeight,
      })
      setBranches([...branches, response.data])
      setNewBranchName("")
      setNewBranchWeight(1)
      toast({
        title: "Success",
        description: "Branch added successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error adding branch:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add branch. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCastePercentageChange = (caste: string, value: string) => {
    setCastes(castes.map(c => c.caste === caste ? { ...c, seat_matrix_percentage: parseFloat(value) || 0 } : c))
  }

  const handleBranchWeightChange = (branch: string, value: string) => {
    const parsedValue = parseFloat(value)
    const newWeight = isNaN(parsedValue) || parsedValue <= 0 ? 0.01 : parsedValue
    setBranches(branches.map(b => b.branch === branch ? { ...b, seat_allocation_weight: newWeight } : b))
  }

  const handleMergeCastes = () => {
    if (!mergeModalBranch || mergeModalCastes.length < 2) {
      toast({
        title: "Error",
        description: "Please select a branch and at least two castes to merge.",
        variant: "destructive",
      })
      return
    }
    const mergedName = mergeModalCastes.join("-")
    setMergedCastes(prev => ({
      ...prev,
      [mergeModalBranch]: {
        ...prev[mergeModalBranch],
        [mergedName]: mergeModalCastes,
      },
    }))
    setMergeModalOpen(false)
    setMergeModalBranch("")
    setMergeModalCastes([])
    toast({
      title: "Success",
      description: `Merged castes ${mergedName} for ${mergeModalBranch}.`,
      variant: "default",
    })
  }

  const handleUnmergeCastes = (branch: string, mergedName: string) => {
    setMergedCastes(prev => {
      const newMerged = { ...prev }
      delete newMerged[branch][mergedName]
      if (Object.keys(newMerged[branch]).length === 0) {
        delete newMerged[branch]
      }
      return newMerged
    })
    toast({
      title: "Success",
      description: `Unmerged ${mergedName} for ${branch}.`,
      variant: "default",
    })
  }

  const getAvailableCastesForMerge = (branch: string) => {
    const branchMergedCastes = mergedCastes[branch] || {}
    const mergedCasteList = Object.values(branchMergedCastes).flat()
    return castes.filter(caste => !mergedCasteList.includes(caste.caste))
  }

  const isCasteMergedForBranch = (branch: string, caste: string) => {
    const branchMergedCastes = mergedCastes[branch] || {}
    return Object.values(branchMergedCastes).some(group => group.includes(caste))
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="space-y-6 p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h1 className="text-2xl font-bold">Seat Matrix Management</h1>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 w-full lg:w-auto">
            <span className="text-sm text-gray-500">Academic Year 2024-25</span>
            <span className="text-sm text-blue-600 flex items-center">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Currently viewing: {classOptions.find((y) => y.value === className)?.label} - {gender}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Seat Matrix Section */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>Seat Matrix Configuration</CardTitle>
                <CardDescription>
                  Configure the seat matrix for {classOptions.find((y) => y.value === className)?.label} - {gender}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    <div className="w-full lg:w-64">
                      <label className="text-sm font-medium mb-1 block">Select Year</label>
                      <Select value={className} onValueChange={setClassName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {classOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full lg:w-64">
                      <label className="text-sm font-medium mb-1 block">Select Gender</label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Total Seats</label>
                      <Input
                        type="number"
                        value={totalSeats}
                        onChange={(e) => setTotalSeats(parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">EWS Seats</label>
                      <Input
                        type="number"
                        value={ewsSeats}
                        onChange={(e) => setEwsSeats(parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">All India Seats</label>
                      <Input
                        type="number"
                        value={allIndiaSeats}
                        onChange={(e) => setAllIndiaSeats(parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">GOI & J&K Seats</label>
                      <Input
                        type="number"
                        value={goiJkSeats}
                        onChange={(e) => setGoiJkSeats(parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">NRI/FN/PIO/Gulf Seats</label>
                      <Input
                        type="number"
                        value={nriSeats}
                        onChange={(e) => setNriSeats(parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Button onClick={calculateMatrix} className="bg-blue-600 hover:bg-blue-700">
                    Calculate Matrix
                  </Button>

                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : Object.keys(matrix).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No seat matrix configured. Click "Calculate Matrix" to generate.
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          onClick={() => setMergeModalOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Merge Castes
                        </Button>
                      </div>

                      <div className="overflow-x-auto mx-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Branch</TableHead>
                              {castes.map(caste => (
                                <TableHead key={caste.caste}>
                                  {caste.caste} ({caste.seat_matrix_percentage}%)
                                </TableHead>
                              ))}
                              <TableHead>Total</TableHead>
                              <TableHead>EWS</TableHead>
                              <TableHead>All India</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {branches.map(branch => (
                              <TableRow key={branch.branch}>
                                <TableCell className="font-medium">{branch.branch}</TableCell>
                                {castes.map(caste => (
                                  <TableCell key={caste.caste}>
                                    {isCasteMergedForBranch(branch.branch, caste.caste) ? (
                                      <span>-</span>
                                    ) : (
                                      <Input
                                        type="number"
                                        value={matrix[branch.branch]?.[caste.caste] || 0}
                                        onChange={(e) => handleMatrixChange(branch.branch, caste.caste, e.target.value)}
                                        className="w-16"
                                      />
                                    )}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  {calculateBranchTotal(branch.branch)}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={branchAllocations[branch.branch]?.ewsSeats || 0}
                                    onChange={(e) => handleBranchAllocationChange(branch.branch, "ewsSeats", e.target.value)}
                                    className="w-16"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={branchAllocations[branch.branch]?.allIndiaSeats || 0}
                                    onChange={(e) => handleBranchAllocationChange(branch.branch, "allIndiaSeats", e.target.value)}
                                    className="w-16"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="font-bold">Total</TableCell>
                              {castes.map(caste => (
                                <TableCell key={caste.caste} className="font-bold">
                                  {Object.values(matrix).reduce(
                                    (sum, branchSeats) => sum + (branchSeats[caste.caste] || 0),
                                    0
                                  )}
                                </TableCell>
                              ))}
                              <TableCell className="font-bold">{totalSeats}</TableCell>
                              <TableCell className="font-bold">{ewsSeats}</TableCell>
                              <TableCell className="font-bold">{allIndiaSeats}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* Merged Castes Table */}
                      {Object.keys(mergedCastes).length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-2 text-center">Merged Castes</h3>
                          <div className="overflow-x-auto mx-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Branch</TableHead>
                                  <TableHead>Merged Caste Name</TableHead>
                                  <TableHead>Total Percentage</TableHead>
                                  <TableHead>Seats</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.keys(mergedCastes).flatMap(branch =>
                                  Object.keys(mergedCastes[branch]).map(mergedName => {
                                    const castesInGroup = mergedCastes[branch][mergedName]
                                    const totalPercentage = castes
                                      .filter(c => castesInGroup.includes(c.caste))
                                      .reduce((sum, c) => sum + c.seat_matrix_percentage, 0)
                                    const totalSeats = castesInGroup.reduce(
                                      (sum, caste) => sum + (matrix[branch][caste] || 0),
                                      0
                                    )
                                    return (
                                      <TableRow key={`${branch}-${mergedName}`}>
                                        <TableCell>{branch}</TableCell>
                                        <TableCell>{mergedName}</TableCell>
                                        <TableCell>{totalPercentage}%</TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="number"
                                              value={totalSeats}
                                              onChange={(e) => handleMergedSeatsChange(branch, mergedName, e.target.value)}
                                              className="w-16"
                                            />
                                            <span>{`(${castesInGroup.map(caste => matrix[branch][caste] || 0).join("+")})`}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUnmergeCastes(branch, mergedName)}
                                          >
                                            Unmerge
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {Object.keys(matrix).length > 0 && (
                    <div className="flex justify-center mt-4">
                      <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                        Confirm and Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Caste and Branch Management */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            {/* Caste Management */}
            <Card>
              <CardHeader>
                <CardTitle>Manage Castes</CardTitle>
                <CardDescription>Edit castes and their percentages</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedCastes.length === castes.length && castes.length > 0}
                          onChange={() =>
                            setSelectedCastes(
                              selectedCastes.length === castes.length ? [] : castes.map(c => c.caste)
                            )
                          }
                        />
                      </TableHead>
                      <TableHead>Caste</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {castes.map(caste => (
                      <TableRow key={caste.caste}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCastes.includes(caste.caste)}
                            onChange={() => toggleCasteSelection(caste.caste)}
                          />
                        </TableCell>
                        <TableCell>{caste.caste}</TableCell>
                        <TableCell>
                          {isEditingCastes ? (
                            <Input
                              type="number"
                              value={caste.seat_matrix_percentage}
                              onChange={(e) => handleCastePercentageChange(caste.caste, e.target.value)}
                              className="w-16"
                            />
                          ) : (
                            caste.seat_matrix_percentage
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isEditingCastes ? (
                    <Button onClick={handleCasteEditSave} className="bg-blue-600 hover:bg-blue-700">
                      Save
                    </Button>
                  ) : (
                    <Button onClick={() => setIsEditingCastes(true)} className="bg-blue-600 hover:bg-blue-700">
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={handleCasteDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={selectedCastes.length === 0}
                  >
                    Delete Selected
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Add New Caste</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Caste Name"
                      value={newCasteName}
                      onChange={(e) => setNewCasteName(e.target.value)}
                      className="w-full sm:w-32"
                    />
                    <Input
                      type="number"
                      placeholder="Percentage"
                      value={newCastePercentage}
                      onChange={(e) => setNewCastePercentage(parseFloat(e.target.value) || 0)}
                      className="w-full sm:w-20"
                    />
                    <Button onClick={handleAddCaste} className="bg-green-600 hover:bg-green-700">
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branch Management */}
            <Card>
              <CardHeader>
                <CardTitle>Manage Branches</CardTitle>
                <CardDescription>Edit branches and their weights</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedBranches.length === branches.length && branches.length > 0}
                          onChange={() =>
                            setSelectedBranches(
                              selectedBranches.length === branches.length ? [] : branches.map(b => b.branch)
                            )
                          }
                        />
                      </TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map(branch => (
                      <TableRow key={branch.branch}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(branch.branch)}
                            onChange={() => toggleBranchSelection(branch.branch)}
                          />
                        </TableCell>
                        <TableCell>{branch.branch}</TableCell>
                        <TableCell>
                          {isEditingBranches ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={branch.seat_allocation_weight}
                              onChange={(e) => handleBranchWeightChange(branch.branch, e.target.value)}
                              className="w-16"
                            />
                          ) : (
                            branch.seat_allocation_weight
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isEditingBranches ? (
                    <Button onClick={handleBranchEditSave} className="bg-blue-600 hover:bg-blue-700">
                      Save
                    </Button>
                  ) : (
                    <Button onClick={() => setIsEditingBranches(true)} className="bg-blue-600 hover:bg-blue-700">
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={handleBranchDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={selectedBranches.length === 0}
                  >
                    Delete Selected
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Add New Branch</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Branch Name"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="w-full sm:w-32"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Weight"
                      value={newBranchWeight}
                      onChange={(e) => {
                        const parsedValue = parseFloat(e.target.value)
                        const newWeight = isNaN(parsedValue) || parsedValue <= 0 ? 0.01 : parsedValue
                        setNewBranchWeight(newWeight)
                      }}
                      className="w-full sm:w-20"
                    />
                    <Button onClick={handleAddBranch} className="bg-green-600 hover:bg-green-700">
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Merge Castes Modal */}
        {mergeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Merge Castes</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Select Branch</label>
                  <Select value={mergeModalBranch} onValueChange={setMergeModalBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.branch} value={branch.branch}>
                          {branch.branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {mergeModalBranch && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Select Castes to Merge</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {getAvailableCastesForMerge(mergeModalBranch).map(caste => (
                        <div key={caste.caste} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={mergeModalCastes.includes(caste.caste)}
                            onChange={() => {
                              setMergeModalCastes(prev =>
                                prev.includes(caste.caste)
                                  ? prev.filter(c => c !== caste.caste)
                                  : [...prev, caste.caste]
                              )
                            }}
                          />
                          <label>{caste.caste}</label>
                        </div>
                      ))}
                      {getAvailableCastesForMerge(mergeModalBranch).length === 0 && (
                        <p className="text-sm text-gray-500">All castes are already merged for this branch.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-2">
                <Button onClick={handleMergeCastes} className="bg-blue-600 hover:bg-blue-700">
                  Merge
                </Button>
                <Button
                  onClick={() => {
                    setMergeModalOpen(false)
                    setMergeModalBranch("")
                    setMergeModalCastes([])
                  }}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

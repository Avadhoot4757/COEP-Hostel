"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Users, Bed, UserCheck, Loader2, User, User2 } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

interface GenderStats {
  totalSeats: number
  registrations: number
  verified: number
  pendingVerifications: number
  status: string
}

interface YearData {
  name: string
  male: GenderStats
  female: GenderStats
}

interface DashboardData {
  yearData: {
    [key: string]: YearData
  }
  overallStats: {
    totalSeats: number
    totalRegistrations: number
    totalVerified: number
    totalPendingVerifications: number
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, loading: authLoading, checkAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      const isValid = await checkAuth()
      if (!isValid) {
        router.push("/?auth=login")
      }
    }

    if (!authLoading && !isAuthenticated) {
      verifyAuth()
    } else if (isAuthenticated) {
      const fetchDashboardData = async () => {
        try {
          setLoading(true)
          const response = await api.get("/adminrole/dashboard/")
          setData(response.data)
        } catch (error: any) {
          console.error("Error fetching dashboard data:", error)
          setError(error.response?.data?.error || "Failed to load dashboard data")
        } finally {
          setLoading(false)
        }
      }
      fetchDashboardData()
    }
  }, [authLoading, isAuthenticated, checkAuth, router])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg text-red-600">
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { yearData, overallStats } = data

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hostel Management Dashboard</h1>
        <p className="text-muted-foreground">Manage hostel allotments by year and gender</p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalSeats}</div>
            <p className="text-xs text-muted-foreground">Across all years</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">All years combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalVerified}</div>
            <p className="text-xs text-muted-foreground">Documents verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalPendingVerifications}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Year-wise Breakdown */}
      <Tabs defaultValue="first-year" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="first-year">First Year</TabsTrigger>
          <TabsTrigger value="second-year">Second Year</TabsTrigger>
          <TabsTrigger value="third-year">Third Year</TabsTrigger>
          <TabsTrigger value="final-year">Final Year</TabsTrigger>
        </TabsList>

        {Object.entries(yearData).map(([yearKey, yearInfo]) => (
          <TabsContent key={yearKey} value={yearKey} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Male Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    {yearInfo.name} - Male
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Seats</p>
                      <p className="text-2xl font-bold">{yearInfo.male.totalSeats}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Registrations</p>
                      <p className="text-2xl font-bold">{yearInfo.male.registrations}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Verified</p>
                      <p className="text-2xl font-bold">{yearInfo.male.verified}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pending Verifications</p>
                      <p className="text-2xl font-bold">{yearInfo.male.pendingVerifications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Female Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User2 className="h-5 w-5 text-pink-600" />
                    {yearInfo.name} - Female
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Seats</p>
                      <p className="text-2xl font-bold">{yearInfo.female.totalSeats}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Registrations</p>
                      <p className="text-2xl font-bold">{yearInfo.female.registrations}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Verified</p>
                      <p className="text-2xl font-bold">{yearInfo.female.verified}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pending Verifications</p>
                      <p className="text-2xl font-bold">{yearInfo.female.pendingVerifications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import api from "@/lib/api"

interface User {
  id: number
  username: string
  email: string
}

export default function WardensPage() {
  const [wardens, setWardens] = useState<User[]>([])
  const [newWarden, setNewWarden] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch wardens
  useEffect(() => {
    const fetchWardens = async () => {
      try {
        setLoading(true)
        const response = await api.get("/adminrole/wardens/")
        setWardens(response.data.data)
      } catch (err) {
        setError("Failed to fetch wardens.")
      } finally {
        setLoading(false)
      }
    }
    fetchWardens()
  }, [])

  // Handle form input
  const handleInputChange = (field: keyof typeof newWarden, value: string) => {
    setNewWarden((prev) => ({ ...prev, [field]: value }))
  }

  // Add new warden
  const handleAddWarden = async () => {
    if (!newWarden.username || !newWarden.email || !newWarden.password) {
      setError("All fields are required.")
      return
    }
    try {
      const response = await api.post("/adminrole/wardens/", {
        username: newWarden.username,
        email: newWarden.email,
        password: newWarden.password,
        type: "warden",
      })
      setWardens([...wardens, response.data.data])
      setNewWarden({ username: "", email: "", password: "" })
      setError(null)
    } catch (err) {
      setError("Failed to add warden.")
    }
  }

  // Delete warden
  const handleDeleteWarden = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/adminrole/wardens/${deleteId}/`)
      setWardens(wardens.filter((w) => w.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      setError("Failed to delete warden.")
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Wardens Management</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Warden</CardTitle>
          <CardDescription>Create a new warden account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newWarden.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newWarden.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newWarden.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </div>
            <Button onClick={handleAddWarden}>Add Warden</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warden List</CardTitle>
          <CardDescription>Manage existing wardens.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wardens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No wardens found.</TableCell>
                </TableRow>
              ) : (
                wardens.map((warden) => (
                  <TableRow key={warden.id}>
                    <TableCell>{warden.username}</TableCell>
                    <TableCell>{warden.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(warden.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this warden? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWarden}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

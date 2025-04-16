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

export default function ManagersPage() {
  const [managers, setManagers] = useState<User[]>([])
  const [newManager, setNewManager] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true)
        const response = await api.get("/adminrole/managers/")
        setManagers(response.data.data)
      } catch (err) {
        setError("Failed to fetch managers.")
      } finally {
        setLoading(false)
      }
    }
    fetchManagers()
  }, [])

  // Handle form input
  const handleInputChange = (field: keyof typeof newManager, value: string) => {
    setNewManager((prev) => ({ ...prev, [field]: value }))
  }

  // Add new manager
  const handleAddManager = async () => {
    if (!newManager.username || !newManager.email || !newManager.password) {
      setError("All fields are required.")
      return
    }
    try {
      const response = await api.post("/adminrole/managers/", {
        username: newManager.username,
        email: newManager.email,
        password: newManager.password,
        type: "manager",
      })
      setManagers([...managers, response.data.data])
      setNewManager({ username: "", email: "", password: "" })
      setError(null)
    } catch (err) {
      setError("Failed to add manager.")
    }
  }

  // Delete manager
  const handleDeleteManager = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/adminrole/managers/${deleteId}/`)
      setManagers(managers.filter((m) => m.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      setError("Failed to delete manager.")
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Managers Management</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Manager</CardTitle>
          <CardDescription>Create a new manager account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newManager.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newManager.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newManager.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </div>
            <Button onClick={handleAddManager}>Add Manager</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manager List</CardTitle>
          <CardDescription>Manage existing managers.</CardDescription>
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
              {managers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No managers found.</TableCell>
                </TableRow>
              ) : (
                managers.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell>{manager.username}</TableCell>
                    <TableCell>{manager.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(manager.id)}
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
              Are you sure you want to delete this manager? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteManager}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

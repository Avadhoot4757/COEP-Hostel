"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

const allRooms = {
  "Floor 1": [
    { id: "A01", isOccupied: false },
    { id: "A02", isOccupied: true },
    { id: "A03", isOccupied: false },
    { id: "A04", isOccupied: false },
    { id: "A05", isOccupied: false },
    { id: "A06", isOccupied: false },
    { id: "A07", isOccupied: false },
    { id: "A08", isOccupied: false },
    { id: "A09", isOccupied: true },
    { id: "A10", isOccupied: false },
  ],
  "Floor 2": [
    { id: "B01", isOccupied: true },
    { id: "B02", isOccupied: false },
    { id: "B03", isOccupied: false },
    { id: "B04", isOccupied: true },
    { id: "B05", isOccupied: false },
    { id: "B06", isOccupied: false },
    { id: "B07", isOccupied: true },
    { id: "B08", isOccupied: false },
    { id: "B09", isOccupied: false },
    { id: "B10", isOccupied: false },
  ],
  "Floor 3": [
    { id: "C01", isOccupied: false },
    { id: "C02", isOccupied: false },
    { id: "C03", isOccupied: true },
    { id: "C04", isOccupied: false },
    { id: "C05", isOccupied: false },
    { id: "C06", isOccupied: true },
    { id: "C07", isOccupied: false },
    { id: "C08", isOccupied: false },
    { id: "C09", isOccupied: true },
    { id: "C10", isOccupied: false },
  ],
  "Floor 4": [
    { id: "D01", isOccupied: false },
    { id: "D02", isOccupied: true },
    { id: "D03", isOccupied: false },
    { id: "D04", isOccupied: false },
    { id: "D05", isOccupied: true },
    { id: "D06", isOccupied: false },
    { id: "D07", isOccupied: false },
    { id: "D08", isOccupied: true },
    { id: "D09", isOccupied: false },
    { id: "D10", isOccupied: false },
  ],
};

export default function RoomsPage() {
  const [currentFloor, setCurrentFloor] = useState<keyof typeof allRooms>("Floor 1");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [currentBlock, setCurrentBlock] = useState("A Block");

  const handleRoomClick = (roomId: string) => {
    if (!preferences.includes(roomId)) {
      setPreferences([...preferences, roomId]);
    }
  };

  const removePreference = (roomId: string) => {
    setPreferences(preferences.filter(id => id !== roomId));
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Room Selection</h1>

      <div className="mb-8 p-4 border border-red-200 bg-red-50 rounded-lg flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div>
          <h2 className="font-semibold text-red-900">Group Incomplete</h2>
          <p className="text-sm text-red-700">
            You need to form a complete group of 4 students before you can select room preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hostel Layout</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Browse through hostel blocks and floors to select your preferred rooms.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <Button 
                variant={currentBlock === "A Block" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCurrentBlock("A Block")}
              >
                A Block
              </Button>
              <Button 
                variant={currentBlock === "B Block" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCurrentBlock("B Block")}
              >
                B Block
              </Button>
            </div>

            <div className="flex gap-2">
              {Object.keys(allRooms).map((floor) => (
                <Button
                  key={floor}
                  variant={currentFloor === floor ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentFloor(floor as keyof typeof allRooms)}
                >
                  {floor}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-4">
              {allRooms[currentFloor].map((room) => (
                <div
                  key={room.id}
                  onClick={() => !room.isOccupied && handleRoomClick(room.id)}
                  className={`p-4 rounded-lg text-center cursor-pointer ${
                    room.isOccupied
                      ? "border bg-gray-50 text-gray-400 cursor-not-allowed"
                      : preferences.includes(room.id)
                      ? "border-2 border-primary bg-primary/5"
                      : "border-2 border-primary hover:bg-primary/5"
                  }`}
                >
                  <div className="font-medium">{room.id}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Preferences</h2>
            <div className="space-y-2 mb-6">
              {preferences.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click on rooms to add them to your preferences
                </p>
              ) : (
                preferences.map((roomId, index) => (
                  <div 
                    key={roomId}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>
                      {index + 1}. Room {roomId}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePreference(roomId)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
            <Button className="w-full" disabled={preferences.length === 0}>
              Save Preferences
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Group</h2>
            <div className="flex gap-2 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                RK
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                AP
              </div>
              <div className="w-8 h-8 border-2 border-dashed rounded-full flex items-center justify-center text-sm text-muted-foreground">
                ?
              </div>
              <div className="w-8 h-8 border-2 border-dashed rounded-full flex items-center justify-center text-sm text-muted-foreground">
                ?
              </div>
            </div>
            <Button variant="outline" className="w-full">Manage Group</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
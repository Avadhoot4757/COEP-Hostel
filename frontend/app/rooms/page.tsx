"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Room {
  room_id: string;
  is_occupied: boolean;
  capacity: number;
}

interface Floor {
  number: number;
  name: string;
  rooms: Room[];
  hostel_map_image?: string | null;
}

interface Block {
  id: number;
  name: string;
  gender: string;
  year: string;
  floors: Floor[];
}

interface Preference {
  room_id: string;
  rank: number;
}

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export default function RoomsPage() {
  const { isAuthenticated } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlockId, setCurrentBlockId] = useState<number | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>(["RK", "AP", "?", "?"]);

  const sensors = useSensors(useSensor(PointerSensor));

  const allNonOccupiedRooms = blocks
    .flatMap(block => block.floors)
    .flatMap(floor => floor.rooms)
    .filter(room => !room.is_occupied)
    .map(room => room.room_id);

  const isPreferencesComplete = preferences.length === allNonOccupiedRooms.length;
  const isGroupComplete = groupMembers.filter(m => m !== "?").length === 4;

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsResponse, preferencesResponse] = await Promise.all([
          api.get("/allot/rooms/"),
          api.get("/allot/preferences/"),
        ]);
        setBlocks(roomsResponse.data);
        setPreferences(preferencesResponse.data.map((p: Preference) => p.room_id));

        if (roomsResponse.data.length > 0) {
          setCurrentBlockId(roomsResponse.data[0].id);
          if (roomsResponse.data[0].floors.length > 0) {
            setCurrentFloor(roomsResponse.data[0].floors[0].number);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load rooms or preferences. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const currentBlock = blocks.find(block => block.id === currentBlockId);
  const currentFloorData = currentBlock?.floors.find(floor => floor.number === currentFloor);

  const handleRoomClick = (roomId: string) => {
    if (!preferences.includes(roomId)) {
      setPreferences([...preferences, roomId]);
    }
  };

  const removePreference = (roomId: string) => {
    setPreferences(preferences.filter(id => id !== roomId));
  };

  const fillRandomly = () => {
    const remainingRooms = allNonOccupiedRooms.filter(roomId => !preferences.includes(roomId));
    const shuffledRemaining = [...remainingRooms].sort(() => Math.random() - 0.5);
    setPreferences([...preferences, ...shuffledRemaining]);
  };

  const clearPreferences = () => {
    setPreferences([]);
    setSaveError(null);
  };

  const savePreferences = async () => {
    if (!isGroupComplete) {
      setSaveError("Complete your group (4 members) before saving.");
      return;
    }
    if (!isPreferencesComplete) {
      setSaveError("Please select all rooms or use 'Fill Randomly'.");
      return;
    }

    try {
      await api.post("/allot/preferences/", { preferences });
      alert("Preferences saved successfully!");
      setSaveError(null);
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      setSaveError(err.response?.data?.preferences?.[0] || "Failed to save preferences.");
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = preferences.indexOf(active.id);
      const newIndex = preferences.indexOf(over.id);

      const newPreferences = Array.from(preferences);
      const [reorderedItem] = newPreferences.splice(oldIndex, 1);
      newPreferences.splice(newIndex, 0, reorderedItem);
      setPreferences(newPreferences);
    }
  };

  if (loading) {
    return <div className="p-8">Loading rooms...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

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
              {blocks.map(block => (
                <Button
                  key={block.id}
                  variant={currentBlockId === block.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCurrentBlockId(block.id);
                    setCurrentFloor(block.floors[0]?.number || null);
                  }}
                >
                  {block.name}
                </Button>
              ))}
            </div>

            {currentBlock && (
              <div className="flex gap-2">
                {currentBlock.floors.map(floor => (
                  <Button
                    key={floor.number}
                    variant={currentFloor === floor.number ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentFloor(floor.number)}
                  >
                    {floor.name || `Floor ${floor.number}`}
                  </Button>
                ))}
              </div>
            )}

            {currentFloorData && (
              <>
                <div className="grid grid-cols-5 gap-4">
                  {currentFloorData.rooms.map(room => (
                    <div
                      key={room.room_id}
                      onClick={() => !room.is_occupied && handleRoomClick(room.room_id)}
                      className={`p-4 rounded-lg text-center cursor-pointer ${
                        room.is_occupied
                          ? "border bg-gray-50 text-gray-400 cursor-not-allowed"
                          : preferences.includes(room.room_id)
                          ? "border-2 border-primary bg-primary/5"
                          : "border-2 border-primary hover:bg-primary/5"
                      }`}
                    >
                      <div className="font-medium">{room.room_id}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  {currentFloorData.hostel_map_image ? (
                    <Image
                      src={currentFloorData.hostel_map_image}
                      alt={`Map of ${currentFloorData.name || `Floor ${currentFloorData.number}`}`}
                      width={400}
                      height={300}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <span className="ml-2 text-gray-400">No map available</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Group</h2>
            <div className="flex gap-2 mb-4">
              {groupMembers.map((member, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    member === "?"
                      ? "border-2 border-dashed text-muted-foreground"
                      : "bg-primary/10"
                  }`}
                >
                  {member}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Preferences</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {preferences.length}/{allNonOccupiedRooms.length} rooms selected
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={preferences} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 mb-6">
                  {preferences.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Click on rooms to add them to your preferences
                    </p>
                  ) : (
                    preferences.map((roomId, index) => (
                      <SortableItem key={roomId} id={roomId}>
                        <div className="flex items-center justify-between p-2 border rounded">
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
                      </SortableItem>
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
            <div className="space-y-4">
              {!isPreferencesComplete && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={fillRandomly}
                >
                  Fill Randomly
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={clearPreferences}
              >
                Clear Preferences
              </Button>
              <Button
                className="w-full"
                disabled={!isPreferencesComplete || !isGroupComplete}
                onClick={savePreferences}
              >
                Save Preferences
              </Button>
              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

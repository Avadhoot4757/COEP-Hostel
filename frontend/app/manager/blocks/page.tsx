"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Building, Home, ChevronDown, ChevronRight, Search, Filter, UserCheck, UserX } from 'lucide-react';
import api from "@/lib/api";
import toast, { Toaster } from 'react-hot-toast';

interface Room {
  id: number;
  number: string;
  capacity: number;
  occupied: number;
  type: 'single' | 'double' | 'triple' | 'quad' | 'penta' | 'hexa' | 'multi';
}

interface Floor {
  id: number;
  number: number;
  name: string;
  gender: 'male' | 'female';
  class_name: string;
  rooms: Room[];
}

interface Block {
  id: number;
  name: string;
  type: 'male' | 'female';
  year: '1st' | '2nd' | '3rd' | '4th' | 'mtech' | 'other';
  description: string;
  totalFloors: number;
  totalRooms: number;
  occupiedRooms: number;
  floors: Floor[];
}

interface FormData {
  name: string;
  type: 'male' | 'female';
  year: '1st' | '2nd' | '3rd' | '4th' | 'mtech' | 'other';
  description: string;
  floorNumber: string;
  floorName: string;
  roomNumber: string;
  capacity: number | string;
  occupied: number | string;
  roomType: 'single' | 'double' | 'triple' | 'quad' | 'penta' | 'hexa' | 'multi';
  parentId?: number;
}

interface Stat {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const roomTypeToCapacity: Record<Room['type'], number> = {
  single: 1,
  double: 2,
  triple: 3,
  quad: 4,
  penta: 5,
  hexa: 6,
  multi: 7
};

const capacityToRoomType: Record<number, Room['type']> = {
  1: 'single',
  2: 'double',
  3: 'triple',
  4: 'quad',
  5: 'penta',
  6: 'hexa',
  7: 'multi'
};

const yearToClassName: Record<string, string> = {
  '1st': 'fy',
  '2nd': 'sy',
  '3rd': 'ty',
  '4th': 'btech',
  'mtech': 'mtech',
  'other': 'other'
};

const classNameToYear: Record<string, string> = {
  'fy': '1st',
  'sy': '2nd',
  'ty': '3rd',
  'btech': '4th',
  'mtech': 'mtech',
  'other': 'other'
};

const isBlock = (item: Block | Floor | Room): item is Block => {
  return 'type' in item && 'year' in item && 'description' in item;
};

const isFloor = (item: Block | Floor | Room): item is Floor => {
  return 'number' in item && 'class_name' in item;
};

const isRoom = (item: Block | Floor | Room): item is Room => {
  return 'capacity' in item && 'occupied' in item;
};

const HostelManagerDashboard: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'block' | 'floor' | 'room'>('block');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'male' | 'female'>('all');
  const [filterYear, setFilterYear] = useState<'all' | '1st' | '2nd' | '3rd' | '4th' | 'mtech' | 'other'>('all');
  const [editingItem, setEditingItem] = useState<Block | Floor | Room | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'male',
    year: '1st',
    description: '',
    floorNumber: '',
    floorName: '',
    roomNumber: '',
    capacity: 2,
    occupied: 0,
    roomType: 'double',
    parentId: undefined,
  });

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/allot/api/blocks/');
      const backendBlocks = response.data;

      const mappedBlocks: Block[] = backendBlocks.map((block: any) => ({
        id: block.id,
        name: block.name,
        type: !block.floors || block.floors.length === 0 ? 'male' : block.floors[0].gender,
        year: classNameToYear[block.floors?.[0]?.class_name] ?? 'other',
        description: block.description || '',
        totalFloors: block.floors.length,
        totalRooms: block.floors.reduce((acc: number, floor: any) => acc + floor.rooms.length, 0),
        occupiedRooms: block.floors.reduce((acc: number, floor: any) =>
          acc + floor.rooms.filter((room: any) => room.is_occupied).length, 0),
        floors: block.floors.map((floor: any) => ({
          id: floor.id,
          number: floor.number,
          name: floor.name || `Floor ${floor.number}`,
          gender: floor.gender || 'male',
          class_name: classNameToYear[floor.class_name] || 'other',
          rooms: floor.rooms.map((room: any) => ({
            id: room.id,
            number: room.room_id,
            capacity: block.per_room_capacity || 2,
            occupied: room.is_occupied ? block.per_room_capacity : 0,
            type: capacityToRoomType[block.per_room_capacity] || 'double',
          })),
        })),
      }));
      
      setBlocks(mappedBlocks);
      setLoading(false);
      toast.success('Data fetched successfully!');
    } catch (err) {
      console.error('Error fetching blocks:', err);
      setError('Failed to load data from the server.');
      setLoading(false);
      toast.error('Failed to load data from the server.');
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const resetForm = (): void => {
    setFormData({
      name: '',
      type: 'male',
      year: 'other',
      description: '',
      floorNumber: '',
      floorName: '',
      roomNumber: '',
      capacity: 2,
      occupied: 0,
      roomType: 'double',
      parentId: undefined,
    });
    setEditingItem(null);
  };

  const openModal = (type: 'block' | 'floor' | 'room', item: Block | Floor | Room | null = null, parentId: number | null = null): void => {
    setModalType(type);
    setEditingItem(item);
    if (item) {
      if (type === 'block' && isBlock(item)) {
        setFormData({
          name: item.name,
          type: item.type,
          year: item.year,
          description: item.description,
          floorNumber: '',
          floorName: '',
          roomNumber: '',
          capacity: 2,
          occupied: 0,
          roomType: 'double',
          parentId: undefined,
        });
      } else if (type === 'floor' && isFloor(item)) {
        setFormData({
          name: '',
          type: 'male',
          year: item.class_name as '1st' | '2nd' | '3rd' | '4th' | 'mtech' | 'other',
          description: '',
          floorNumber: item.number.toString(),
          floorName: item.name,
          roomNumber: '',
          capacity: 2,
          occupied: 0,
          roomType: 'double',
          parentId: parentId ?? undefined,
        });
      } else if (type === 'room' && isRoom(item)) {
        setFormData({
          name: '',
          type: 'male',
          year: '1st',
          description: '',
          floorNumber: '',
          floorName: '',
          roomNumber: item.number,
          capacity: item.capacity,
          occupied: item.occupied > 0 ? 'yes' : 'no',
          roomType: item.type,
          parentId: parentId ?? undefined,
        });
      }
    } else {
      resetForm();
      setFormData((prev) => ({
        ...prev,
        parentId: type === 'block' ? undefined : parentId ?? undefined,
      }));
    }
    setShowAddModal(true);
  };

  const generateRoomRange = (range: string): string[] => {
    const match = range.match(/^([A-Za-z]+)(\d+)-([A-Za-z]+)?(\d+)$/);
    if (!match) return [range];
    
    const [, prefix, startNum, endPrefix, endNum] = match;
    if (prefix !== (endPrefix || prefix)) return [range];

    const start = parseInt(startNum);
    const end = parseInt(endNum);
    if (isNaN(start) || isNaN(end) || start > end) return [range];

    const rooms: string[] = [];
    for (let i = start; i <= end; i++) {
      rooms.push(`${prefix}${i.toString().padStart(startNum.length, '0')}`);
    }
    return rooms;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      if (modalType === 'block') {
        const blockData = {
          name: formData.name,
          description: formData.description,
          gender: formData.type === 'male' ? 'male' : 'female',
          class_name: yearToClassName[formData.year],
          per_room_capacity: parseInt(formData.capacity as string),
        };
        if (editingItem) {
          await api.put(`/allot/api/blocks/${(editingItem as Block).id}/`, blockData);
          toast.success('Block updated successfully!');
        } else {
          await api.post('/allot/api/blocks/', blockData);
          toast.success('Block added successfully!');
        }
      } else if (modalType === 'floor') {
        if (!formData.parentId) {
          toast.error('Block ID is required to add a floor.');
          return;
        }
        const block = blocks.find((b) => b.id === formData.parentId);
        if (!block) {
          toast.error('Invalid block selected.');
          return;
        }
        const floorData = {
          block: formData.parentId,
          number: parseInt(formData.floorNumber),
          name: formData.floorName || `Floor ${formData.floorNumber}`,
          gender: block.type === 'male' ? 'male' : 'female',
          class_name: yearToClassName[formData.year],
        };
        if (editingItem) {
          await api.put(`/allot/api/floors/${(editingItem as Floor).id}/`, floorData);
          toast.success('Floor updated successfully!');
        } else {
          await api.post('/allot/api/floors/', floorData);
          toast.success('Floor added successfully!');
        }
      } else if (modalType === 'room') {
        if (!formData.parentId) {
          toast.error('Floor ID is required to add a room.');
          return;
        }
        const roomNumbers = generateRoomRange(formData.roomNumber);
        for (const roomNumber of roomNumbers) {
          const roomData = {
            room_id: roomNumber,
            is_occupied: formData.occupied === 'yes',
            floor: formData.parentId,
          };
          if (editingItem) {
            await api.put(`/allot/api/rooms-crud/${(editingItem as Room).id}/`, roomData);
            toast.success('Room updated successfully!');
          } else {
            await api.post('/allot/api/rooms-crud/', roomData);
            toast.success(`Room ${roomNumber} added successfully!`);
          }
        }
      }
      await fetchBlocks();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error during submit:', err);
      const errorMessage = err.response?.data?.block?.[0] || `Failed to ${editingItem ? 'update' : 'add'} ${modalType}.`;
      toast.error(errorMessage);
    }
  };

  const deleteItem = async (type: 'block' | 'floor' | 'room', id: number, parentId: number | null = null): Promise<void> => {
    try {
      if (type === 'block') {
        await api.delete(`/allot/api/blocks/${id}/`);
        toast.success('Block deleted successfully!');
      } else if (type === 'floor') {
        await api.delete(`/allot/api/floors/${id}/`);
        toast.success('Floor deleted successfully!');
      } else if (type === 'room') {
        await api.delete(`/allot/api/rooms-crud/${id}/`);
        toast.success('Room deleted successfully!');
      }
      await fetchBlocks();
    } catch (err) {
      console.error('Error during delete:', err);
      toast.error(`Failed to delete ${type}.`);
    }
  };

  const toggleBlock = (blockId: number): void => {
    setExpandedBlocks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const toggleFloor = (floorId: number): void => {
    setExpandedFloors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(floorId)) {
        newSet.delete(floorId);
      } else {
        newSet.add(floorId);
      }
      return newSet;
    });
  };

  const filteredBlocks = blocks.filter((block) => {
    const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTypeFilter = filterType === 'all' || block.type === filterType;
    const matchesYearFilter = filterYear === 'all' || block.year === filterYear;
    return matchesSearch && matchesTypeFilter && matchesYearFilter;
  });

  const getOccupancyColor = (occupied: number, capacity: number): string => {
    const ratio = occupied / capacity;
    if (ratio === 0) return 'bg-gray-100 text-gray-600';
    if (ratio < 0.7) return 'bg-green-100 text-green-700';
    if (ratio < 1) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hostel Management</h1>
              <p className="text-gray-600 mt-1">Manage blocks, floors, and rooms efficiently</p>
            </div>
            <button
              onClick={() => openModal('block')}
              className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus size={20} />
              Add Block
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {([
            { label: 'Total Blocks', value: blocks.length, icon: Building, color: 'blue' },
            { label: 'Total Rooms', value: blocks.reduce((acc, b) => acc + b.totalRooms, 0), icon: Home, color: 'green' },
            { label: 'Occupied Rooms', value: blocks.reduce((acc, b) => acc + b.occupiedRooms, 0), icon: UserCheck, color: 'yellow' },
            {
              label: 'Available Rooms',
              value: blocks.reduce((acc, b) => acc + (b.totalRooms - b.occupiedRooms), 0),
              icon: UserX,
              color: 'purple',
            },
          ] as Stat[]).map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search blocks..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as 'all' | 'male' | 'female')}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="all">All Types</option>
                <option value="male">Boys Block</option>
                <option value="female">Girls Block</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterYear}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterYear(e.target.value as 'all' | '1st' | '2nd' | '3rd' | '4th' | 'mtech' | 'other')}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="all">All Years</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
                <option value="mtech">M.Tech</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredBlocks.map((block) => (
            <div key={block.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
              <div
                className="p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-all duration-200"
                onClick={() => toggleBlock(block.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedBlocks.has(block.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-gray-900">{block.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            block.type === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                          }`}
                        >
                          {block.type === 'male' ? 'Boys Block' : 'Girls Block'}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700`}
                        >
                          {block.year} Year
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getOccupancyColor(
                            block.occupiedRooms,
                            block.totalRooms
                          )}`}
                        >
                          {block.occupiedRooms}/{block.totalRooms} Occupied
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">{block.description}</p>
                      <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building size={16} />
                          {block.floors.length} Floors
                        </span>
                        <span className="flex items-center gap-1">
                          <Home size={16} />
                          {block.floors.reduce((acc, floor) => acc + floor.rooms.length, 0)} Rooms
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {block.occupiedRooms} Occupied
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (!block.id) {
                          toast.error('Cannot add floor: No valid block selected.');
                          return;
                        }
                        openModal('floor', null, block.id);
                      }}
                      className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title="Add Floor"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        openModal('block', block);
                      }}
                      className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title="Edit Block"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        deleteItem('block', block.id);
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete Block"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {expandedBlocks.has(block.id) && (
                <div className="divide-y divide-gray-100">
                  {block.floors.map((floor) => (
                    <div key={floor.id} className="bg-gray-50">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-all duration-200"
                        onClick={() => toggleFloor(floor.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedFloors.has(floor.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          <span className="font-medium text-gray-900">
                            Floor {floor.number} {floor.name ? `- ${floor.name}` : ''}
                          </span>
                          <span className="text-sm text-gray-500">({floor.rooms.length} rooms)</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700`}
                          >
                            {floor.class_name} Year
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              openModal('room', null, floor.id);
                            }}
                            className="p-1.5 text-gray-600 hover:text-black hover:bg-white rounded-lg transition-all duration-200"
                            title="Add Room"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              openModal('floor', floor, block.id);
                            }}
                            className="p-1.5 text-gray-600 hover:text-black hover:bg-white rounded-lg transition-all duration-200"
                            title="Edit Floor"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              deleteItem('floor', floor.id, block.id);
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Floor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {expandedFloors.has(floor.id) && (
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 ml-8">
                            {floor.rooms.map((room) => (
                              <div
                                key={room.id}
                                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900">{room.number}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => openModal('room', room, floor.id)}
                                      className="p-1 text-gray-600 hover:text-black rounded transition-all duration-200"
                                      title="Edit Room"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => deleteItem('room', room.id, floor.id)}
                                      className="p-1 text-gray-600 hover:text-red-600 rounded transition-all duration-200"
                                      title="Delete Room"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium capitalize">{room.type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Capacity:</span>
                                    <span className="font-medium">{room.capacity}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Occupied:</span>
                                    <span
                                      className={`font-medium ${
                                        room.occupied > 0 ? 'text-green-600' : 'text-gray-400'
                                      }`}
                                    >
                                      {room.occupied}
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                          room.occupied === 0
                                            ? 'bg-gray-300'
                                            : room.occupied < room.capacity
                                            ? 'bg-yellow-400'
                                            : 'bg-green-400'
                                        }`}
                                        style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl p-6 w-full max-w-md transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h2>

              <div className="space-y-4">
                {modalType === 'block' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Block Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Block A - North Wing"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Block Type</label>
                      <select
                        value={formData.type}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setFormData((prev) => ({ ...prev, type: e.target.value as 'male' | 'female' }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                      >
                        <option value="male">Boys Block</option>
                        <option value="female">Girls Block</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <select
                        value={formData.year}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setFormData((prev) => ({ ...prev, year: e.target.value as '1st' | '2nd' | '3rd' | '4th' | 'mtech' | 'other' }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                      >
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                        <option value="mtech">M.Tech</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                        rows={3}
                        placeholder="Brief description of the block..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Per Room Capacity</label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const capacity = parseInt(e.target.value);
                          if (capacity >= 1 && capacity <= 6) {
                            setFormData((prev) => ({
                              ...prev,
                              capacity,
                              roomType: capacityToRoomType[capacity],
                            }));
                          } else if (capacity >= 7) {
                            setFormData((prev) => ({
                              ...prev,
                              capacity: capacity,
                              roomType: 'multi',
                            }));
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                        min="1"
                        max="20"
                        required
                      />
                    </div>
                  </>
                )}

                {modalType === 'floor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Parent Block</label>
                      <input
                        type="text"
                        value={blocks.find((b) => b.id === formData.parentId)?.name || 'No block selected'}
                        disabled
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Floor Number</label>
                      <input
                        type="number"
                        value={formData.floorNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev) => ({ ...prev, floorNumber: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 1, 2, 3..."
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Floor Name</label>
                      <input
                        type="text"
                        value={formData.floorName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev) => ({ ...prev, floorName: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Ground Floor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <select
                        value={formData.year}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setFormData((prev) => ({ ...prev, year: e.target.value as '1st' | '2nd' | '3rd' | '4th' | 'mtech' | 'other' }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                      >
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                        <option value="mtech">M.Tech</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'room' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Number(s)</label>
                      <input
                        type="text"
                        value={formData.roomNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev) => ({ ...prev, roomNumber: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                        placeholder="e.g., A101 or A101-A109"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                        <input
                          type="number"
                          value={formData.capacity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const capacity = parseInt(e.target.value);
                            if (capacity >= 1 && capacity <= 6) {
                              setFormData((prev) => ({
                                ...prev,
                                capacity,
                                roomType: capacityToRoomType[capacity],
                                occupied: prev.occupied === 'yes' ? 'yes' : 'no',
                              }));
                            } else if (capacity >= 7) {
                              setFormData((prev) => ({
                                ...prev,
                                capacity: capacity,
                                roomType: 'multi',
                                occupied: prev.occupied === 'yes' ? 'yes' : 'no',
                              }));
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                          min="1"
                          max="20"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currently Occupied</label>
                        <select
                          value={formData.occupied}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setFormData((prev) => ({
                              ...prev,
                              occupied: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                      <select
                        value={formData.roomType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const roomType = e.target.value as Room['type'];
                          setFormData((prev) => ({
                            ...prev,
                            roomType,
                            capacity: roomTypeToCapacity[roomType],
                            occupied: prev.occupied === 'yes' ? 'yes' : 'no',
                          }));
                        }}
                        className="w-full max-w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 appearance-none bg-white"
                      >
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="triple">Triple</option>
                        <option value="quad">Quad</option>
                        <option value="penta">Penta</option>
                        <option value="hexa">Hexa</option>
                        <option value="multi">Multi</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalType === 'floor' && !formData.parentId}
                    className={`flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 ${
                      modalType === 'floor' && !formData.parentId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800'
                    }`}
                  >
                    {editingItem ? 'Update' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostelManagerDashboard;
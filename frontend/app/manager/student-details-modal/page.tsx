"use client";

import { useState } from "react";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StudentDetailsPage() {
  const [rollNo, setRollNo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (rollNo.trim()) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRollNo("");
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">View Student Details</h1>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Enter Roll Number"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
        />
        <Button onClick={handleOpenModal} disabled={!rollNo.trim()}>
          View Details
        </Button>
      </div>
      <StudentDetailsModal
        rollNo={rollNo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

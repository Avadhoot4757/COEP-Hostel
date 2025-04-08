"use client";

import { useEffect, useRef } from 'react';
import { Wifi, DumbbellIcon, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import useIntersectionObserver from "@/hooks/useIntersectionObserver";

export default function Amenities() {
  const amenities = [
    {
      icon: <Wifi className="h-12 w-12 text-[#ff3333] mb-4" />,
      title: "High-Speed WiFi",
      description: "24/7 internet connectivity throughout the campus with dedicated bandwidth for each student.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80"
    },
    {
      icon: <DumbbellIcon className="h-12 w-12 text-[#ff3333] mb-4" />,
      title: "Modern Gym",
      description: "State-of-the-art fitness equipment with professional trainers available for guidance.",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80"
    },
    {
      icon: <Clock className="h-12 w-12 text-[#ff3333] mb-4" />,
      title: "Study Rooms",
      description: "Quiet, well-lit study spaces available 24/7 with modern facilities and comfortable seating.",
      image: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80"
    }
  ];

  useIntersectionObserver('.amenity-content, .amenity-image-container');

  return (
    <section className="amenities-section">
      {amenities.map((amenity, index) => (
        <div key={index} className="amenity-container max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="amenity-content">
            <Card className="bg-white/80 border-gray-200 shadow-lg backdrop-blur-sm">
              <CardContent>
                {amenity.icon}
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{amenity.title}</h3>
                <p className="text-gray-600">{amenity.description}</p>
              </CardContent>
            </Card>
          </div>
          <div className="amenity-image-container">
            <img 
              src={amenity.image} 
              alt={amenity.title}
              className="amenity-image"
            />
          </div>
        </div>
      ))}
    </section>
  );
}
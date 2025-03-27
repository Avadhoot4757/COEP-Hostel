"use client";

import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Shield, Utensils, DumbbellIcon, BookOpen, Wifi, Clock, Download } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

export default function Home() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '-50px'
    });

    const contentElements = document.querySelectorAll('.amenity-content');
    const imageContainers = document.querySelectorAll('.amenity-image-container');

    contentElements.forEach(element => {
      observerRef.current?.observe(element);
    });

    imageContainers.forEach(element => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

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

  return (
    <main className="min-h-screen bg-black/95">
      {/* Header/Navigation - Transparent */}
      <nav className="fixed top-0 w-full bg-transparent backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-[#ff3333]" />
              <span className="ml-2 text-xl font-bold text-white">COEP Hostel</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-300 hover:text-white">Home</a>
              <a href="#" className="text-gray-300 hover:text-white">Facilities</a>
              <a href="#" className="text-gray-300 hover:text-white">Fees</a>
              <a href="#" className="text-gray-300 hover:text-white">Rules</a>
              <a href="#" className="text-gray-300 hover:text-white">Gallery</a>
              <a href="#" className="text-gray-300 hover:text-white">Contact</a>
              <Button variant="outline" className="border-[#ff3333] text-white hover:bg-[#ff3333]">
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative h-screen bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80')"
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">COEP Hostel</h1>
            <p className="text-xl md:text-2xl mb-8">A Home Away from Home</p>
            <p className="text-lg md:text-xl mb-8 max-w-2xl">
              Affordable, Secure, and Comfortable Student Living
            </p>
            <Button className="bg-[#ff3333] hover:bg-[#cc0000] text-white px-8 py-6 text-lg">
              Apply Now
            </Button>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-20 bg-black/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />
              <h3 className="text-3xl font-bold mb-2 text-white">1200+</h3>
              <p className="text-gray-400">Residents</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />
              <h3 className="text-3xl font-bold mb-2 text-white">24/7</h3>
              <p className="text-gray-400">Security</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6 text-center">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />
              <h3 className="text-3xl font-bold mb-2 text-white">3</h3>
              <p className="text-gray-400">Dining Halls</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />
              <h3 className="text-3xl font-bold mb-2 text-white">5+</h3>
              <p className="text-gray-400">Study Spaces</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Amenities Section with Enhanced Parallax */}
      <section className="amenities-section">
        {amenities.map((amenity, index) => (
          <div key={index} className="amenity-container max-w-7xl mx-auto px-4">
            <div className="amenity-content">
              <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-sm">
                <CardContent>
                  {amenity.icon}
                  <h3 className="text-2xl font-bold mb-4 text-white">{amenity.title}</h3>
                  <p className="text-gray-400">{amenity.description}</p>
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

      {/* Testimonials */}
      <section className="py-20 bg-black/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">What Our Residents Say</h2>
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {[
                {
                  text: "The mess food is decent, and the study spaces are great! The environment really helps me focus on my academics.",
                  author: "Arush Kandare, 3rd Year"
                },
                {
                  text: "Security is strict but ensures our safety. The facilities are well-maintained and the staff is helpful.",
                  author: "Aditi Patil, 2nd Year"
                },
                {
                  text: "Living in COEP hostel has been a wonderful experience. It truly feels like a home away from home.",
                  author: "Adhiraj Ghadge, 4th Year"
                }
              ].map((testimonial, index) => (
                <CarouselItem key={index}>
                  <Card className="bg-gray-900/50 border-gray-800 p-8">
                    <CardContent>
                      <p className="text-lg italic mb-4 text-gray-300">{testimonial.text}</p>
                      <p className="text-[#ff3333] font-semibold">{testimonial.author}</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-20 bg-black/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Hostel Rules & Guidelines</h2>
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-300">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>Entry/Exit timings strictly followed for security</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>Visitors allowed only in designated areas</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>Mandatory mess attendance during meal times</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>Zero tolerance for ragging and misconduct</span>
                  </li>
                </ul>
                <Button className="mt-6 w-full bg-gray-800 hover:bg-gray-700 text-white">
                  <Download className="mr-2 h-4 w-4" /> Download Complete Rulebook
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Contact Us</h3>
              <p>COEP Hostel</p>
              <p>College Road, Pune</p>
              <p>Maharashtra - 411005</p>
              <p className="mt-2">Phone: +91 1234567890</p>
              <p>Email: hostel@coep.ac.in</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Admission Process</a></li>
                <li><a href="#" className="hover:text-white">Fee Structure</a></li>
                <li><a href="#" className="hover:text-white">Facilities</a></li>
                <li><a href="#" className="hover:text-white">Rules & Regulations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white">Instagram</a>
                <a href="#" className="hover:text-white">Facebook</a>
                <a href="#" className="hover:text-white">Twitter</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© 2025 COEP Hostel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
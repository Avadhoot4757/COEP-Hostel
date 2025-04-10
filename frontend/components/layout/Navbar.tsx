"use client";

import { useState } from 'react';
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onRegisterClick: () => void;
  onLoginClick: () => void; // Add this
}

export default function Navbar({ onRegisterClick, onLoginClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/10 backdrop-blur-sm z-50 shadow-lg">
      <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-[#ff3333]" />
            <span className="ml-2 text-xl font-bold text-gray-900">COEP Hostel</span>
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-900 hover:text-[#ff3333] transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            {['Home', 'Facilities', 'Fees', 'Rules', 'Gallery', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-gray-900 hover:text-[#ff3333] transition-colors duration-200 font-medium
                         relative after:content-[''] after:absolute after:w-full after:h-0.5
                         after:bg-[#ff3333] after:left-0 after:-bottom-1 after:scale-x-0
                         hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                {item}
              </a>
            ))}
            <Button
              onClick={onRegisterClick}
              className="bg-[#ff3333] hover:bg-[#cc0000] text-white"
            >
              Register
            </Button>
            <Button
              onClick={onLoginClick}
              className="bg-[#ff3333] hover:bg-[#cc0000] text-white"
            >
              Login
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-100 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="py-4 space-y-4">
            {['Home', 'Facilities', 'Fees', 'Rules', 'Gallery', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="block text-gray-900 hover:text-[#ff3333] transition-colors duration-200 font-medium py-2"
              >
                {item}
              </a>
            ))}
            <Button
              onClick={() => {
                onRegisterClick();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#ff3333] hover:bg-[#cc0000] text-white"
            >
              Register
            </Button>
            <Button
              onClick={() => {
                onLoginClick();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#ff3333] hover:bg-[#cc0000] text-white"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
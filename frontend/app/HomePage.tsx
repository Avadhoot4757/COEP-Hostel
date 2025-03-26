"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Home, 
  FileText, 
  Contact, 
  Building, 
  Menu, 
  X 
} from 'lucide-react';

// Responsive Navbar Component
const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <img 
              src="/brand-white.svg" 
              alt="Logo" 
              className="h-10 w-10 mr-3 scale-125"
            />
            <span className="text-xl font-bold hidden md:block">COEP Hostel Admission</span>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu} 
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            <Link href="/" className="flex items-center hover:bg-blue-700 px-3 py-2 rounded">
              <Home className="mr-2" size={20} /> Home
            </Link>
            <Link href="/eligibility" className="flex items-center hover:bg-blue-700 px-3 py-2 rounded">
              <FileText className="mr-2" size={20} /> Eligibility
            </Link>
            <Link href="/hostel-rules" className="flex items-center hover:bg-blue-700 px-3 py-2 rounded">
              <Building className="mr-2" size={20} /> Hostel Rules
            </Link>
            <Link href="/application" className="flex items-center hover:bg-blue-700 px-3 py-2 rounded">
              <Contact className="mr-2" size={20} /> Apply Now
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link 
                href="/" 
                className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md"
                onClick={toggleMenu}
              >
                Home
              </Link>
              <Link 
                href="/eligibility" 
                className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md"
                onClick={toggleMenu}
              >
                Eligibility
              </Link>
              <Link 
                href="/hostel-rules" 
                className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md"
                onClick={toggleMenu}
              >
                Hostel Rules
              </Link>
              <Link 
                href="/application" 
                className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md"
                onClick={toggleMenu}
              >
                Apply Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Hero Section (Server Component)
const HeroSection = () => {
  return (
    <div className="relative bg-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-gray-100 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="block xl:inline">COEP University</span>{' '}
                <span className="block text-blue-600 xl:inline">Hostel Admission</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Discover comfortable, convenient, and supportive living spaces designed to enhance your academic journey.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link 
                    href="/application" 
                    className="w-full flex items-center justify-center px-6 py-3 md:px-8 md:py-4 border border-transparent text-base md:text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Apply for Hostel
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img 
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" 
          src="/images/coep-hostel2.jpg" 
          alt="Stanford Campus" 
        />
      </div>
    </div>
  );
};

// Footer (Server Component)
const Footer = () => {
  return (
    <footer className="bg-blue-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <p className="text-sm text-blue-200">
              Housing Office, COEP University<br />
              Email: housing@coep.edu<br />
              Phone: (650) 123-4567
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/application", label: "Application Portal" },
                { href: "/eligibility", label: "Eligibility" },
                { href: "/hostel-rules", label: "Hostel Rules" }
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Office Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Office Hours</h3>
            <p className="text-sm text-blue-200">
              Monday - Friday: 9:00 AM - 5:00 PM<br />
              Saturday: 10:00 AM - 2:00 PM<br />
              Sunday: Closed
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-blue-700 text-center">
          <p className="text-sm text-blue-200">
            © {new Date().getFullYear()} COEP Tech University. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Home Page Component (Client Component)
const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <QuickLinks />
      </main>
      <Footer />
    </div>
  );
};

// Quick Links (Client Component)
const QuickLinks: React.FC = () => {
  return (
    <div className="bg-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Quick Access</h2>
          <p className="mt-2 text-2xl md:text-3xl leading-8 font-extrabold tracking-tight text-gray-900">
            Important Information
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 text-white p-3 rounded-full mr-4">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Eligibility Criteria</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Understand the requirements for hostel admission at Stanford University.
              </p>
              <Link 
                href="/eligibility" 
                className="text-blue-600 hover:underline flex items-center"
              >
                View Details <FileText className="ml-2" size={16} />
              </Link>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 text-white p-3 rounded-full mr-4">
                  <Building size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Hostel Rules</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Review comprehensive guidelines for living in Stanford University hostels.
              </p>
              <Link 
                href="/hostel-rules" 
                className="text-blue-600 hover:underline flex items-center"
              >
                View Regulations <Building className="ml-2" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
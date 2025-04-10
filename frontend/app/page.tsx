"use client";

import { useState } from 'react';
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { particlesConfig } from "@/utils/particles-config";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import Amenities from "@/components/home/Amenities";
import Testimonials from "@/components/home/Testimonials";
import Rules from "@/components/home/Rules";
import AuthModal from "@/components/auth/AuthModal";
import { Engine } from 'tsparticles-engine';

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Change this to true

  const particlesInit = async (engine:Engine) => {
    try {
      await loadFull(engine);
    } catch (error) {
      console.error("Error initializing particles:", error);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="fixed inset-0 z-0">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={particlesConfig}
        />
      </div>

      {showAuth && (
        <AuthModal 
          isLogin={isLogin} 
          setIsLogin={setIsLogin} 
          onClose={() => setShowAuth(false)} 
        />
      )}

      <Navbar 
        onRegisterClick={() => {
          setIsLogin(false);
          setShowAuth(true);
        }}
        onLoginClick={() => {  // Add this prop
          setIsLogin(true);
          setShowAuth(true);
        }}
      />

      <Hero 
        onApplyClick={() => {
          setIsLogin(false);
          setShowAuth(true);
        }}
      />

      <Stats />
      <Amenities />
      <Testimonials />
      <Rules />
      <Footer />
    </main>
  );
}
"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Shield, Utensils, DumbbellIcon, BookOpen, Wifi, Clock, Download, X, Menu } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Particles from "react-tsparticles";
import { Engine } from "tsparticles-engine";
import { loadFull } from "tsparticles";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [otpField, setOtpField] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Add this new state for tracking errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Make sure Particles initialization is properly handled
  const particlesInit = useCallback(async (engine: Engine) => {
    try {
      await loadFull(engine);
    } catch (error) {
      console.error("Error initializing particles:", error);
    }
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting || !entry.isIntersecting) {
          const element = entry.target;
          const isVisible = entry.isIntersecting;
          
          element.classList.remove('visible');
          
          if (isVisible) {
            setTimeout(() => {
              element.classList.add('visible');
            }, 100);
          }
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

  // Update your form submission function with better error handling
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newErrors: Record<string, string> = {};
    
    // Validate fields based on login or register mode
    if (!isLogin) {
      // Email validation (only for registration)
      const email = formData.get('email') as string;
      if (!email || email.trim() === '') {
        newErrors.email = 'Email is required';
      }
      
      // Password confirmation (only for registration)
      const password = formData.get('password') as string;
      const password2 = formData.get('password2') as string;
      if (!password2 || password2.trim() === '') {
        newErrors.password2 = 'Please confirm your password';
      } else if (password !== password2) {
        newErrors.password2 = 'Passwords do not match';
      }
      
      // OTP validation (if OTP field is shown)
      if (otpField) {
        const otp = formData.get('otp') as string;
        if (!otp || otp.trim() === '') {
          newErrors.otp = 'OTP is required';
        }
      }
    }
    
    // Common validations for both login and register
    const mis = formData.get('mis') as string;
    if (!mis || mis.trim() === '') {
      newErrors.mis = 'MIS is required';
    }
    
    const password = formData.get('password') as string;
    if (!password || password.trim() === '') {
      newErrors.password = 'Password is required';
    }
    
    // If there are errors, show them and stop form submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clear previous errors if validation passes
    setErrors({});
    
    // For registration, show OTP field after initial form is valid
    if (!isLogin && !otpField) {
      try {
        // Get the data from form
        const username = formData.get('mis') as string; // using mis field as username/roll_no
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const password2 = formData.get('password2') as string;
        
        // You need to add a year field to your form
        const year = formData.get('year') as string; // Add this field to your form
        
        console.log("Sending registration data:", {
          username: username,
          email: email,
          year: year,
          password: password,
          password2: password2
        });
        
        // Send registration request to get OTP
        const response = await fetch('http://127.0.0.1:8000/auth/signup/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: username,
            email: email,
            year: year,
            password: password,
            password2: password2
          }),
        });
        
        const data = await response.json();
        console.log("Registration response:", data);
        
        if (!response.ok) {
          // Handle API errors
          if (data.student) {
            setErrors({ form: data.student });
            return;
          } else if (data.password) {
            setErrors({ form: data.password });
            return;
          } else if (data.errors) {
            setErrors(data.errors);
            return;
          } else if (data.error) {
            setErrors({ form: data.error });
            return;
          } else if (data.detail) {
            setErrors({ form: data.detail });
            return;
          }
          throw new Error(data.message || 'Failed to request OTP');
        }
        
        // Show OTP field if request was successful
        setOtpField(true);
        // Show success message
        alert("OTP has been sent to your email");
        
      } catch (error) {
        console.error('Error requesting OTP:', error);
        setErrors({ form: 'Failed to send OTP. Please try again.' });
      }
      return;
    }
    
    try {
      let url, requestData;
      const otp = formData.get('otp') as string;
      if (isLogin) {
        // Handle login
        url = 'http://127.0.0.1:8000/auth/login/';
        requestData = {
          mis: mis,
          password: password
        };
      } else {
        // Handle registration with OTP verification
        const response = await fetch('http://127.0.0.1:8000/auth/verify-otp/',{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            otp:otp,
          }),
        })
        console.log(response);
      }
      
      const response = await fetch('http://127.0.0.1:8000/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle error response from Django
        if (data.errors) {
          setErrors(data.errors);
          return;
        }
        throw new Error(data.message || 'Authentication failed');
      }
      
      // Handle successful response
      if (data.token) {
        // Store token in localStorage or cookies
        localStorage.setItem('authToken', data.token);
        // Redirect or update UI based on successful authentication
        setShowAuth(false);
        // Optional: Show success message
        alert(isLogin ? 'Login successful!' : 'Registration successful!');
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ form: 'Authentication failed. Please try again.' });
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="fixed inset-0 z-0">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            fpsLimit: 120,
            particles: {
              color: {
                value: ["#fdcf58", "#f27d0c", "#800909", "#f07f13"]
              },
              move: {
                enable: true,
                direction: "top",
                random: true,
                speed: 3,
                straight: false,
                outMode: "out",
                bounce: false,
                attract: {
                  enable: false,
                  rotateX: 600,
                  rotateY: 1200
                }
              },
              number: {
                density: {
                  enable: true,
                  area: 800
                },
                value: 200
              },
              opacity: {
                value: 0.7,
                random: true,
                anim: {
                  enable: true,
                  speed: 0.5,
                  opacity_min: 0.1,
                  sync: false
                }
              },
              shape: {
                type: "circle"
              },
              size: {
                value: { min: 2, max: 5 },
                random: true,
                anim: {
                  enable: true,
                  speed: 2,
                  size_min: 0.1,
                  sync: false
                }
              }
            },
            detectRetina: true,
            fullScreen: {
              enable: true,
              zIndex: 0
            },
            background: {
              color: "#f5f5f5"
            }
          }}
        />
      </div>

      {showAuth && (
        <div className="auth-overlay">
          <div className="auth-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{isLogin ? 'Login' : 'Register'}</h2>
              <button onClick={() => setShowAuth(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
               
<div className="space-y-2">
  <Label htmlFor="Mis">Mis</Label>
  <Input 
    id="mis" 
    name="mis" 
    type="text"
    className={errors.mis ? "border-red-500" : ""}
  />
  {errors.mis && <p className="text-xs text-red-500 mt-1">{errors.mis}</p>}
</div>

{!isLogin && (
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input 
      id="email" 
      name="email" 
      type="email"
      className={errors.email ? "border-red-500" : ""}
    />
    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
  </div>  
)}
{!isLogin && (
  <div className="space-y-2">
    <Label htmlFor="year">Year of Study</Label>
    <select 
      id="year" 
      name="year" 
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
    >
      <option value="">Select Year</option>
      <option value="FirstYear">First Year</option>
      <option value="SecondYear">Second Year</option>
      <option value="ThirdYear">Third Year</option>
      <option value="FourthYear">Fourth Year</option>
    </select>
    {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
  </div>
)}
<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input 
    id="password" 
    name="password" 
    type="password"
    className={errors.password ? "border-red-500" : ""}
  />
  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
</div>

{!isLogin && (
  <div className="space-y-2">
    <Label htmlFor="password2">Confirm Password</Label>
    <Input 
      id="password2" 
      name="password2" 
      type="password"
      className={errors.password2 ? "border-red-500" : ""}
    />
    {errors.password2 && <p className="text-xs text-red-500 mt-1">{errors.password2}</p>}
  </div>
)}

{!isLogin && otpField && (
  <div className="space-y-2">
    <Label htmlFor="otp">Enter OTP</Label>
    <Input 
      id="otp" 
      name="otp" 
      type="text" 
      placeholder="Enter verification code"
      className={errors.otp ? "border-red-500" : ""}
    />
    {errors.otp && <p className="text-xs text-red-500 mt-1">{errors.otp}</p>}
    <p className="text-xs text-gray-500">OTP has been sent to your email address</p>
  </div>
)}

<Button 
  type="submit" 
  className="w-full bg-[#ff3333] hover:bg-[#cc0000] text-white"
>
  {isLogin ? 'Login' : otpField ? 'Verify & Register' : 'Register'}
</Button>
              <p className="text-center text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  type="submit"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#ff3333] hover:text-[#cc0000] font-semibold"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

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
                  className="text-gray-9 hover:text-[#ff3333] transition-colors duration-200 font-medium
                           relative after:content-[''] after:absolute after:w-full after:h-0.5
                           after:bg-[#ff3333] after:left-0 after:-bottom-1 after:scale-x-0
                           hover:after:scale-x-100 after:transition-transform after:duration-300"
                >
                  {item}
                </a>
              ))}
              <Button
                onClick={() => {
                  setIsLogin(false);
                  setShowAuth(true);
                }}
                className="bg-[#ff3333] hover:bg-[#cc0000] text-white"
              >
                Register
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
                  setIsLogin(false);
                  setShowAuth(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#ff3333] hover:bg-[#cc0000] text-white"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section 
        className="relative h-screen bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/hostel3.jpeg')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16 h-full flex items-center">
          <div className="text-white max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">COEP Hostel</h1>
            <p className="text-xl md:text-2xl mb-8">A Home Away from Home</p>
            <p className="text-lg md:text-xl mb-8">
              Affordable, Secure, and Comfortable Student Living
            </p>
            <Button
              onClick={() => {
                setIsLogin(false);
                setShowAuth(true);
              }}
              className="bg-[#ff3333] hover:bg-[#cc0000] text-white px-8 py-6 text-lg"
            >
              Apply Now
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          <Card className="bg-white/80 border-gray-200 shadow-lg">
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />
              <h3 className="text-3xl font-bold mb-2 text-gray-900">1200+</h3>
              <p className="text-gray-600">Residents</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-gray-200 shadow-lg">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />
              <h3 className="text-3xl font-bold mb-2 text-gray-900">24/7</h3>
              <p className="text-gray-600">Security</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-gray-200 shadow-lg">
            <CardContent className="pt-6 text-center">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />
              <h3 className="text-3xl font-bold mb-2 text-gray-900">3</h3>
              <p className="text-gray-600">Dining Halls</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-gray-200 shadow-lg">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-[#ff3333]" />
              <h3 className="text-3xl font-bold mb-2 text-gray-900">5+</h3>
              <p className="text-gray-600">Study Spaces</p>
            </CardContent>
          </Card>
        </div>
      </section>

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

      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">What Our Residents Say</h2>
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {[
                {
                  text: "The mess food is decent, and the study spaces are great! The environment really helps me focus on my academics.",
                  author: "Rahul Sharma, 3rd Year"
                },
                {
                  text: "Security is strict but ensures our safety. The facilities are well-maintained and the staff is helpful.",
                  author: "Priya Patel, 2nd Year"
                },
                {
                  text: "Living in COEP hostel has been a wonderful experience. It truly feels like a home away from home.",
                  author: "Amit Kumar, 4th Year"
                }
              ].map((testimonial, index) => (
                <CarouselItem key={index}>
                  <Card className="bg-white/80 border-gray-200 shadow-lg">
                    <CardContent className="p-8">
                      <p className="text-lg italic mb-4 text-gray-700">{testimonial.text}</p>
                      <p className="text-[#ff3333] font-semibold">{testimonial.author}</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Hostel Rules & Guidelines</h2>
          <div className="max-w-3xl mx-auto">
            <Card className="bg-white/80 border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>Entry/Exit timings strictly followed for security</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>Visitors allowed only in designated areas</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>Mandatory mess attendance during meal times</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <div className="h-2 w-2 bg-[#ff3333] rounded-full mr-3" />
                    <span>Zero tolerance for ragging and misconduct</span>
                  </li>
                </ul>
                <Button className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300">
                  <Download className="mr-2 h-4 w-4" /> Download Complete Rulebook
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12 relative z-10">
        <div className="max-w-[1920px] mx-auto px-8 sm:px-12 lg:px-16">
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
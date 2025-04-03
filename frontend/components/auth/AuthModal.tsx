"use client";

import { useState } from 'react';
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import ForgotPassword from './ForgotPassword';

interface AuthModalProps {
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  onClose: () => void;
}

export default function AuthModal({ isLogin, setIsLogin, onClose }: AuthModalProps) {
  const { login } = useAuth(); // Extract the login function from your context
  const [otpField, setOtpField] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  // Handle form submission
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
        const year = formData.get('year') as string;
        
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
        setToken(data.token);
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
          mis: formData.get('mis'),
          password: formData.get('password')
        };
      } else {
        // Handle registration with OTP verification
        url = 'http://127.0.0.1:8000/auth/verify-otp/';
        requestData = {
          otp: otp,
          token: token
        };
      }
      
      console.log(requestData);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
        // Use the login function from your context
        login(data.token, data.user || { 
          username: formData.get('mis') as string
          // You can add more user properties here if needed
        });
        
        // Close the modal
        onClose();
        
        // Optional: Show success message
        alert(isLogin ? 'Login successful!' : 'Registration successful!');
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ form: 'Authentication failed. Please try again.' });
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isLogin ? 'Login' : 'Register'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="Mis">MIS</Label>
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

          {errors.form && <p className="text-xs text-red-500">{errors.form}</p>}

          <Button 
            type="submit" 
            className="w-full bg-[#ff3333] hover:bg-[#cc0000] text-white"
          >
            {isLogin ? 'Login' : otpField ? 'Verify & Register' : 'Register'}
          </Button>
          
          <p className="text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
          {/* Forgot Password Button */}
          {isLogin && (
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-red-500 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </form>
      </div>
      {showForgotPassword && <ForgotPassword onClose={() => setShowForgotPassword(false)} />}
    </div>
  );
}

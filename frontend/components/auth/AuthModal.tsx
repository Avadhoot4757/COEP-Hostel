// components/auth/AuthModal.tsx
"use client";

import { useState } from "react";
import { User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ForgotPassword from "./ForgotPassword";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
  onClose: () => void;
}

export default function AuthModal({ isLogin, setIsLogin, onClose }: AuthModalProps) {
  const { login } = useAuth();
  const [otpField, setOtpField] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();

  // Map year numbers to class_name
  const yearToClassName: { [key: string]: string } = {
    "1": "fy",
    "2": "sy",
    "3": "ty",
    "4": "btech",
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newErrors: Record<string, string> = {};

    // Validate fields
    if (!isLogin) {
      const email = formData.get("email") as string;
      if (!email || email.trim() === "") {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Invalid email format";
      }

      const password = formData.get("password") as string;
      const password2 = formData.get("password2") as string;
      if (!password2 || password2.trim() === "") {
        newErrors.password2 = "Please confirm your password";
      } else if (password !== password2) {
        newErrors.password2 = "Passwords do not match";
      }

      const year = formData.get("year") as string;
      if (!year || year.trim() === "") {
        newErrors.year = "Year of study is required";
      }

      if (otpField) {
        const otp = formData.get("otp") as string;
        if (!otp || otp.trim() === "") {
          newErrors.otp = "OTP is required";
        }
      }
    }

    const mis = formData.get("mis") as string;
    if (!mis || mis.trim() === "") {
      newErrors.mis = "MIS is required";
    }

    const password = formData.get("password") as string;
    if (!password || password.trim() === "") {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (!isLogin && !otpField) {
      try {
        const username = formData.get("mis") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const year = formData.get("year") as string;
        const class_name = yearToClassName[year];

        const response = await api.post("/auth/signup/", {
          username,
          email,
          class_name, // Send class_name instead of year
          password,
        });

        setOtpField(true);
        setToken(response.data.token);
        alert("OTP has been sent to your email");
      } catch (error: any) {
        console.error("Error requesting OTP:", error);
        setErrors({
          form:
            error.response?.data?.error ||
            "Failed to send OTP. Please try again.",
        });
      }
      return;
    }

    try {
      let response;
      if (isLogin) {
        response = await api.post("/auth/login/", {
          username: formData.get("mis"),
          password: formData.get("password"),
        });
      } else {
        response = await api.post("/auth/verify-otp/", {
          otp: formData.get("otp"),
          token,
        });
      }

      const userData = {
        username: isLogin
          ? (formData.get("mis") as string)
          : response.data.user?.username,
        user_type: response.data.user.user_type,
        class_name: response.data.user.class_name,
      };

      console.log("User data before login:", userData); // Debug
      await login(userData);

      alert(isLogin ? "Login successful!" : "Registration successful!");
      onClose();
      // console.log("trying to pring the current user via USER",User);
      console.log("going in landing page with ",userData.user_type);
      if(userData.user_type==='manager'){
        router.push("/managerHome");
      }if(userData.user_type==='rector'){
        router.push("/rectorHome");
      }else if(userData.user_type==='manager'){
        router.push("/managerHome");
      }else{
        router.push("/landing");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setErrors({
        form:
          error.response?.data?.error || "Authentication failed. Please try again.",
      });
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Register"}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mis">MIS</Label>
            <Input
              id="mis"
              name="mis"
              type="text"
              className={errors.mis ? "border-red-500" : ""}
            />
            {errors.mis && (
              <p className="text-xs text-red-500 mt-1">{errors.mis}</p>
            )}
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
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="year">Year of Study</Label>
              <select
                id="year"
                name="year"
                className={`w-full rounded-md border px-3 py-2 text-gray-900 ${
                  errors.year ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Year</option>
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Fourth Year</option>
              </select>
              {errors.year && (
                <p className="text-xs text-red-500 mt-1">{errors.year}</p>
              )}
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
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
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
              {errors.password2 && (
                <p className="text-xs text-red-500 mt-1">{errors.password2}</p>
              )}
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
              {errors.otp && (
                <p className="text-xs text-red-500 mt-1">{errors.otp}</p>
              )}
              <p className="text-xs text-gray-500">
                OTP has been sent to your email address
              </p>
            </div>
          )}

          {errors.form && <p className="text-xs text-red-500">{errors.form}</p>}

          <Button
            type="submit"
            className="w-full bg-[#ff3333] hover:bg-[#cc0000] text-white"
          >
            {isLogin ? "Login" : otpField ? "Verify & Register" : "Register"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setOtpField(false);
                setErrors({});
              }}
              className="text-blue-500 hover:underline"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>

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
      {showForgotPassword && (
        <ForgotPassword onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic"; // Force dynamic rendering

interface ResetPasswordProps {
  params: Promise<{ uidb64: string; token: string }>;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ params }) => {
  const [uidb64, setUidb64] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const router = useRouter();

  // Resolve the params Promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        setUidb64(resolvedParams.uidb64);
        setToken(resolvedParams.token);
        setParamsLoaded(true);
      } catch (err) {
        setError("Failed to load page parameters.");
      }
    };
    
    resolveParams();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/auth/password-reset-confirm/${uidb64}/${token}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ new_password: newPassword }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push("/?auth=login"), 3000);
      } else {
        setError(data.error || "Invalid or expired link.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
    setLoading(false);
  };

  // Show loading state while params are being resolved
  if (!paramsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Reset Your Password</h2>
        {message && <p className="text-green-600 mb-3">{message}</p>}
        {error && <p className="text-red-600 mb-3">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            New Password:
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
            />
          </label>
          <label className="block mb-2">
            Confirm Password:
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-red-500 text-white p-2 rounded mt-2 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

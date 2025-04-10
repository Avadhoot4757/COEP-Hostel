//"use client";

//import { useState } from "react";

//interface ForgotPasswordProps {
//  onClose: () => void;
//}

//const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onClose }) => {
//  const [email, setEmail] = useState("");
//  const [message, setMessage] = useState("");

//  const handleSubmit = async (e: React.FormEvent) => {
//    e.preventDefault();
//    setMessage("If an account exists with this email, you will receive a reset link.");
//  };

//  return (
//    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
//        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
//        {message && <p className="text-green-600 mb-3">{message}</p>}
//        <form onSubmit={handleSubmit}>
//          <label className="block mb-2">
//            Email:
//            <input
//              type="email"
//              value={email}
//              onChange={(e) => setEmail(e.target.value)}
//              required
//              className="w-full p-2 border rounded mt-1"
//            />
//          </label>
//          <button type="submit" className="w-full bg-red-500 text-white p-2 rounded mt-2">
//            Send Reset Link
//          </button>
//        </form>
//        <button
//          onClick={onClose}
//          className="mt-3 text-red-600 underline block w-full text-center"
//        >
//          Back to Login
//        </button>
//      </div>
//    </div>
//  );
//};

//export default ForgotPassword;

"use client";

import { useState } from "react";

interface ForgotPasswordProps {
  onClose: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/password-reset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset link sent to your email.");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
        
        {message && <p className="text-green-600 mb-3">{message}</p>}
        {error && <p className="text-red-600 mb-3">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
            />
          </label>
          
          <button 
            type="submit" 
            className="w-full bg-red-500 text-white p-2 rounded mt-2 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to Login Button */}
        <button
          onClick={onClose}
          className="mt-3 text-red-600 underline block w-full text-center"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;

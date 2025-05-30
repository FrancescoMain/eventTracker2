import React, { useState } from "react";
import axios from "axios"; // Use standard axios for login
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // If proxy is set up in package.json, this will be 'http://localhost:5000/api/auth/login'
      const response = await axios.post(
        "https://eventtracker2.onrender.com/api/auth/login",
        { email, password }
      );

      localStorage.setItem("token", response.data.token);
      console.log("Login successful, token:", response.data.token);

      // For now, navigate to a placeholder home page
      // In a real app, you might navigate to a dashboard or protected route
      navigate("/");
    } catch (err) {
      console.error(
        "Login error:",
        err.response ? err.response.data : err.message
      );
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div>
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <h2 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pl-12 pr-12">
            Event Tracker
          </h2>
        </div>
        <h2 className="text-[#0d141c] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
          Welcome Back
        </h2>
        {error && (
          <div className="px-4 pb-2">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-center"
              role="alert"
            >
              {error}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <input
                placeholder="Email"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49709c] p-4 text-base font-normal leading-normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <input
                placeholder="Password"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49709c] p-4 text-base font-normal leading-normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>
          </div>
          <div className="flex px-4 py-3">
            <button
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0c77f2] text-slate-50 text-base font-bold leading-normal tracking-[0.015em]"
              type="submit"
              disabled={loading}
            >
              <span className="truncate">
                {loading ? "Logging in..." : "Log In"}
              </span>
            </button>
          </div>
        </form>
        <p className="text-[#49709c] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center underline">
          Don't have an account? Sign up
        </p>
      </div>
      <div>
        <footer className="flex flex-col gap-6 px-5 py-10 text-center @container">
          <p className="text-[#49709c] text-base font-normal leading-normal">
            @2024 Event Tracker. All rights reserved.
          </p>
        </footer>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  );
};

export default Login;

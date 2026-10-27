
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import logo from "../../assets/bia.png";
import { isAuthenticated, loginUser } from "../../utils/auth";

function CounsellorLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {

    console.log("clicked");
    console.log(username, password);
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser({
        username,
        email: username,
        password,
        role: "counsellor",
      });

      if (result.success) {
        toast.success("Login successful!");
        navigate("/counsellor/leads", { replace: true });
        return;
      }

      toast.error(result.message || "Unable to login.");
    } catch (err) {
      console.error("Login error:", err.response?.data || err);

      toast.error(
        err.response?.data?.message ||
        "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const expiredMsg = sessionStorage.getItem("auth_session_expired");
      if (expiredMsg) {
        sessionStorage.removeItem("auth_session_expired");
        toast.error(expiredMsg);
      }
    } catch (e) {
      console.error(e);
    }

    if (isAuthenticated()) {
      navigate("/counsellor/leads", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      {/* Background accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-indigo-200/30 blur-3xl" />

      {/* Main container */}
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18)] md:grid-cols-2">

        {/* Left branding panel */}
        <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-10 text-white lg:p-12 md:flex">

          {/* Background accent */}
          <div className="pointer-events-none absolute bottom-28 left-12 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />

          {/* Centered logo without white container */}

          <div className="relative z-10 w-full">
            <div className="mb-10 inline-flex items-center gap-3 rounded-xl bg-white px-4 py-3">
              <img
                src={logo}
                alt="Bia Logo"
                className="h-32 w-auto object-contain"
              />
            </div>

            {/* Branding heading */}
            <div className="mt-16">
              {/* <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/10 px-3.5 py-2">
                <span className="h-2 w-2 rounded-full bg-blue-300" />

                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Lead Management System
                </span>
              </div> */}

              <h1 className="text-4xl font-bold leading-[1.2] tracking-tight xl:text-5xl">
                Manage leads.
                <br />
                <span className="text-blue-200">
                  Build success.
                </span>
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/80">
                Access your workspace to manage candidates, track
                follow-ups, monitor performance, and organize your
                daily activities.
              </p>
            </div>
          </div>

          {/* Bottom information */}
          <div className="relative z-10 mt-10 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200">
              <FiUsers size={23} />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Everything in one place
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Simplify your daily workflow with a dedicated workspace.
              </p>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-1 w-full bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500" />
        </div>

        {/* Right login panel */}
        <div className="flex items-center justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14">
          <div className="w-full max-w-md">
            {/* Mobile logo without container */}
            <div className="mb-9 flex justify-center md:hidden">
              <img
                src={logo}
                alt="Bia Logo"
                className="h-24 w-auto max-w-full object-contain"
              />
            </div>

            {/* Heading */}
            <div className="mb-9">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">
                Welcome back
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
                Sign in to your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your credentials below to access your dashboard.
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>

                <div className="group relative">
                  <FiMail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"
                  />

                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/counsellor/forgot-password"
                    className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="group relative">
                  <FiLock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:translate-y-0  disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to dashboard
                    <span className="text-lg transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>

              {/* Register button */}
              <button
                type="button"
                onClick={() => navigate("/counsellor/register")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white py-3.5 text-sm font-semibold text-blue-700 transition duration-200 hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-500/15 cursor-pointer"
              >
                Create an account
                <span className="text-lg">→</span>
              </button>

            </form>

            {/* Footer */}
            <div className="mt-10 border-t border-slate-100 pt-5">
              <p className="text-center text-xs leading-5 text-slate-400">
                © {new Date().getFullYear()} Bi Talents. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CounsellorLogin;

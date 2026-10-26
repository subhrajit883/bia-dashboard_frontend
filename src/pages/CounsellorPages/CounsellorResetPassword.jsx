import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertTriangle,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import logo from "../../assets/bia.png";
import { authUrl } from "../../config/config";
import { isAuthenticated } from "../../utils/auth";

function CounsellorResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const role = searchParams.get("role") || "counsellor";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/counsellor/leads", { replace: true });
    }
  }, [navigate]);

  // Auto redirect countdown on success
  useEffect(() => {
    let timer;
    if (isSuccess && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSuccess && redirectCountdown === 0) {
      navigate("/counsellor/login", { replace: true });
    }
    return () => clearTimeout(timer);
  }, [isSuccess, redirectCountdown, navigate]);

  // Validation checks
  const isMinLength = password.length >= 8;
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      toast.error("Reset token is missing from the link.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(authUrl.resetPassword, {
        token,
        role,
        password,
      });

      setIsSuccess(true);
      toast.success(
        response.data?.message || "Password changed successfully!"
      );
    } catch (err) {
      console.error("Reset password error:", err.response?.data || err);
      const msg =
        err.response?.data?.message ||
        "This password reset link is invalid or has expired. Please request a new one.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      {/* Background accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-indigo-200/30 blur-3xl" />

      {/* Main container */}
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18)] md:grid-cols-2">
        {/* Left branding panel */}
        <div className="relative hidden min-h-[580px] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-10 text-white md:flex lg:p-12">
          {/* Background accent */}
          <div className="pointer-events-none absolute bottom-28 left-12 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />

          <div className="relative z-10 w-full">
            <div className="mb-10 inline-flex items-center gap-3 rounded-xl bg-white px-4 py-3">
              <img
                src={logo}
                alt="Bia Logo"
                className="h-28 w-auto object-contain"
              />
            </div>

            {/* Branding heading */}
            <div className="mt-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-100">
                <FiShield className="h-3.5 w-3.5 text-blue-300" />
                <span>Security Checkpoint</span>
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                Choose a strong
                <br />
                <span className="text-blue-200">new password.</span>
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/80">
                Create a secure password with at least 8 characters to safeguard
                your counsellor account and candidate data.
              </p>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="relative z-10 mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
            <p className="text-xs font-semibold text-white">
              Password Best Practices
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-blue-200/80">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Use a minimum of 8 characters
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Combine letters, numbers, and symbols
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Avoid reusing previous passwords
              </li>
            </ul>
          </div>

          {/* Bottom accent line */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-1 w-full bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500" />
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex justify-center md:hidden">
              <img
                src={logo}
                alt="Bia Logo"
                className="h-20 w-auto max-w-full object-contain"
              />
            </div>

            {/* Check if token is missing */}
            {!token ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-lg shadow-amber-500/20">
                  <FiAlertTriangle className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Invalid Reset Link
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    The password reset token is missing from your link. Please make
                    sure you copied the entire URL from your email or request a new
                    one.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    to="/counsellor/forgot-password"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    Request New Reset Link
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <Link
                    to="/counsellor/login"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600"
                  >
                    <FiArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : isSuccess ? (
              /* Success state */
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20">
                  <FiCheckCircle className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Password Reset Complete!
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your password has been changed successfully. You can now log in
                    to your counsellor dashboard with your new credentials.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <span>Redirecting to login in </span>
                  <span className="font-bold text-blue-600">
                    {redirectCountdown} seconds
                  </span>
                  <span>...</span>
                </div>

                <div className="pt-2">
                  <Link
                    to="/counsellor/login"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    <span>Proceed to Sign In</span>
                    <span className="text-base">→</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="mb-8">
                  <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
                    <FiLock className="h-3.5 w-3.5" />
                    <span>Password Reset</span>
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Create New Password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Please enter and confirm your new password below.
                  </p>
                </div>

                {/* Inline error if request failed */}
                {errorMessage && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800">
                    <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div className="flex-1">
                      <p className="font-semibold">{errorMessage}</p>
                      <Link
                        to="/counsellor/forgot-password"
                        className="mt-1 inline-block font-bold text-rose-700 underline hover:text-rose-900"
                      >
                        Request a fresh reset link →
                      </Link>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      New Password <span className="text-rose-500">*</span>
                    </label>

                    <div className="group relative">
                      <FiLock
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"
                      />

                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>

                    <div className="group relative">
                      <FiLock
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"
                      />

                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password requirements checklist */}
                  <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                          isMinLength
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        <FiCheck className="h-2.5 w-2.5" />
                      </span>
                      <span className={isMinLength ? "font-medium text-emerald-700" : ""}>
                        Minimum 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                          isMatch
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        <FiCheck className="h-2.5 w-2.5" />
                      </span>
                      <span className={isMatch ? "font-medium text-emerald-700" : ""}>
                        Passwords match
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !isMinLength || !isMatch}
                    className="group mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <span className="text-base transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>

                  {/* Back to login */}
                  <div className="pt-2 text-center">
                    <Link
                      to="/counsellor/login"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition hover:text-blue-600"
                    >
                      <FiArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              </>
            )}

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

export default CounsellorResetPassword;

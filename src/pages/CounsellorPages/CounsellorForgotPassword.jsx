import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiCheckCircle,
  FiShield,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import logo from "../../assets/bia.png";
import { authUrl } from "../../config/config";
import { isAuthenticated } from "../../utils/auth";

function CounsellorForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If already logged in, redirect to counsellor leads
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/counsellor/leads", { replace: true });
    }
  }, [navigate]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(authUrl.forgotPassword, {
        email: trimmedEmail,
        role: "counsellor",
      });

      setSubmitted(true);
      setResendCooldown(60);
      toast.success(
        response.data?.message || "Password reset link sent to your email!"
      );
    } catch (err) {
      console.error("Forgot password error:", err.response?.data || err);
      toast.error(
        err.response?.data?.message ||
          "Unable to process password reset request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    try {
      const response = await axios.post(authUrl.forgotPassword, {
        email: email.trim(),
        role: "counsellor",
      });
      setResendCooldown(60);
      toast.success(
        response.data?.message || "A new password reset link has been sent!"
      );
    } catch (err) {
      console.error("Resend error:", err.response?.data || err);
      toast.error(
        err.response?.data?.message || "Unable to resend email. Please try again."
      );
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
                <span>Account Recovery</span>
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                Reset your
                <br />
                <span className="text-blue-200">counsellor access.</span>
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/80">
                Follow simple steps to safely recover your account and regain
                access to your leads, candidates, and daily workflows.
              </p>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="relative z-10 mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
              <FiClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                Time-sensitive Security
              </p>
              <p className="mt-0.5 text-[11px] text-blue-200/80">
                Reset links expire in 15 minutes for your account protection.
              </p>
            </div>
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

            {!submitted ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
                    <FiShield className="h-3.5 w-3.5" />
                    <span>Counsellor Portal</span>
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Forgot Password?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your registered email address and we will send you a
                    secure link to reset your password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="counsellor-email"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Registered Email Address <span className="text-rose-500">*</span>
                    </label>

                    <div className="group relative">
                      <FiMail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"
                      />

                      <input
                        id="counsellor-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="e.g. subhrajit@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:translate-y-0 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Sending Instructions...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <span className="text-base transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>

                  {/* Back to sign in */}
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
            ) : (
              /* Success confirmation state */
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20">
                  <FiCheckCircle className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Check your email
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    We have sent password reset instructions to:
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 break-all bg-slate-100 py-1.5 px-3 rounded-lg text-sm inline-block">
                    {email}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    Click the link in the email to set a new password. The link is
                    valid for 15 minutes.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiRefreshCw
                      className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`}
                    />
                    {resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : "Didn't receive email? Click to resend"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setResendCooldown(0);
                    }}
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-800 underline"
                  >
                    Try a different email address
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <Link
                    to="/counsellor/login"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <FiArrowLeft className="h-3.5 w-3.5" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
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

export default CounsellorForgotPassword;

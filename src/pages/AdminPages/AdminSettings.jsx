import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    FaLock,
    FaEye,
    FaEyeSlash,
    FaShieldAlt,
    FaKey,
    FaCheckCircle,
    FaArrowLeft,
    FaExclamationCircle,
} from "react-icons/fa";
import { authUrl } from "../../config/config";

function AdminSettings() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    };

    const togglePassword = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.currentPassword || !formData.newPassword) {
            setError("Please fill in all required fields.");
            return;
        }

        if (formData.newPassword.length < 8) {
            setError("Your new password must contain at least 8 characters.");
            return;
        }

        if (formData.currentPassword === formData.newPassword) {
            setError("Your new password must be different from your current password.");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        const token = localStorage.getItem("adminToken");

        if (!token) {
            setError("Your session has expired. Please log in again.");

            setTimeout(() => {
                navigate("/admin/login", { replace: true });
            }, 1500);

            return;
        }

        try {
            setLoading(true);

            const res = await axios.put(
                `${authUrl.adminChangePassword}`,
                {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.success) {
                setSuccess(
                    res.data.message ||
                    "Password updated successfully. Please log in again."
                );

                // Remove the old authentication token.
                localStorage.removeItem("adminRole");
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");

                // Redirect to the admin login page.
                setTimeout(() => {
                    navigate("/admin/login", { replace: true });
                }, 1800);
            }
        } catch (err) {
            const status = err.response?.status;

            if (status === 401) {
                setError(
                    "Your session is invalid or expired. Please log in again."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to update your password. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const renderPasswordField = ({
        label,
        name,
        placeholder,
        field,
        required = true,
    }) => (
        <div className="space-y-2">
            <label
                htmlFor={name}
                className="block text-sm font-semibold text-slate-700"
            >
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <FaLock className="text-slate-400" />
                </div>

                <input
                    id={name}
                    name={name}
                    type={showPassword[field] ? "text" : "password"}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoComplete={
                        name === "currentPassword"
                            ? "current-password"
                            : "new-password"
                    }
                    required={required}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                    type="button"
                    onClick={() => togglePassword(field)}
                    aria-label={
                        showPassword[field] ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-blue-600"
                >
                    {showPassword[field] ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-6xl">
                {/* Page Header */}
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
                    >
                        <FaArrowLeft className="text-xs" />
                        Back
                    </button>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                                <FaShieldAlt />
                                ACCOUNT SECURITY
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Admin Settings
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                                Manage your account security and keep your
                                administrator account protected.
                            </p>
                        </div>

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                            <FaKey className="text-2xl" />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Sidebar Information */}
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FaShieldAlt className="text-xl" />
                            </div>

                            <h2 className="text-lg font-bold text-slate-900">
                                Account Protection
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Your administrator account has access to
                                important information. Keep your password
                                private and update it whenever necessary.
                            </p>

                            <div className="mt-5 border-t border-slate-100 pt-4">
                                <div className="flex items-start gap-3">
                                    <FaCheckCircle className="mt-1 shrink-0 text-emerald-500" />

                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            Secure password
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Use at least 8 characters.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-start gap-3">
                                    <FaCheckCircle className="mt-1 shrink-0 text-emerald-500" />

                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            Session security
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            You will need to log in again after
                                            changing your password.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                            <div className="flex items-start gap-3">
                                <FaExclamationCircle className="mt-1 shrink-0 text-amber-600" />

                                <div>
                                    <h3 className="text-sm font-bold text-amber-900">
                                        Security Reminder
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 text-amber-800">
                                        Never share your password with anyone.
                                        Always use a password that is difficult
                                        to guess.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Form */}
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {/* Card Header */}
                            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <FaLock className="text-lg" />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Change Password
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Update your administrator login
                                            credentials.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-6 p-6 sm:p-8"
                            >
                                {/* Current Password */}
                                {renderPasswordField({
                                    label: "Current Password",
                                    name: "currentPassword",
                                    placeholder: "Enter your current password",
                                    field: "current",
                                })}

                                <div className="border-t border-slate-100" />

                                {/* New Password */}
                                {renderPasswordField({
                                    label: "New Password",
                                    name: "newPassword",
                                    placeholder: "Enter your new password",
                                    field: "new",
                                })}

                                {/* Password Requirements */}
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Password Requirements
                                    </p>

                                    <div className="flex items-center gap-2 text-sm">
                                        <FaCheckCircle
                                            className={
                                                formData.newPassword.length >= 8
                                                    ? "text-emerald-500"
                                                    : "text-slate-300"
                                            }
                                        />

                                        <span
                                            className={
                                                formData.newPassword.length >= 8
                                                    ? "text-emerald-700"
                                                    : "text-slate-500"
                                            }
                                        >
                                            At least 8 characters
                                        </span>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                {renderPasswordField({
                                    label: "Confirm New Password",
                                    name: "confirmPassword",
                                    placeholder: "Re-enter your new password",
                                    field: "confirm",
                                })}

                                {/* Error Message */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
                                    >
                                        <FaExclamationCircle className="mt-0.5 shrink-0" />

                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Success Message */}
                                {success && (
                                    <div
                                        role="status"
                                        className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700"
                                    >
                                        <FaCheckCircle className="mt-0.5 shrink-0" />

                                        <span>{success}</span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        disabled={loading}
                                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading || !!success}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                Updating Password...
                                            </>
                                        ) : success ? (
                                            <>
                                                <FaCheckCircle />
                                                Password Updated
                                            </>
                                        ) : (
                                            <>
                                                <FaLock />
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                            Your security matters. Changes to your password
                            require you to authenticate again.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminSettings;
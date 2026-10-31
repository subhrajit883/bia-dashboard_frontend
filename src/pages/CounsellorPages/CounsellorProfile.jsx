import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    User,
    Mail,
    Phone,
    Shield,
    Calendar,
    Clock,
    Copy,
    Check,
    Edit3,
    Save,
    X,
    RefreshCw,
    Lock,
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    Sparkles,
    Hash,
    PhoneCall,
    AtSign,
    Users,
    UserPlus,
    Send,
    BookOpen,
    Info,
    RotateCcw
} from "lucide-react";
import { counsellorUrl, BASE_URL } from "../../config/config";
import { getToken } from "../../utils/auth";

const CounsellorProfile = () => {
    // State management
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form inputs state
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        username: ""
    });
    const [formErrors, setFormErrors] = useState({});
    const [copiedKey, setCopiedKey] = useState(null);

    // Get Auth Token
    const getAuthToken = () => {
        return localStorage.getItem("token") || getToken();
    };

    // Fetch Profile from /api/counsellors/me
    const fetchProfile = useCallback(async (isRefresh = false) => {
        const token = getAuthToken();

        if (!token) {
            setError("Authentication token not found. Please log in again.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const endpoint = counsellorUrl.me || `${BASE_URL}/api/counsellors/me`;
            const response = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data && response.data.success && response.data.data) {
                const userData = response.data.data;
                setProfile(userData);
                setFormData({
                    name: userData.name || "",
                    phone: userData.phone || "",
                    username: userData.username || "",
                });



                if (isRefresh) {
                    toast.success("Profile refreshed with latest data.");
                }
            } else {
                throw new Error(response.data?.message || "Failed to load profile data.");
            }
        } catch (err) {
            console.error("Error fetching counsellor profile:", err);
            const errMsg =
                err.response?.data?.message ||
                err.message ||
                "Failed to fetch profile. Please check your connection.";
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Validation
    const validateForm = () => {
        const errors = {};
        const trimmedName = formData.name.trim();
        const trimmedPhone = formData.phone.trim();
        const trimmedUsername = formData.username.trim();

        if (!trimmedName) {
            errors.name = "Full name is required.";
        } else if (trimmedName.length < 2) {
            errors.name = "Name must be at least 2 characters.";
        }

        if (!trimmedPhone) {
            errors.phone = "Phone number is required.";
        } else if (!/^[0-9+-\s]{7,15}$/.test(trimmedPhone)) {
            errors.phone = "Please enter a valid phone number (7-15 digits).";
        }

        if (!trimmedUsername) {
            errors.username = "Username is required.";
        } else if (trimmedUsername.length < 2) {
            errors.username = "Username must be at least 2 characters.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle Input Changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: null,
            }));
        }
    };

    // Reset Form to Current Profile Data
    const handleCancelEdit = () => {
        if (profile) {
            setFormData({
                name: profile.name || "",
                phone: profile.phone || "",
                username: profile.username || "",
            });
        }
        setFormErrors({});
        setIsEditing(false);
    };

    // Submit Updates: PUT /api/counsellors/me
    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please resolve the validation errors.");
            return;
        }

        const token = getAuthToken();
        if (!token) {
            toast.error("Session expired. Please log in again.");
            return;
        }

        setSaving(true);
        try {
            const endpoint = counsellorUrl.me || `${BASE_URL}/api/counsellors/me`;
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                username: formData.username.trim(),
            };

            const response = await axios.put(endpoint, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data && response.data.success) {
                const updatedData = response.data.data || { ...profile, ...payload };
                setProfile(updatedData);
                setFormData({
                    name: updatedData.name || "",
                    phone: updatedData.phone || "",
                    username: updatedData.username || "",
                });



                toast.success(response.data.message || "Profile updated successfully!");
                setIsEditing(false);
            } else {
                throw new Error(response.data?.message || "Failed to update profile.");
            }
        } catch (err) {
            console.error("Error updating counsellor profile:", err);
            const msg =
                err.response?.data?.message ||
                err.message ||
                "Failed to update profile. Please try again.";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // Copy to Clipboard
    const copyToClipboard = (text, keyName, label = "Copied") => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(keyName);
        toast.success(`${label} copied to clipboard!`);
        setTimeout(() => {
            setCopiedKey(null);
        }, 2000);
    };

    // Format Dates
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {

            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }).format(date);
        } catch {
            return dateString;
        }
    };

    const formatShortDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            }).format(date);
        } catch {
            return dateString;
        }
    };

    // Avatar initials
    const getInitials = (name) => {
        if (!name) return "CP";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Unsaved changes check
    const hasUnsavedChanges =
        profile &&
        (formData.name.trim() !== (profile.name || "").trim() ||
            formData.phone.trim() !== (profile.phone || "").trim() ||
            formData.username.trim() !== (profile.username || "").trim());

    // Skeleton Loader
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/70 p-4 md:p-8 animate-pulse">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header skeleton */}
                    <div className="h-8 bg-slate-200 rounded-lg w-48 mb-2" />
                    <div className="h-60 bg-slate-200 rounded-3xl w-full" />
                    {/* Stats skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
                        ))}
                    </div>
                    {/* Cards skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl" />
                        <div className="h-96 bg-slate-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error && !profile) {
        return (
            <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Profile</h2>
                    <p className="text-sm text-slate-500 mb-6">{error}</p>
                    <button
                        type="button"
                        onClick={() => fetchProfile(false)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-16">
            {/* Top Navigation & Breadcrumb Bar */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5">
                <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500">
                        <Link to="/counsellor/leads" className="hover:text-blue-600 transition-colors">
                            Counsellor Portal
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-slate-800">My Profile</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => fetchProfile(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                            title="Refresh latest profile details"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        {!isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/30 transition cursor-pointer"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Profile</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-6">
                {/* 1. HERO PROFILE BANNER */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0B1437] via-[#101F52] to-[#1E3A8A] text-white shadow-xl shadow-slate-900/10 border border-slate-800">
                    {/* Background decorative ambient glow */}
                    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

                    <div className="relative p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            {/* Avatar & Core Bio */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                <div className="relative">
                                    <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5 shadow-xl">
                                        <div className="w-full h-full rounded-[14px] bg-[#0B1437] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold tracking-wider">
                                            {getInitials(profile?.name)}
                                        </div>
                                    </div>
                                    {/* <span
                                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0B1437] flex items-center justify-center ${profile?.isActive !== false ? "bg-emerald-500" : "bg-amber-500"
                                            }`}
                                        title={profile?.isActive !== false ? "Active Counsellor" : "Inactive"}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    </span> */}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                            {profile?.name || "Counsellor"}
                                        </h1>
                                        {/* <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            <BadgeCheck className="w-3.5 h-3.5" />
                                            {profile?.status ? profile.status.toUpperCase() : "ACTIVE"}
                                        </span> */}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                                        <span className="flex items-center gap-1 font-medium text-blue-200">
                                            <AtSign className="w-3.5 h-3.5" />
                                            {profile?.username || "username"}
                                        </span>
                                        {/* <span>•</span> 
                                        <span className="flex items-center gap-1 text-slate-300">
                                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                            Academic Counsellor
                                        </span>*/}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. OVERVIEW METRICS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account Status</p>
                            <p className="text-sm font-bold text-slate-900 capitalize truncate mt-0.5">
                                {profile?.status || "Active"}
                            </p>
                            <p className="text-[11px] text-emerald-600 font-medium">Verified & Authorized</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Role</p>
                            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">Counsellor</p>
                            <p className="text-[11px] text-slate-500 font-medium truncate">Lead & Student Manager</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enrolled On</p>
                            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                                {formatShortDate(profile?.createdAt)}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">Member record active</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Last Profile Update</p>
                            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                                {formatShortDate(profile?.updatedAt)}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium truncate">Profile synchronized</p>
                        </div>
                    </div>
                </div>

                {/* 3. MAIN CONTENT: PROFILE FORM & DETAILS (2-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Editable / Display Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* EDIT / VIEW INFORMATION CARD */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Personal & Contact Details</h2>
                                        <p className="text-xs text-slate-500">
                                            {isEditing
                                                ? "Update your profile name and contact number below."
                                                : "Your active account profile and contact details."}
                                        </p>
                                    </div>
                                </div>

                                {!isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 text-xs font-semibold transition cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit Info</span>
                                    </button>
                                )}
                            </div>

                            {/* VIEW MODE */}
                            {!isEditing ? (
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Full Name */}
                                        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Full Name
                                            </p>
                                            <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <span>{profile?.name || "N/A"}</span>
                                            </p>
                                        </div>

                                        {/* Phone Number */}
                                        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Phone Number
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-emerald-500" />
                                                    <span>{profile?.phone || "N/A"}</span>
                                                </p>
                                                {profile?.phone && (
                                                    <a
                                                        href={`tel:${profile.phone}`}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 transition"
                                                        title="Call phone"
                                                    >
                                                        <PhoneCall className="w-3 h-3" />
                                                        Call
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Email Address (System Locked) */}
                                        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Email Address
                                                </p>
                                                <span
                                                    className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium"
                                                    title="Email is managed by Academy Admin for security reasons."
                                                >
                                                    <Lock className="w-3 h-3 text-slate-400" />
                                                    Locked
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    <span className="truncate">{profile?.email || "N/A"}</span>
                                                </p>
                                                {profile?.email && (
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(profile.email, "email_copy", "Email")}
                                                        className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                                                        title="Copy Email"
                                                    >
                                                        {copiedKey === "email_copy" ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Username */}
                                        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Portal Username
                                                </p>
                                                <span
                                                    className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium"
                                                    title="Username handle is permanent and unique."
                                                >
                                                    Unique Handle
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
                                                <AtSign className="w-4 h-4 text-indigo-500" />
                                                <span>{profile?.username || "N/A"}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* EDIT FORM MODE */
                                <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
                                    {hasUnsavedChanges && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 flex items-center justify-between text-xs text-amber-900">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                <span>You have unsaved changes in your profile.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Name input */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700">
                                                Full Name <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your full name"
                                                    disabled={saving}
                                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 ${formErrors.name
                                                        ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-200"
                                                        : "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-100"
                                                        }`}
                                                />
                                            </div>
                                            {formErrors.name ? (
                                                <p className="text-[11px] text-rose-600 font-medium">{formErrors.name}</p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400">Displayed on student leads and emails.</p>
                                            )}
                                        </div>

                                        {/* Phone input */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700">
                                                Phone Number <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your phone number (e.g. 9832312312)"
                                                    disabled={saving}
                                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 ${formErrors.phone
                                                        ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-200"
                                                        : "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-100"
                                                        }`}
                                                />
                                            </div>
                                            {formErrors.phone ? (
                                                <p className="text-[11px] text-rose-600 font-medium">{formErrors.phone}</p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400">Your direct contact number for student queries.</p>
                                            )}
                                        </div>

                                        {/* Read-only Email Field */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-xs font-bold text-slate-500">
                                                    Email Address
                                                </label>
                                                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                                    <Lock className="w-3 h-3" /> Read Only
                                                </span>
                                            </div>
                                            <div className="relative opacity-75">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={profile?.email || ""}
                                                    disabled
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-medium cursor-not-allowed"
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-400">Locked by Administrator.</p>
                                        </div>

                                        {/* Read-only Username Field */}
                                        {/* Editable Username Field */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700">
                                                Username Handle <span className="text-rose-500">*</span>
                                            </label>

                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                    <AtSign className="w-4 h-4" />
                                                </div>

                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your username"
                                                    disabled={saving}
                                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 ${formErrors.username
                                                        ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-200"
                                                        : "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-100"
                                                        }`}
                                                />
                                            </div>

                                            {formErrors.username ? (
                                                <p className="text-[11px] text-rose-600 font-medium">
                                                    {formErrors.username}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400">
                                                    Username used to log in to your account.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            disabled={saving}
                                            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    name: profile?.name || "",
                                                    phone: profile?.phone || "",
                                                });
                                                setFormErrors({});
                                            }}
                                            disabled={saving}
                                            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Reset
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <>
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Saving Updates...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-3.5 h-3.5" />
                                                    <span>Save Profile</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Sidebar / Quick Links / Authorization) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>Quick Actions</span>
                            </h3>

                            <div className="space-y-2">
                                <Link
                                    to="/counsellor/leads"
                                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">All Leads</p>
                                            <p className="text-[11px] text-slate-400">View and update active leads</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition" />
                                </Link>

                                <Link
                                    to="/counsellor/addlead"
                                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <UserPlus className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">Add New Lead</p>
                                            <p className="text-[11px] text-slate-400">Enroll new student inquiry</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition" />
                                </Link>

                                <Link
                                    to="/counsellor/students"
                                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">Enrolled Students</p>
                                            <p className="text-[11px] text-slate-400">Manage admission records</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition" />
                                </Link>

                                <Link
                                    to="/counsellor/emails"
                                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                            <Send className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">Send Emails</p>
                                            <p className="text-[11px] text-slate-400">Templates and student outreach</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition" />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CounsellorProfile;
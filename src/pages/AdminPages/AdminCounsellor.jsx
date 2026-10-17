import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Users,
    Search,
    RefreshCw,
    Phone,
    Mail,
    Calendar,
    UserCheck,
    X,
    RotateCcw,
    Sparkles,
    Copy,
    Check,
    Eye,
    PhoneCall,
    ShieldCheck,
    UserPlus,
    UserX,
    Power,
    BarChart3,
} from "lucide-react";
import { counsellorUrl, BASE_URL } from "../../config/config";

function AdminCounsellor() {
    const [counsellors, setCounsellors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

    // Filters state
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'

    // Modal state
    const [selectedCounsellor, setSelectedCounsellor] = useState(null);

    // Fetch counsellors from API
    const loadCounsellors = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const adminToken = localStorage.getItem("adminToken");
            const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

            const response = await axios.get(counsellorUrl.counsellorAll, { headers });

            const result = response.data;
            let list = [];
            if (Array.isArray(result)) {
                list = result;
            } else if (Array.isArray(result?.data)) {
                list = result.data;
            } else if (Array.isArray(result?.counsellors)) {
                list = result.counsellors;
            }

            setCounsellors(list);
        } catch (err) {
            console.error("Fetch counsellors error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Failed to load counsellors."
            );
            setCounsellors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCounsellors(true);
    }, [loadCounsellors]);

    // Handle status toggle (active <-> inactive)
    const handleToggleStatus = async (counsellor) => {
        const isCurrentlyActive = counsellor.status === "active";
        // Target status: if active -> "false", if inactive -> "true"
        const nextStatusParam = isCurrentlyActive ? "false" : "true";
        const nextStatusLabel = isCurrentlyActive ? "inactive" : "active";

        const url = counsellorUrl.statusUpdate
            ? counsellorUrl.statusUpdate(counsellor._id)
            : `${BASE_URL}/api/admin/counsellors/${counsellor._id}/status`;

        const payload = {
            status: nextStatusParam,
        };

        const adminToken = localStorage.getItem("adminToken");
        const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

        try {
            setTogglingId(counsellor._id);

            // Execute request: try PATCH, fallback to PUT or POST if needed
            let response;
            try {
                response = await axios.patch(url, payload, { headers });
            } catch (err) {
                if (err.response?.status === 405 || err.response?.status === 404) {
                    try {
                        response = await axios.put(url, payload, { headers });
                    } catch (putErr) {
                        if (putErr.response?.status === 405) {
                            response = await axios.post(url, payload, { headers });
                        } else {
                            throw putErr;
                        }
                    }
                } else {
                    throw err;
                }
            }

            // Optimistic / local state update
            setCounsellors((prev) =>
                prev.map((c) =>
                    c._id === counsellor._id
                        ? { ...c, status: nextStatusLabel }
                        : c
                )
            );

            // If selected counsellor modal is open, update it too
            setSelectedCounsellor((prev) =>
                prev && prev._id === counsellor._id
                    ? { ...prev, status: nextStatusLabel }
                    : prev
            );

            toast.success(
                response?.data?.message ||
                `Counsellor "${counsellor.name}" is now ${nextStatusLabel.toUpperCase()}!`
            );
        } catch (err) {
            console.error("Toggle counsellor status error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Failed to update counsellor status."
            );
        } finally {
            setTogglingId(null);
        }
    };

    // Copy to clipboard helper
    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName} to clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Date formatting helper
    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return String(isoString);
        }
    };

    // Relative time helper
    const getRelativeTime = (isoString) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);

            if (diffInSeconds < 60) return "just now";
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours}h ago`;
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 30) return `${diffInDays}d ago`;
            return formatDate(isoString);
        } catch {
            return "";
        }
    };

    // Initials helper
    const getInitials = (name) => {
        if (!name) return "CN";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Filtered list based on search & status
    const filteredCounsellors = useMemo(() => {
        return counsellors.filter((c) => {
            // Status filter
            if (statusFilter === "active" && c.status !== "active") return false;
            if (statusFilter === "inactive" && c.status !== "inactive") return false;

            // Search filter
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchName = c.name && c.name.toLowerCase().includes(q);
                const matchUsername = c.username && c.username.toLowerCase().includes(q);
                const matchEmail = c.email && c.email.toLowerCase().includes(q);
                const matchPhone = c.phone && c.phone.toLowerCase().includes(q);
                return matchName || matchUsername || matchEmail || matchPhone;
            }

            return true;
        });
    }, [counsellors, search, statusFilter]);

    // Statistics calculations
    const stats = useMemo(() => {
        const total = counsellors.length;
        const active = counsellors.filter((c) => c.status === "active").length;
        const inactive = counsellors.filter((c) => c.status === "inactive").length;
        const systemActive = counsellors.filter((c) => c.isActive).length;

        return {
            total,
            active,
            inactive,
            systemActive,
        };
    }, [counsellors]);

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* ========================================================================= */}
                {/* 1. HEADER SECTION */}
                {/* ========================================================================= */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                Admin Workspace
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">
                                Staff Management
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            All Counsellors
                        </h1>
                        {/* <p className="mt-1 text-sm text-slate-500">
                            Manage counsellor accounts, review assigned leads, and toggle system authorization statuses.
                        </p> */}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => loadCounsellors(true)}
                            disabled={loading}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
                            Refresh
                        </button>

                        <Link
                            to="/admin/counsellors/performance"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Performance Analytics
                        </Link>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. STATS SUMMARY CARDS */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {/* Stat 1: Total Counsellors */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Total Staff
                            </p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">
                            {stats.total}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            Registered counsellors
                        </p>
                    </div>

                    {/* Stat 2: Active Counsellors */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Active Status
                            </p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <UserCheck className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                            {stats.active}
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-600/80 font-medium">
                            Authorized to take leads
                        </p>
                    </div>

                    {/* Stat 3: Inactive Counsellors */}
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                                Inactive / On-Hold
                            </p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <UserX className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-amber-700">
                            {stats.inactive}
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-700/80 font-medium">
                            Access currently disabled
                        </p>
                    </div>

                    {/* Stat 4: System Active */}
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                System Verified
                            </p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-blue-700">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-blue-700">
                            {stats.systemActive}
                        </p>
                        <p className="mt-0.5 text-[11px] text-blue-700/80 font-medium">
                            System verified accounts
                        </p>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. SEARCH & STATUS FILTER TOOLBAR */}
                {/* ========================================================================= */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search counsellor by name, username, phone, or email..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                        </div>

                        {/* Status Filters & Reset */}
                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("all")}
                                    className={`cursor-pointer rounded-lg px-3 py-1.5 font-semibold transition ${statusFilter === "all"
                                        ? "bg-white text-slate-900 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    All ({counsellors.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("active")}
                                    className={`cursor-pointer rounded-lg px-3 py-1.5 font-semibold transition ${statusFilter === "active"
                                        ? "bg-white text-emerald-700 shadow-2xs"
                                        : "text-slate-600 hover:text-emerald-700"
                                        }`}
                                >
                                    Active ({stats.active})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("inactive")}
                                    className={`cursor-pointer rounded-lg px-3 py-1.5 font-semibold transition ${statusFilter === "inactive"
                                        ? "bg-white text-amber-700 shadow-2xs"
                                        : "text-slate-600 hover:text-amber-700"
                                        }`}
                                >
                                    Inactive ({stats.inactive})
                                </button>
                            </div>

                            {(search || statusFilter !== "all") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setStatusFilter("all");
                                    }}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 hover:border-rose-200"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. COUNSELLORS DIRECTORY TABLE */}
                {/* ========================================================================= */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="mt-3 text-xs font-semibold text-slate-600">
                                Loading counsellors roster...
                            </p>
                        </div>
                    ) : filteredCounsellors.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <Users className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-base font-bold text-slate-900">
                                No Counsellors Found
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                {search || statusFilter !== "all"
                                    ? "No counsellors match your active search and filter criteria."
                                    : "No counsellors registered yet."}
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-3">
                                {(search || statusFilter !== "all") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setStatusFilter("all");
                                        }}
                                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                                {/* <Link
                                    to="/counsellor/register"
                                    className="rounded-xl cursor-pointer bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                                >
                                    + Register Counsellor
                                </Link> */}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <th className="px-5 py-4">Counsellor Profile</th>
                                        <th className="px-5 py-4">Contact Information</th>
                                        <th className="px-5 py-4">Current Status</th>
                                        <th className="px-5 py-4">Status Toggle Action</th>
                                        <th className="px-5 py-4">Registered Date</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCounsellors.map((counsellor) => {
                                        const isActive = counsellor.status === "active";
                                        const isToggling = togglingId === counsellor._id;

                                        return (
                                            <tr
                                                key={counsellor._id}
                                                className="transition hover:bg-slate-50/60"
                                            >
                                                {/* Profile: Avatar, Name, Username, ID */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-blue-400 font-bold text-white shadow-2xs">
                                                            {getInitials(counsellor.name)}
                                                        </div>
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedCounsellor(counsellor)}
                                                                className="cursor-pointer text-left font-bold text-slate-900 hover:text-blue-600 transition"
                                                            >
                                                                {counsellor.name}
                                                            </button>
                                                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                                                                <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-md">
                                                                    @{counsellor.username || "username"}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(counsellor._id, "Counsellor ID")}
                                                                    className="cursor-pointer text-slate-400 hover:text-blue-600"
                                                                    title="Copy ID"
                                                                >
                                                                    {copiedField === "Counsellor ID" ? (
                                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="h-3 w-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contact: Phone & Email */}
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1 text-[11px] text-slate-500">
                                                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                                                            <Phone className="h-3 w-3 text-slate-400" />
                                                            <span>{counsellor.phone || "No phone"}</span>
                                                            {counsellor.phone && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(counsellor.phone, "Phone Number")}
                                                                    className="cursor-pointer text-slate-400 hover:text-blue-600"
                                                                    title="Copy phone"
                                                                >
                                                                    {copiedField === "Phone Number" ? (
                                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="h-3 w-3" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {counsellor.email ? (
                                                            <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[200px]">
                                                                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                                                <span className="truncate">{counsellor.email}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No email</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Current Status Badge */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${isActive
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                                                }`}
                                                        />
                                                        {isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </td>

                                                {/* Status Toggle Button (iOS-style switch) */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            disabled={isToggling}
                                                            onClick={() => handleToggleStatus(counsellor)}
                                                            title={isActive ? "Click to deactivate counsellor" : "Click to activate counsellor"}
                                                            className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 ${isActive ? "bg-emerald-500" : "bg-slate-300"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-6" : "translate-x-0"
                                                                    }`}
                                                            >
                                                                {isToggling ? (
                                                                    <RefreshCw className="h-2.5 w-2.5 animate-spin text-slate-600" />
                                                                ) : isActive ? (
                                                                    <Power className="h-2.5 w-2.5 text-emerald-600" />
                                                                ) : (
                                                                    <Power className="h-2.5 w-2.5 text-slate-400" />
                                                                )}
                                                            </span>
                                                        </button>

                                                        <span className="text-[11px] font-semibold text-slate-600">
                                                            {isToggling
                                                                ? "Updating..."
                                                                : isActive
                                                                    ? "Active"
                                                                    : "Inactive"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Registration Date */}
                                                <td className="px-5 py-4 text-slate-600">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{formatDate(counsellor.createdAt)}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        {getRelativeTime(counsellor.createdAt)}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {counsellor.phone && (
                                                            <a
                                                                href={`tel:${counsellor.phone}`}
                                                                className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                                                                title="Call"
                                                            >
                                                                <PhoneCall className="h-3.5 w-3.5" />
                                                            </a>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedCounsellor(counsellor)}
                                                            title="View Profile Details"
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-slate-300 hover:text-blue-700"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                                                            Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* 5. COUNSELLOR DETAIL DRAWER/MODAL */}
                {/* ========================================================================= */}
                {selectedCounsellor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7 space-y-5">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setSelectedCounsellor(null)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Header Info */}
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-xl font-bold text-white shadow-md shadow-indigo-500/20">
                                        {getInitials(selectedCounsellor.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            {selectedCounsellor.name}
                                        </h3>
                                        <p className="text-xs text-blue-600 font-semibold">
                                            @{selectedCounsellor.username}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                            ID: {selectedCounsellor._id}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Control Card */}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Login Authorization
                                    </p>
                                    <p className="font-bold text-slate-900 capitalize text-sm mt-0.5">
                                        Status: {selectedCounsellor.status || "inactive"}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        {selectedCounsellor.status === "active"
                                            ? "Counsellor can login and receive leads."
                                            : "Counsellor login is blocked."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={togglingId === selectedCounsellor._id}
                                    onClick={() => handleToggleStatus(selectedCounsellor)}
                                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedCounsellor.status === "active"
                                        ? "bg-emerald-500"
                                        : "bg-slate-300"
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${selectedCounsellor.status === "active"
                                            ? "translate-x-7"
                                            : "translate-x-0"
                                            }`}
                                    >
                                        {togglingId === selectedCounsellor._id ? (
                                            <RefreshCw className="h-3 w-3 animate-spin text-slate-600" />
                                        ) : (
                                            <Power className="h-3 w-3 text-slate-600" />
                                        )}
                                    </span>
                                </button>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Phone Number
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1 flex items-center justify-between">
                                        <span>{selectedCounsellor.phone || "N/A"}</span>
                                        {selectedCounsellor.phone && (
                                            <a
                                                href={`tel:${selectedCounsellor.phone}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                <PhoneCall className="h-3.5 w-3.5" />
                                            </a>
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Email Address
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1 truncate">
                                        {selectedCounsellor.email || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Account Created
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1">
                                        {formatDate(selectedCounsellor.createdAt)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Last Updated
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1">
                                        {formatDate(selectedCounsellor.updatedAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Close Action */}
                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCounsellor(null)}
                                    className="cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminCounsellor;

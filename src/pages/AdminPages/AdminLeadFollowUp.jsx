import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    ArrowLeft, Phone, Mail, Calendar, Clock, User, UserCheck, BookOpen, Share2,
    CalendarClock, Copy, Check, Sparkles, RefreshCw, ChevronRight, Search,
    History, Send, Bell, ArrowUpDown, Filter, AlertCircle, CheckCircle2, MessageSquare
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { leadUrl } from "../../config/config";

const CANDIDATE_STATUSES = [
    { value: "ongoing", label: "Ongoing", color: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20" },
    { value: "interested", label: "Interested", color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20" },
    { value: "not interested", label: "Not Interested", color: "bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20" },
    { value: "not useful", label: "Not Useful", color: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20" },
    { value: "not responding", label: "Not Responding", color: "bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20" },
    { value: "disconnect call", label: "Disconnect Call", color: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20" },
    { value: "closed", label: "Closed", color: "bg-red-50 text-red-700 border-red-200 ring-red-500/20" },
];

const PRESET_REMARKS = [
    "📞 Call Connected - Candidate showed strong interest in curriculum.",
    "⏳ Candidate was busy; requested a follow-up callback later.",
    "❌ Phone not answered / Switched off. Scheduled next follow-up call.",
    "📑 Shared course syllabus, fee structure & batch timings on WhatsApp/Email.",
    "🏛️ Invited candidate for campus walk-through and trial session.",
    "💳 Discussed admission procedure, installments & seat reservation.",
];

const formatToLocalDateTime = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getTodayStartDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T00:00`;
};

const isValidObjectId = (val) => Boolean(val) && /^[0-9a-fA-F]{24}$/.test(val);

function AdminLeadFollowUp() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // If ID is not a valid 24-character hex ObjectId, route does not exist -> redirect to Homepage
    if (!isValidObjectId(id)) {
        return <Navigate to="/" replace />;
    }

    // Lead state
    const [lead, setLead] = useState(location.state?.lead || null);
    const [loading, setLoading] = useState(!location.state?.lead);
    const [refreshing, setRefreshing] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    // Filters and sorting
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all"); // all, with_next_call, no_next_call, reminder_sent
    const [sortOrder, setSortOrder] = useState("desc"); // desc (newest first), asc (oldest first)

    // Modal state for adding follow-up
    const [showAddModal, setShowAddModal] = useState(false);
    const [followUpData, setFollowUpData] = useState(() => {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return {
            description: "",
            date: formatToLocalDateTime(now),
            nextCallDate: formatToLocalDateTime(nextWeek),
        };
    });
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    // Initial load and reload lead details (same GET API as AdminLeadDetails.jsx)
    const loadLeadData = useCallback(async (isRefresh = false) => {
        if (!id) return;
        if (isRefresh) {
            setRefreshing(true);
        } else if (!lead) {
            setLoading(true);
        }

        try {
            const adminToken = localStorage.getItem("adminToken");
            const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

            const response = await axios.get(`${leadUrl.lead}/${id}`, { headers });
            const leadData =
                response.data?.data ||
                response.data?.lead ||
                response.data;

            if (leadData && (leadData._id || leadData.name)) {
                setLead(leadData);
            }
        } catch (err) {
            console.error("Fetch lead follow-ups error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, lead]);

    useEffect(() => {
        loadLeadData();
    }, [id]);

    // Copy to clipboard helper
    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName} to clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Quick set next call date (+1d, +3d, +7d)
    const setQuickNextCall = (days) => {
        const nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        setFollowUpData((prev) => ({
            ...prev,
            nextCallDate: formatToLocalDateTime(nextDate),
        }));
    };

    // Submit new follow-up
    const handleFollowUpSubmit = async (e) => {
        e.preventDefault();
        if (!followUpData.description.trim()) {
            toast.error("Please enter a follow-up description.");
            return;
        }
        if (!followUpData.date) {
            toast.error("Please select the call date & time.");
            return;
        }

        const minDateTime = getTodayStartDateTime();
        if (followUpData.date < minDateTime) {
            toast.error("Call Date & Time cannot be a past date.");
            return;
        }
        if (followUpData.nextCallDate && followUpData.nextCallDate < minDateTime) {
            toast.error("Next Follow-up Date cannot be a past date.");
            return;
        }
        if (followUpData.nextCallDate && followUpData.nextCallDate < followUpData.date) {
            toast.error("Next Follow-up Date cannot be earlier than Call Date & Time.");
            return;
        }

        const adminToken = localStorage.getItem("adminToken");
        if (!adminToken) {
            toast.error("Admin token not found. Please log in.");
            return;
        }

        try {
            setSubmittingFollowUp(true);

            const payload = {
                description: followUpData.description.trim(),
                date: new Date(followUpData.date).toISOString(),
                nextCallDate: followUpData.nextCallDate
                    ? new Date(followUpData.nextCallDate).toISOString()
                    : new Date().toISOString(),
            };

            const url = `${leadUrl.lead}/${id}/follow-ups`;
            const response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            if (response.data?.success === false) {
                toast.error(response.data?.message || "Failed to add follow-up.");
                return;
            }

            toast.success(response.data?.message || "Follow-up added successfully!");

            // Reset form
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            setFollowUpData({
                description: "",
                date: formatToLocalDateTime(now),
                nextCallDate: formatToLocalDateTime(nextWeek),
            });
            setShowAddModal(false);

            // Reload fresh lead details
            await loadLeadData(true);
        } catch (err) {
            console.error("Follow-up error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Unable to add follow-up."
            );
        } finally {
            setSubmittingFollowUp(false);
        }
    };

    // Date formatting utilities
    const formatDateTime = (isoString) => {
        if (!isoString) return "N/A";
        try {
            const d = new Date(isoString);
            return d.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return String(isoString);
        }
    };

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
            const diffInMonths = Math.floor(diffInDays / 30);
            return `${diffInMonths}mo ago`;
        } catch {
            return "";
        }
    };

    const getInitials = (name) => {
        if (!name) return "LD";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Status config
    const statusConfig = useMemo(() => {
        if (!lead) return CANDIDATE_STATUSES[0];
        return (
            CANDIDATE_STATUSES.find(
                (s) => s.value.toLowerCase() === (lead.candidateStatus || "").toLowerCase()
            ) || {
                label: lead.candidateStatus || "Ongoing",
                color: "bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20",
            }
        );
    }, [lead]);

    // Raw remarks list sorted descending by date
    const allRemarks = useMemo(() => {
        if (!lead || !Array.isArray(lead.remarks)) return [];
        return [...lead.remarks];
    }, [lead]);

    // Next upcoming call calculation
    const nextUpcomingCall = useMemo(() => {
        if (!allRemarks.length) return null;
        // Sort newest first to inspect latest remarks with nextCallDate
        const sorted = [...allRemarks].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        const withNextCall = sorted.find((r) => r.nextCallDate);
        if (!withNextCall) return null;

        const nextDate = new Date(withNextCall.nextCallDate);
        const now = new Date();
        const isPast = nextDate < now;
        const isToday = nextDate.toDateString() === now.toDateString();

        return {
            date: withNextCall.nextCallDate,
            isPast,
            isToday,
            calledBy: withNextCall.calledBy?.name || "Staff",
        };
    }, [allRemarks]);

    // Filtered and sorted remarks
    const filteredRemarks = useMemo(() => {
        let list = [...allRemarks];

        // Sort order
        list.sort((a, b) => {
            const timeA = new Date(a.date || 0).getTime();
            const timeB = new Date(b.date || 0).getTime();
            return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
        });

        // Filter type
        if (filterType === "with_next_call") {
            list = list.filter((r) => Boolean(r.nextCallDate));
        } else if (filterType === "no_next_call") {
            list = list.filter((r) => !r.nextCallDate);
        } else if (filterType === "reminder_sent") {
            list = list.filter((r) => Boolean(r.reminderSent));
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (r) =>
                    (r.description && r.description.toLowerCase().includes(q)) ||
                    (r.calledBy?.name && r.calledBy.name.toLowerCase().includes(q))
            );
        }

        return list;
    }, [allRemarks, sortOrder, filterType, searchQuery]);

    // Loading Skeleton State
    if (loading && !lead) {
        return (
            <div className="min-h-screen bg-slate-50/60 p-4 sm:p-8 space-y-6">
                <div className="mx-auto max-w-7xl animate-pulse space-y-6">
                    <div className="h-8 w-48 rounded-lg bg-slate-200" />
                    <div className="h-44 rounded-3xl bg-slate-200" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="h-28 rounded-2xl bg-slate-200" />
                        <div className="h-28 rounded-2xl bg-slate-200" />
                        <div className="h-28 rounded-2xl bg-slate-200" />
                        <div className="h-28 rounded-2xl bg-slate-200" />
                    </div>
                    <div className="h-96 rounded-2xl bg-slate-200" />
                </div>
            </div>
        );
    }

    // Lead Not Found State -> Redirect to Homepage
    if (!lead) {
        return <Navigate to="/" replace />;
    }

    const coursesList = Array.isArray(lead.enrolledCourses) && lead.enrolledCourses.length > 0
        ? lead.enrolledCourses
        : lead.enrolledCourse
            ? [lead.enrolledCourse]
            : [];

    return (
        <section className="min-h-screen bg-[#f8fafc] pb-16 pt-6 px-4 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* 1. TOP BREADCRUMBS & NAVIGATION */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Link to="/admin/students" className="hover:text-blue-600 transition">
                            Student
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <Link to="/admin/leads" className="hover:text-blue-600 transition">
                            Leads
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <Link to={`/admin/leads/${id}`} state={{ lead }} className="hover:text-blue-600 transition truncate max-w-[160px]">
                            {lead.name}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900">
                            Follow-up History
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to={`/admin/leads/${id}`}
                            state={{ lead }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
                            <span>Lead Details</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => loadLeadData(true)}
                            disabled={refreshing}
                            title="Refresh data"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-60"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition"
                        >
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>Log Follow-up</span>
                        </button>
                    </div>
                </div>

                {/* 2. HERO LEAD SUMMARY CARD */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />
                    <div className="pointer-events-none absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                            <div className="relative">
                                <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-700 text-2xl font-black tracking-wider text-white shadow-lg shadow-blue-500/20">
                                    {getInitials(lead.name)}
                                </div>
                                {lead.isActive && (
                                    <span
                                        title="Active Lead"
                                        className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white text-white text-[10px]"
                                    >
                                        ✓
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                        {lead.name}
                                    </h1>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize ring-1 ${statusConfig.color}`}
                                    >
                                        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                                        {statusConfig.label}
                                    </span>
                                    {lead.source?.name && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                            <Share2 className="h-3 w-3" />
                                            {lead.source.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                                    {lead.phone && (
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`tel:${lead.phone}`}
                                                className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-blue-600 transition"
                                            >
                                                <Phone className="h-3.5 w-3.5 text-blue-600" />
                                                <span>{lead.phone}</span>
                                            </a>
                                            <a
                                                href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-emerald-600 hover:text-emerald-700 transition"
                                                title="Open WhatsApp"
                                            >
                                                <FaWhatsapp className="h-4 w-4" />
                                            </a>
                                        </div>
                                    )}

                                    {lead.email && (
                                        <div className="flex items-center gap-1.5">
                                            <a
                                                href={`mailto:${lead.email}`}
                                                className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-blue-600 transition"
                                            >
                                                <Mail className="h-3.5 w-3.5 text-blue-600" />
                                                <span>{lead.email}</span>
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(lead.email, "Email")}
                                                className="text-slate-400 hover:text-blue-600 transition"
                                            >
                                                {copiedField === "Email" ? (
                                                    <Check className="h-3 w-3 text-emerald-600" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {lead.assignedCounsellor?.name && (
                                        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-0.5 text-slate-700 font-medium">
                                            <UserCheck className="h-3 w-3 text-emerald-600" />
                                            <span>Counsellor: {lead.assignedCounsellor.name}</span>
                                        </div>
                                    )}
                                </div>

                                {coursesList.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Courses:
                                        </span>
                                        {coursesList.map((course, idx) => (
                                            <span
                                                key={idx}
                                                className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                                            >
                                                {course.name || course}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top quick stats badge */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0 gap-2">
                            <div className="text-left lg:text-right">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Total Logs
                                </span>
                                <div className="text-2xl font-black text-slate-900">
                                    {allRemarks.length}
                                </div>
                            </div>
                            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                                Full History View
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. QUICK STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat 1: Total Follow-ups */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Total Follow-ups
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <History className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">
                                {allRemarks.length}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">interactions</span>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">
                            Logged since lead registration
                        </p>
                    </div>

                    {/* Stat 2: Next Follow-up Call */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Next Follow-up
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <CalendarClock className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            {nextUpcomingCall ? (
                                <div>
                                    <div className="text-sm font-bold text-slate-900">
                                        {formatDateTime(nextUpcomingCall.date)}
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        {nextUpcomingCall.isPast ? (
                                            <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                                Overdue
                                            </span>
                                        ) : nextUpcomingCall.isToday ? (
                                            <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                                Due Today
                                            </span>
                                        ) : (
                                            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                Upcoming
                                            </span>
                                        )}
                                        <span className="text-[11px] text-slate-400 truncate">
                                            By {nextUpcomingCall.calledBy}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <span className="text-sm font-semibold text-slate-400 italic">
                                        None scheduled
                                    </span>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Use "Log Follow-up" to schedule
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stat 3: Last Contact Date */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Last Contacted
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            {allRemarks.length > 0 ? (
                                <div>
                                    <div className="text-sm font-bold text-slate-900">
                                        {getRelativeTime(allRemarks[allRemarks.length - 1]?.date || allRemarks[0]?.date)}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {formatDateTime(allRemarks[allRemarks.length - 1]?.date || allRemarks[0]?.date)}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <span className="text-sm font-semibold text-slate-400 italic">
                                        No contact yet
                                    </span>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Awaiting first interaction
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stat 4: Handled Counsellor */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Handling Counsellor
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <UserCheck className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            {lead.assignedCounsellor ? (
                                <div>
                                    <div className="text-sm font-bold text-slate-900 truncate">
                                        {lead.assignedCounsellor.name}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500 truncate">
                                        @{lead.assignedCounsellor.username || "counsellor"}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <span className="text-sm font-semibold text-slate-400 italic">
                                        Unassigned
                                    </span>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Admin management
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. MAIN CARD: ALL FOLLOW-UPS TIMELINE & ENGINE */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
                    {/* Header Toolbar */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <span>All Lead Follow-ups</span>
                                    <span className="rounded-full bg-blue-100/70 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                                        {filteredRemarks.length}
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Comprehensive interaction timeline and call logs for {lead.name}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition self-start sm:self-auto"
                            >
                                <CalendarClock className="h-3.5 w-3.5" />
                                <span>Add New Follow-up</span>
                            </button>
                        </div>

                        {/* Search and Filters Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            {/* Search input */}
                            <div className="relative flex-1 min-w-[220px]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search notes or staff name..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Filter dropdown */}
                                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setFilterType("all")}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${filterType === "all" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        All ({allRemarks.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType("with_next_call")}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${filterType === "with_next_call" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        With Next Call
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType("reminder_sent")}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${filterType === "reminder_sent" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Reminder Sent
                                    </button>
                                </div>

                                {/* Sort Order button */}
                                <button
                                    type="button"
                                    onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                                    title="Toggle sort direction"
                                >
                                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                                    <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Timeline List of ALL follow-ups */}
                    <div className="mt-6">
                        {allRemarks.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <CalendarClock className="h-7 w-7" />
                                </div>
                                <h3 className="mt-3 text-base font-bold text-slate-900">
                                    No Follow-up Remarks Logged Yet
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                                    This lead currently has no recorded follow-ups. Click the button below to log the first discussion.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(true)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition"
                                >
                                    <CalendarClock className="h-4 w-4" />
                                    <span>Log First Follow-up</span>
                                </button>
                            </div>
                        ) : filteredRemarks.length === 0 ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-8 text-center">
                                <Search className="mx-auto h-8 w-8 text-slate-400" />
                                <h4 className="mt-2 text-sm font-bold text-slate-800">No matching follow-ups found</h4>
                                <p className="mt-1 text-xs text-slate-500">
                                    Try adjusting your search query or filter criteria.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterType("all");
                                    }}
                                    className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-slate-200/80 pl-6 ml-3 space-y-6 min-w-0">
                                {filteredRemarks.map((remark, idx) => {
                                    const callerName = remark.calledBy?.name || "Staff";
                                    const itemNumber = sortOrder === "desc"
                                        ? filteredRemarks.length - idx
                                        : idx + 1;

                                    return (
                                        <div
                                            key={remark._id || idx}
                                            className="group relative min-w-0"
                                        >
                                            {/* Node indicator */}
                                            <span className="absolute -left-[31px] top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-blue-100 border-2 border-blue-600">
                                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                            </span>

                                            {/* Follow-up card */}
                                            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm min-w-0">
                                                {/* Card Header */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600">
                                                            #{itemNumber}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                                                            <User className="h-3 w-3" />
                                                            {callerName}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            {getRelativeTime(remark.date)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>{formatDateTime(remark.date)}</span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(remark.description, `Follow-up #${itemNumber}`)}
                                                            className="text-slate-400 hover:text-blue-600 transition"
                                                            title="Copy note"
                                                        >
                                                            {copiedField === `Follow-up #${itemNumber}` ? (
                                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Discussion Description */}
                                                <p className="mt-3.5 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-medium break-words [overflow-wrap:anywhere] [word-break:break-word]">
                                                    {remark.description}
                                                </p>

                                                {/* Card Footer with Next Call Schedule & Reminder status */}
                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                                                    {remark.nextCallDate ? (
                                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                            <CalendarClock className="h-4 w-4 text-blue-600" />
                                                            <span>Next Scheduled Call:</span>
                                                            <span className="rounded-md bg-blue-100/70 px-2.5 py-0.5 text-blue-800 font-bold">
                                                                {formatDateTime(remark.nextCallDate)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">
                                                            No follow-up call scheduled
                                                        </span>
                                                    )}

                                                    {remark.reminderSent && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                            <Bell className="h-3 w-3" />
                                                            Reminder Sent
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL: ADD NEW FOLLOW-UP */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                ✕
                            </button>

                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <CalendarClock className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Log Follow-up Call
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Lead: <span className="font-semibold text-slate-800">{lead.name}</span>
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleFollowUpSubmit} className="mt-4 space-y-4">
                                {/* Preset Chips */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        Quick Notes Template:
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRESET_REMARKS.map((preset, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() =>
                                                    setFollowUpData((prev) => ({
                                                        ...prev,
                                                        description: prev.description
                                                            ? `${prev.description}\n${preset}`
                                                            : preset,
                                                    }))
                                                }
                                                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                                            >
                                                {preset.slice(0, 30)}...
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Follow-up Notes / Discussion Details <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows="3"
                                        required
                                        value={followUpData.description}
                                        onChange={(e) =>
                                            setFollowUpData((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Discussed courses, fees, interest level, next call agenda..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Call Date &amp; Time <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            min={getTodayStartDateTime()}
                                            value={followUpData.date}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val && val < getTodayStartDateTime()) {
                                                    toast.error("Call Date & Time cannot be a past date.");
                                                    return;
                                                }
                                                setFollowUpData((prev) => ({
                                                    ...prev,
                                                    date: val,
                                                }));
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                                Next Call Schedule
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickNextCall(1)}
                                                    className="cursor-pointer text-[10px] font-bold text-blue-600 hover:underline"
                                                >
                                                    +1d
                                                </button>
                                                <span className="text-slate-300">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickNextCall(3)}
                                                    className="cursor-pointer text-[10px] font-bold text-blue-600 hover:underline"
                                                >
                                                    +3d
                                                </button>
                                                <span className="text-slate-300">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickNextCall(7)}
                                                    className="cursor-pointer text-[10px] font-bold text-blue-600 hover:underline"
                                                >
                                                    +7d
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="datetime-local"
                                            min={followUpData.date || getTodayStartDateTime()}
                                            value={followUpData.nextCallDate}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val && val < getTodayStartDateTime()) {
                                                    toast.error("Next Follow-up Date cannot be a past date.");
                                                    return;
                                                }
                                                setFollowUpData((prev) => ({
                                                    ...prev,
                                                    nextCallDate: val,
                                                }));
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingFollowUp}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {submittingFollowUp ? (
                                            <>
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-3.5 w-3.5" />
                                                <span>Save Follow-up</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminLeadFollowUp;
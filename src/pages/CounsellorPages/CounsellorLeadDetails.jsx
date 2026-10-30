import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    ArrowLeft, Phone, Mail, Calendar, Clock, MapPin, User, UserCheck, BookOpen, Share2, CheckCircle2, AlertCircle, CalendarClock, Copy,
    Check, Sparkles, MessageSquare, RefreshCw, UserPlus, ChevronRight, PhoneCall, Search, History, FileText, Send, Bell,
    SquarePen,
} from "lucide-react";
import { leadUrl } from "../../config/config";
import { FaWhatsapp } from "react-icons/fa";

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

function CounsellorLeadDetails() {
    const { id } = useParams();
    const location = useLocation();

    // Lead state
    const [lead, setLead] = useState(location.state?.lead || null);
    const [loading, setLoading] = useState(!location.state?.lead);
    const [refreshing, setRefreshing] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    // Follow-up state
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
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [remarkSearch, setRemarkSearch] = useState("");

    // Convert to student state
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [convertRemarks, setConvertRemarks] = useState(
        "yes, this lead has been converted to student"
    );
    const [submittingConvert, setSubmittingConvert] = useState(false);
    const counsellorToken = localStorage.getItem("token");
    // Initial load lead details
    useEffect(() => {
        if (!id) return;
        let isCancelled = false;

        const loadLead = async () => {
            try {
                const headers = counsellorToken ? { Authorization: `Bearer ${counsellorToken}` } : {};

                const response = await axios.get(`${leadUrl.lead}/${id}`, { headers });
                const leadData =
                    response.data?.data ||
                    response.data?.lead ||
                    response.data;

                if (!isCancelled && leadData && (leadData._id || leadData.name)) {
                    setLead(leadData);
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error("Fetch lead details error:", err);
                    toast.error(
                        err.response?.data?.message || err.message || "Failed to load lead details"
                    );
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        };

        loadLead();

        return () => {
            isCancelled = true;
        };
    }, [id]);

    // Manual refresh or after follow-up / convert
    const reloadLead = useCallback(async () => {
        if (!id) return;
        setRefreshing(true);
        try {
            const headers = counsellorToken ? { Authorization: `Bearer ${counsellorToken}` } : {};

            const response = await axios.get(`${leadUrl.lead}/${id}`, { headers });
            const leadData =
                response.data?.data ||
                response.data?.lead ||
                response.data;

            if (leadData && (leadData._id || leadData.name)) {
                setLead(leadData);
            }
        } catch (err) {
            console.error("Reload lead error:", err);
            toast.error(err.response?.data?.message || err.message || "Failed to refresh lead");
        } finally {
            setRefreshing(false);
        }
    }, [id]);

    // Copy to clipboard helper
    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName} to clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Quick set next call date helper (+1d, +3d, +7d)
    const setQuickNextCall = (days) => {
        const nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        setFollowUpData((prev) => ({
            ...prev,
            nextCallDate: formatToLocalDateTime(nextDate),
        }));
    };

    // Handle Follow-up Submit
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

        if (!counsellorToken) {
            toast.error("Session expired. Please log in.");
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
                    Authorization: `Bearer ${counsellorToken}`,
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
            setShowFollowUpModal(false);

            // Reload fresh lead details
            await reloadLead();
        } catch (err) {
            console.error("Follow-up error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Unable to add follow-up."
            );
        } finally {
            setSubmittingFollowUp(false);
        }
    };

    // Handle Convert Lead to Student
    const handleConvertSubmit = async (e) => {
        e.preventDefault();


        if (!counsellorToken) {
            toast.error("Session expired. Please log in.");
            return;
        }

        try {
            setSubmittingConvert(true);

            const payload = {
                remarks: convertRemarks.trim(),
            };

            const url = `${leadUrl.lead}/${id}/convert`;
            const response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${counsellorToken}`,
                },
            });

            if (response.data?.success === false) {
                toast.error(response.data?.message || "Failed to convert lead.");
                return;
            }

            toast.success(response.data?.message || "Lead converted to student successfully!");
            setShowConvertModal(false);
            await reloadLead();
        } catch (err) {
            console.error("Convert error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Unable to convert lead."
            );
        } finally {
            setSubmittingConvert(false);
        }
    };

    // Date formatting utilities
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

    // Calculate age from DOB
    const calculateAge = (dobString) => {
        if (!dobString) return null;
        try {
            const dob = new Date(dobString);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            return age > 0 ? `${age} years` : null;
        } catch {
            return null;
        }
    };

    // Initials helper
    const getInitials = (name) => {
        if (!name) return "LD";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Status details
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

    const isConverted = useMemo(() => {
        if (!lead) return false;
        return lead.conversionStatus === "approved" || Boolean(lead.convertedStudent);
    }, [lead]);

    // Remarks sorted descending by call date
    const sortedRemarks = useMemo(() => {
        if (!lead || !Array.isArray(lead.remarks)) return [];
        const list = [...lead.remarks];
        return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [lead]);

    // Filtered remarks by search query
    const filteredRemarks = useMemo(() => {
        if (!remarkSearch.trim()) return sortedRemarks;
        const q = remarkSearch.toLowerCase();
        return sortedRemarks.filter(
            (r) =>
                (r.description && r.description.toLowerCase().includes(q)) ||
                (r.calledBy?.name && r.calledBy.name.toLowerCase().includes(q))
        );
    }, [sortedRemarks, remarkSearch]);

    // Latest upcoming call calculation
    const nextUpcomingCall = useMemo(() => {
        if (!sortedRemarks.length) return null;
        // Check latest remark with nextCallDate
        const withNextCall = sortedRemarks.find((r) => r.nextCallDate);
        if (!withNextCall) return null;

        const nextDate = new Date(withNextCall.nextCallDate);
        const now = new Date();
        const isPast = nextDate < now;
        const isToday = nextDate.toDateString() === now.toDateString();

        return {
            date: withNextCall.nextCallDate,
            isPast,
            isToday,
            calledBy: withNextCall.calledBy?.name || "Counsellor",
        };
    }, [sortedRemarks]);

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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5 space-y-6">
                            <div className="h-72 rounded-2xl bg-slate-200" />
                            <div className="h-48 rounded-2xl bg-slate-200" />
                        </div>
                        <div className="lg:col-span-7 space-y-6">
                            <div className="h-64 rounded-2xl bg-slate-200" />
                            <div className="h-96 rounded-2xl bg-slate-200" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Lead Not Found State
    if (!lead) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Lead Not Found</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        The lead with ID <span className="font-mono text-slate-700">{id}</span> could not be loaded or may have been removed.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Link
                            to="/counsellor/leads"
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Return to All Leads
                        </Link>
                        <button
                            type="button"
                            onClick={() => reloadLead()}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const coursesList = Array.isArray(lead.enrolledCourses) && lead.enrolledCourses.length > 0
        ? lead.enrolledCourses
        : lead.enrolledCourse
            ? [lead.enrolledCourse]
            : [];

    return (
        <section className="min-h-screen bg-[#f8fafc] pb-16 pt-6 px-4 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* ========================================================================= */}
                {/* 1. TOP BREADCRUMB & QUICK ACTION NAV */}
                {/* ========================================================================= */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Link
                            to="/counsellor/students"
                            className="hover:text-blue-600 transition"
                        >
                            Students
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <Link
                            to="/counsellor/leads"
                            className="hover:text-blue-600 transition"
                        >
                            Leads
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {lead.name}
                        </span>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to="/counsellor/leads"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
                            <span>Back to Leads</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => reloadLead()}
                            disabled={refreshing}
                            title="Refresh data"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-60"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        <Link
                            to={`/counsellor/leads/edit/${id}`}
                            state={{ lead }}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                        >
                            <SquarePen className="h-3.5 w-3.5 text-amber-600" />
                            <span>Edit Lead</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setShowFollowUpModal(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition"
                        >
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>Log Follow-up</span>
                        </button>

                        {/* {!isConverted ? (
                            <button
                                type="button"
                                onClick={() => setShowConvertModal(true)}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>Convert to Student</span>
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200 px-3.5 py-2 text-xs font-bold text-purple-700">
                                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                                <span>Converted to Student</span>
                            </span>
                        )} */}
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. HERO PROFILE HEADER BANNER */}
                {/* ========================================================================= */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                    {/* Background Decorative Gradient Blobs */}
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />
                    <div className="pointer-events-none absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        {/* Profile Info */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-400 via-blue-500 to-blue-600 text-2xl font-semibold tracking-wider text-white shadow-lg shadow-indigo-500/20">
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

                            {/* Details */}
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                        {lead.name}
                                    </h1>

                                    {/* Candidate Status Badge */}
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize ring-1 ${statusConfig.color}`}
                                    >
                                        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                                        {statusConfig.label}
                                    </span>

                                    {/* Candidate Type Badge */}
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        {lead.candidateType || "lead"}
                                    </span>

                                    {/* Source Badge */}
                                    {lead.source?.name && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                            <Share2 className="h-3 w-3" />
                                            {lead.source.name}
                                        </span>
                                    )}
                                </div>

                                {/* ID and Registration Date */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                    {/*<div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-slate-400">ID:</span>
                                        <span className="font-mono font-medium text-slate-700">
                                            {lead._id}
                                        </span> 
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(lead._id, "Lead ID")}
                                            className="cursor-pointer text-slate-400 hover:text-blue-600 transition"
                                            title="Copy Lead ID"
                                        >
                                            {copiedField === "Lead ID" ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </div>*/}

                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Registered: {formatDate(lead.date || lead.createdAt)}</span>
                                    </div>

                                    {lead.fullAddress && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="truncate max-w-[220px]">{lead.fullAddress}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Contact Bar */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
                            {lead.phone && (
                                <a
                                    href={`tel:${lead.phone}`}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100"
                                >
                                    <PhoneCall className="h-4 w-4 text-blue-600" />
                                    <span>Call ({lead.phone})</span>
                                </a>
                            )}

                            {lead.phone && (
                                <a
                                    href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-2xs transition hover:bg-emerald-100"
                                >
                                    <FaWhatsapp className="h-4 w-4 text-emerald-600" />
                                    <span>WhatsApp</span>
                                </a>
                            )}

                            {lead.email && (
                                <a
                                    href={`mailto:${lead.email}`}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100"
                                >
                                    <Mail className="h-4 w-4 text-slate-500" />
                                    <span>Email</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. QUICK STATS CARDS (4-GRID) */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat 1: Lead Status */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Candidate Status
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-lg font-black capitalize text-slate-900">
                                {lead.candidateStatus || "Ongoing"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {lead.statusChangedBy?.name ? (
                                    <>
                                        Updated by <span className="font-semibold text-slate-700">{lead.statusChangedBy.name}</span>
                                    </>
                                ) : (
                                    "Active Pipeline Prospect"
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Stat 2: Next Follow-up Call */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Next Follow-up
                            </span>
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${nextUpcomingCall?.isPast
                                ? "bg-rose-50 text-rose-600"
                                : nextUpcomingCall?.isToday
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-indigo-50 text-indigo-600"
                                }`}>
                                <CalendarClock className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            {nextUpcomingCall ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <p className="text-base font-bold text-slate-900 truncate">
                                            {formatDate(nextUpcomingCall.date)}
                                        </p>
                                        {nextUpcomingCall.isPast && (
                                            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-700">
                                                Overdue
                                            </span>
                                        )}
                                        {nextUpcomingCall.isToday && (
                                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                                                Today
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Time: {new Date(nextUpcomingCall.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-base font-bold text-slate-400">None Scheduled</p>
                                    <p className="mt-0.5 text-xs text-slate-400">Log a follow-up below</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stat 3: Total Remarks / Interactions */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Follow-up Calls
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400 text-white">
                                <History className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-lg font-black text-slate-900">
                                {sortedRemarks.length} {sortedRemarks.length === 1 ? "Interaction" : "Interactions"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                                {sortedRemarks[0]?.date
                                    ? `Latest: ${getRelativeTime(sortedRemarks[0].date)}`
                                    : "No calls recorded yet"}
                            </p>
                        </div>
                    </div>

                    {/* Stat 4: Assigned Counsellor */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Assigned Counsellor
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <UserCheck className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-lg font-black text-slate-900 truncate">
                                {lead.assignedCounsellor?.name || "Unassigned"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                                {lead.assignedCounsellor?.email || lead.assignedCounsellor?.phone || "No contact info"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. MAIN DETAILS & TIMELINE GRID (2 COLUMNS) */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Lead Information & Metadata (5 of 12) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* CARD 1: CONTACT & PERSONAL INFORMATION */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                        Contact &amp; Profile
                                    </h2>
                                </div>
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                                    Primary Info
                                </span>
                            </div>

                            <div className="mt-5 space-y-4 text-xs">
                                {/* Primary Phone */}
                                <div className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-700">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Primary Phone
                                            </p>
                                            <p className="mt-0.5 font-bold text-slate-900">
                                                {lead.phone || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {lead.phone && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(lead.phone, "Phone Number")}
                                                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                                                    title="Copy phone"
                                                >
                                                    {copiedField === "Phone Number" ? (
                                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                                <a
                                                    href={`tel:${lead.phone}`}
                                                    className="cursor-pointer rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700 transition shadow-2xs"
                                                    title="Call"
                                                >
                                                    <PhoneCall className="h-3.5 w-3.5" />
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Alternative Phone */}
                                {lead.alternativePhone && (
                                    <div className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 text-slate-700">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Alternative Phone
                                                </p>
                                                <p className="mt-0.5 font-bold text-slate-900">
                                                    {lead.alternativePhone}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(lead.alternativePhone, "Alternative Phone")}
                                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                                                title="Copy alt phone"
                                            >
                                                {copiedField === "Alternative Phone" ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            <a
                                                href={`tel:${lead.alternativePhone}`}
                                                className="cursor-pointer rounded-lg bg-slate-700 p-1.5 text-white hover:bg-slate-800 transition"
                                                title="Call"
                                            >
                                                <PhoneCall className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Email Address */}
                                <div className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-slate-200">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-700">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Email Address
                                            </p>
                                            <p className="mt-0.5 font-bold text-slate-900 truncate">
                                                {lead.email || "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                    {lead.email && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(lead.email, "Email Address")}
                                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                                                title="Copy email"
                                            >
                                                {copiedField === "Email Address" ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            <a
                                                href={`mailto:${lead.email}`}
                                                className="cursor-pointer rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition shadow-2xs"
                                                title="Send Email"
                                            >
                                                <Mail className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Gender & DOB */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Gender
                                        </p>
                                        <p className="mt-1 font-bold capitalize text-slate-900">
                                            {lead.gender || "Not specified"}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Date of Birth
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900">
                                            {lead.dob ? formatDate(lead.dob) : "N/A"}
                                        </p>
                                        {lead.dob && calculateAge(lead.dob) && (
                                            <span className="mt-1 inline-block rounded-md bg-blue-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                                {calculateAge(lead.dob)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Full Address */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <MapPin className="h-3 w-3 text-slate-400" />
                                        <span>Full Address</span>
                                    </div>
                                    <p className="mt-1.5 font-medium text-slate-800 leading-relaxed">
                                        {lead.fullAddress || "No address on record"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: COURSES & ACADEMIC INTEREST */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-400 text-white">
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                        Course Interests
                                    </h2>
                                </div>
                                <span className="rounded-md bg-blue-400 border border-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                    {coursesList.length} Selected
                                </span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {coursesList.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No courses recorded</p>
                                ) : (
                                    coursesList.map((course, idx) => {
                                        const cName = course.name || course;
                                        return (
                                            <div
                                                key={course._id || idx}
                                                className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/40 p-3.5 transition hover:bg-violet-50/70"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-2xs">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-bold capitalize text-slate-900">
                                                            {cName}
                                                        </h3>
                                                        <p className="text-[10px] text-slate-500 font-mono">
                                                            {course._id ? `ID: ${course._id}` : "Course Module"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="rounded-full bg-blue-400 px-2.5 py-0.5 text-[10px] font-bold text-white capitalize">
                                                    Interested
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* CARD 3: ASSIGNED COUNSELLOR & STATUS MANAGEMENT */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                        Assigned Counsellor
                                    </h2>
                                </div>
                                <span className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                                    Staff Lead
                                </span>
                            </div>

                            <div className="mt-5">
                                {lead.assignedCounsellor ? (
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                                        <div className="flex items-center gap-3.5">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 font-bold text-white shadow-2xs">
                                                {getInitials(lead.assignedCounsellor.name)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    {lead.assignedCounsellor.name}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    @{lead.assignedCounsellor.username || "counsellor"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-200/60 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            {lead.assignedCounsellor.phone && (
                                                <a
                                                    href={`tel:${lead.assignedCounsellor.phone}`}
                                                    className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 p-2 font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
                                                >
                                                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                                    <span className="truncate">{lead.assignedCounsellor.phone}</span>
                                                </a>
                                            )}
                                            {lead.assignedCounsellor.email && (
                                                <a
                                                    href={`mailto:${lead.assignedCounsellor.email}`}
                                                    className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 p-2 font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
                                                    title={lead.assignedCounsellor.email}
                                                >
                                                    <Mail className="h-3.5 w-3.5 text-emerald-600" />
                                                    <span className="truncate">{lead.assignedCounsellor.email}</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
                                        <p className="text-xs text-slate-500 font-medium">No counsellor assigned yet.</p>
                                    </div>
                                )}

                                {/* Status audit note */}
                                {lead.statusChangedAt && (
                                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 flex items-center justify-between">
                                        <span>Status Last Changed:</span>
                                        <span className="font-semibold text-slate-700">
                                            {formatDateTime(lead.statusChangedAt)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CARD 4: SYSTEM METADATA & AUDIT LOG */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                        System &amp; Audit Data
                                    </h2>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-400">Created At</span>
                                    <span className="font-semibold text-slate-800">
                                        {formatDateTime(lead.createdAt)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-400">Last Updated</span>
                                    <span className="font-semibold text-slate-800">
                                        {formatDateTime(lead.updatedAt)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-400">Conversion Status</span>
                                    <span className="font-bold uppercase text-[11px] text-slate-800">
                                        {lead.conversionStatus || "not_requested"}
                                    </span>
                                </div>

                                {lead.conversionRemarks && (
                                    <div className="pt-2">
                                        <p className="text-slate-400 text-[11px] font-semibold uppercase">
                                            Conversion Remarks:
                                        </p>
                                        <p className="mt-1 rounded-xl bg-slate-50 p-2.5 text-xs font-medium text-slate-700">
                                            {lead.conversionRemarks}
                                        </p>
                                    </div>
                                )}

                                {lead.convertedStudent && (
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-400">Converted Student ID</span>
                                        <span className="font-mono text-xs font-semibold text-emerald-700">
                                            {typeof lead.convertedStudent === "object"
                                                ? lead.convertedStudent._id || "Linked"
                                                : lead.convertedStudent}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Follow-up Engine & Activity Timeline (7 of 12) */}
                    <div className="lg:col-span-7 space-y-6 min-w-0">
                        {/* ========================================================================= */}
                        {/* SECTION A: INLINE ADD FOLLOW-UP INTERACTIVE PANEL */}
                        {/* ========================================================================= */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-7">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                                        <CalendarClock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Add New Follow-up
                                        </h2>

                                    </div>
                                </div>

                            </div>

                            <form onSubmit={handleFollowUpSubmit} className="mt-5 space-y-5">

                                {/* Description Textarea */}
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
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 leading-relaxed"
                                    />
                                </div>

                                {/* Dates Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Call Date */}
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    {/* Next Call Date */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                                Next Call Schedule
                                            </label>
                                            {/* Quick +1d, +3d, +7d buttons */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickNextCall(1)}
                                                    className="cursor-pointer text-xs font-bold text-blue-600 hover:underline"
                                                >
                                                    +1d
                                                </button>
                                                <span className="text-slate-300">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickNextCall(3)}
                                                    className="cursor-pointer text-xs font-bold text-blue-600 hover:underline"
                                                >
                                                    +3d
                                                </button>
                                                <span className="text-slate-300">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickNextCall(7)}
                                                    className="cursor-pointer text-xs font-bold text-blue-600 hover:underline"
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Form Submit Actions */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={submittingFollowUp}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
                                    >
                                        {submittingFollowUp ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                <span>Saving Follow-up...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                <span>Save Follow-up</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* ========================================================================= */}
                        {/* SECTION B: ACTIVITY TIMELINE (FOLLOW-UP REMARKS) */}
                        {/* ========================================================================= */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:p-7 min-w-0">
                            {/* Timeline Header with Search */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                        <History className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-slate-900">
                                            Follow-up Timeline
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Complete interaction log ({sortedRemarks.length} records)
                                        </p>
                                    </div>
                                </div>

                                {/* Search within remarks */}
                                {sortedRemarks.length > 2 && (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={remarkSearch}
                                            onChange={(e) => setRemarkSearch(e.target.value)}
                                            placeholder="Search in remarks..."
                                            className="w-full sm:w-56 rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Timeline Body */}
                            <div className="mt-6">
                                {sortedRemarks.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                            <CalendarClock className="h-7 w-7" />
                                        </div>
                                        <h3 className="mt-3 text-sm font-bold text-slate-900">
                                            No Follow-up Remarks Yet
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                                            Use the form above to log the first discussion or call notes for this lead.
                                        </p>
                                    </div>
                                ) : filteredRemarks.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-500">
                                        No remarks match "{remarkSearch}".
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="relative border-l-2 border-slate-200/80 pl-6 ml-3 space-y-6 min-w-0">
                                            {filteredRemarks.slice(0, 5).map((remark, idx) => {
                                                const callerName = remark.calledBy?.name || "Staff";
                                                return (
                                                    <div
                                                        key={remark._id || idx}
                                                        className="group relative min-w-0"
                                                    >
                                                        {/* Timeline Node Point */}
                                                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-blue-100 border-2 border-blue-600">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                        </span>

                                                        {/* Remark Box */}
                                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4.5 transition hover:border-blue-200 hover:bg-white hover:shadow-xs min-w-0 overflow-hidden">
                                                            {/* Top Row: Caller & Timestamps */}
                                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                                                        <User className="h-3 w-3" />
                                                                        {callerName}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-400">
                                                                        {getRelativeTime(remark.date)}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                                    <span>{formatDateTime(remark.date)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Description Content */}
                                                            <p className="mt-3 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-medium break-words [overflow-wrap:anywhere] [word-break:break-word]">
                                                                {remark.description}
                                                            </p>

                                                            {/* Bottom Meta: Next Call Date & Reminder Status */}
                                                            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-[11px]">
                                                                {remark.nextCallDate ? (
                                                                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                                                        <CalendarClock className="h-3.5 w-3.5 text-blue-600" />
                                                                        <span>Next Call:</span>
                                                                        <span className="rounded-md bg-blue-100/70 px-2 py-0.5 text-blue-800 font-bold">
                                                                            {formatDateTime(remark.nextCallDate)}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400">No scheduled next call</span>
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

                                        {/* Show More Button */}
                                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <p className="text-xs text-slate-500 font-medium">
                                                Showing {Math.min(5, filteredRemarks.length)} of {sortedRemarks.length} follow-ups
                                                {sortedRemarks.length > 5 && (
                                                    <span className="ml-1 text-slate-400">({sortedRemarks.length - 5} more)</span>
                                                )}
                                            </p>
                                            <Link
                                                to={`/counsellor/leads/${id}/follow-ups`}
                                                state={{ lead }}
                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 hover:shadow-md transition active:scale-95 group"
                                            >
                                                <span>Show More</span>
                                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* MODAL 1: ADD FOLLOW-UP MODAL (Alternative quick-access modal) */}
                {/* ========================================================================= */}
                {showFollowUpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
                            <button
                                type="button"
                                onClick={() => setShowFollowUpModal(false)}
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
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Discussion Notes <span className="text-rose-500">*</span>
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
                                        placeholder="Enter details of conversation..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Call Date &amp; Time
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-800 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Next Call Schedule
                                        </label>
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-800 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowFollowUpModal(false)}
                                        className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingFollowUp}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {submittingFollowUp ? "Saving..." : "Save Follow-up"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL 2: CONVERT LEAD TO STUDENT MODAL */}
                {/* ========================================================================= */}
                {showConvertModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
                            <button
                                type="button"
                                onClick={() => setShowConvertModal(false)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                ✕
                            </button>

                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Convert Lead to Student
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Enrolling <span className="font-semibold text-slate-800">{lead.name}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                                This will convert <strong>{lead.name}</strong> into an enrolled Academy Student record and grant official admission status.
                            </div>

                            <form onSubmit={handleConvertSubmit} className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Conversion Remarks <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows="3"
                                        required
                                        value={convertRemarks}
                                        onChange={(e) => setConvertRemarks(e.target.value)}
                                        placeholder="e.g. yes, this lead has been converted to student"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowConvertModal(false)}
                                        disabled={submittingConvert}
                                        className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingConvert}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {submittingConvert ? (
                                            <>
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                <span>Converting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                <span>Confirm Conversion</span>
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

export default CounsellorLeadDetails;
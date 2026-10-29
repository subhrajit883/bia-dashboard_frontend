import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Users,
    Search,
    Filter,
    RefreshCw,
    Plus,
    Phone,
    Mail,
    Calendar,
    Share2,
    BookOpen,
    UserCheck,
    CheckCircle2,
    CalendarClock,
    X,
    UserPlus,
    RotateCcw,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Check,
    Eye,
    SquarePen,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import ExportLeadsButton from "../../components/ExportLeadsButton";
import {
    leadUrl,
    sourcesUrl,
    courseUrl,
    counsellorUrl,
} from "../../config/config";

const CANDIDATE_STATUSES = [
    { value: "ongoing", label: "Ongoing", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "interested", label: "Interested", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "not interested", label: "Not Interested", color: "bg-slate-50 text-slate-700 border-slate-200" },
    { value: "not useful", label: "Not Useful", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "not responding", label: "Not Responding", color: "bg-orange-50 text-orange-700 border-orange-200" },
    { value: "disconnect call", label: "Disconnect Call", color: "bg-rose-50 text-rose-700 border-rose-200" },
    { value: "closed", label: "Closed", color: "bg-red-50 text-red-700 border-red-200" },
];

const CANDIDATE_TYPES = [
    { value: "lead", label: "Lead" },
    { value: "walk-in", label: "Walk-in" },
];

const CONVERSION_STATUSES = [
    { value: "not_requested", label: "Not Requested" },
    { value: "pending", label: "Pending Approval" },
    { value: "approved", label: "Approved (Converted)" },
    { value: "rejected", label: "Rejected" },
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

function AdminLeads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dropdown options for filter selections
    const [sources, setSources] = useState([]);
    const [courses, setCourses] = useState([]);
    const [counsellors, setCounsellors] = useState([]);

    // Query filter states
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLeadsCount, setTotalLeadsCount] = useState(0);
    const [candidateType, setCandidateType] = useState("");
    const [sourceName, setSourceName] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [courseName, setCourseName] = useState("");
    const [assignedCounsellorName, setAssignedCounsellorName] = useState("");
    const [status, setStatus] = useState("");
    const [conversionStatus, setConversionStatus] = useState("");

    // Modals state
    const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState(null);
    const [followUpData, setFollowUpData] = useState({
        description: "",
        date: "",
        nextCallDate: "",
    });
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    const [selectedLeadForConvert, setSelectedLeadForConvert] = useState(null);
    const [convertRemarks, setConvertRemarks] = useState(
        "yes, this lead has been converted to student"
    );
    const [submittingConvert, setSubmittingConvert] = useState(false);

    const [selectedLeadForDetails, setSelectedLeadForDetails] = useState(null);

    // Fetch reference dropdown data once
    useEffect(() => {
        let isMounted = true;
        const fetchReferences = async () => {
            try {
                const adminToken = localStorage.getItem("adminToken");
                const headers = adminToken
                    ? { Authorization: `Bearer ${adminToken}` }
                    : {};

                const [srcRes, crsRes, cnlRes] = await Promise.all([
                    axios
                        .get(sourcesUrl.sources, { headers })
                        .catch(() => ({ data: { data: [] } })),
                    axios
                        .get(courseUrl.courses, { headers })
                        .catch(() => ({ data: { data: [] } })),
                    axios
                        .get(counsellorUrl.counsellorActive)
                        .catch(() => ({ data: { data: [] } })),
                ]);

                if (isMounted) {
                    setSources(Array.isArray(srcRes.data?.data) ? srcRes.data.data : []);
                    setCourses(Array.isArray(crsRes.data?.data) ? crsRes.data.data : []);
                    setCounsellors(
                        Array.isArray(cnlRes.data?.data) ? cnlRes.data.data : []
                    );
                }
            } catch (e) {
                console.error("Reference fetch error:", e);
            }
        };

        fetchReferences();
        return () => {
            isMounted = false;
        };
    }, []);

    // Debounce search input by 400ms so API is not hit on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset to page 1 whenever search query or filters change
    useEffect(() => {
        setPage(1);
    }, [
        debouncedSearch,
        candidateType,
        sourceName,
        dateFrom,
        dateTo,
        courseName,
        assignedCounsellorName,
        status,
        conversionStatus,
        limit,
    ]);

    // Fetch leads with query parameters & pagination
    const loadLeads = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const adminToken = localStorage.getItem("adminToken");
            const headers = adminToken
                ? { Authorization: `Bearer ${adminToken}` }
                : {};

            const params = {
                page,
                limit,
            };
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
            if (candidateType) params.candidateType = candidateType;
            if (sourceName) params.sourceName = sourceName;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
            if (courseName) params.courseName = courseName;
            if (assignedCounsellorName)
                params.assignedCounsellorName = assignedCounsellorName;
            if (status) params.status = status;
            if (conversionStatus) params.conversionStatus = conversionStatus;

            const response = await axios.get(leadUrl.lead, {
                params,
                headers,
            });

            const result = response.data;
            let list = [];
            let total = 0;
            let calculatedTotalPages = 1;

            if (Array.isArray(result)) {
                list = result;
                total = result.length;
                calculatedTotalPages = Math.ceil(total / limit) || 1;
            } else if (Array.isArray(result?.data)) {
                list = result.data;
                total = result.total ?? result.totalLeads ?? result.count ?? result.data.length;
                calculatedTotalPages = result.totalPages ?? result.pages ?? Math.ceil(total / limit) ?? 1;
            } else if (Array.isArray(result?.leads)) {
                list = result.leads;
                total = result.total ?? result.totalLeads ?? result.count ?? result.leads.length;
                calculatedTotalPages = result.totalPages ?? result.pages ?? Math.ceil(total / limit) ?? 1;
            } else if (result?.data?.leads && Array.isArray(result.data.leads)) {
                list = result.data.leads;
                total = result.data.total ?? result.data.totalLeads ?? result.data.count ?? result.data.leads.length;
                calculatedTotalPages = result.data.totalPages ?? result.data.pages ?? Math.ceil(total / limit) ?? 1;
            } else if (result?.pagination) {
                list = Array.isArray(result.data) ? result.data : (Array.isArray(result.leads) ? result.leads : []);
                total = result.pagination.total ?? list.length;
                calculatedTotalPages = result.pagination.totalPages ?? Math.ceil(total / limit) ?? 1;
            } else if (result && result._id) {
                list = [result];
                total = 1;
                calculatedTotalPages = 1;
            }

            setLeads(list);
            setTotalLeadsCount(total);
            setTotalPages(calculatedTotalPages || 1);
        } catch (err) {
            console.error("Fetch leads error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Failed to load leads."
            );
        } finally {
            setLoading(false);
        }
    }, [
        debouncedSearch,
        candidateType,
        sourceName,
        dateFrom,
        dateTo,
        courseName,
        assignedCounsellorName,
        status,
        conversionStatus,
        page,
        limit,
    ]);

    useEffect(() => {
        loadLeads(true);
    }, [loadLeads]);

    // Reset all filters
    const handleClearFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setCandidateType("");
        setSourceName("");
        setDateFrom("");
        setDateTo("");
        setCourseName("");
        setAssignedCounsellorName("");
        setStatus("");
        setConversionStatus("");
        setPage(1);
    };

    // Calculate smart array of visible page numbers for pagination controls
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, page - 2);
            let end = Math.min(totalPages, start + maxVisiblePages - 1);
            if (end - start < maxVisiblePages - 1) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        return pages;
    };

    // Open Follow-up Modal
    const openFollowUpModal = (lead) => {
        const now = new Date();
        const isoNow = formatToLocalDateTime(now);

        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const isoNextWeek = formatToLocalDateTime(nextWeek);

        setSelectedLeadForFollowUp(lead);
        setFollowUpData({
            description: "",
            date: isoNow,
            nextCallDate: isoNextWeek,
        });
    };

    // Submit Follow-up
    const handleFollowUpSubmit = async (e) => {
        e.preventDefault();
        if (!followUpData.description.trim()) {
            toast.error("Please enter a follow-up description.");
            return;
        }
        if (!followUpData.date) {
            toast.error("Please pick a call date.");
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

            const url = `${leadUrl.lead}/${selectedLeadForFollowUp._id}/follow-ups`;
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
            setSelectedLeadForFollowUp(null);
            await loadLeads();
        } catch (err) {
            console.error("Follow-up error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Unable to add follow-up."
            );
        } finally {
            setSubmittingFollowUp(false);
        }
    };

    // Open Convert Modal
    const openConvertModal = (lead) => {
        setSelectedLeadForConvert(lead);
        setConvertRemarks("yes, this lead has been converted to student");
    };

    // Submit Convert Lead to Student
    const handleConvertSubmit = async (e) => {
        e.preventDefault();

        const adminToken = localStorage.getItem("adminToken");
        if (!adminToken) {
            toast.error("Admin token not found. Please log in.");
            return;
        }

        try {
            setSubmittingConvert(true);

            const payload = {
                remarks: convertRemarks.trim(),
            };

            const url = `${leadUrl.lead}/${selectedLeadForConvert._id}/convert`;
            const response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            if (response.data?.success === false) {
                toast.error(response.data?.message || "Failed to convert lead.");
                return;
            }

            toast.success(
                response.data?.message || "Lead converted to student successfully!"
            );
            setSelectedLeadForConvert(null);
            await loadLeads();
        } catch (err) {
            console.error("Convert error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Unable to convert lead."
            );
        } finally {
            setSubmittingConvert(false);
        }
    };

    // Stats calculation
    const stats = useMemo(() => {
        const total = totalLeadsCount > 0 ? totalLeadsCount : leads.length;
        const interested = leads.filter(
            (l) => l.candidateStatus === "interested"
        ).length;
        const ongoing = leads.filter(
            (l) => l.candidateStatus === "ongoing"
        ).length;
        const converted = leads.filter(
            (l) =>
                l.conversionStatus === "approved" ||
                Boolean(l.convertedStudent)
        ).length;
        return { total, interested, ongoing, converted };
    }, [leads, totalLeadsCount]);

    const startLeadIndex = totalLeadsCount === 0 ? 0 : (page - 1) * limit + 1;
    const endLeadIndex = Math.min(
        page * limit,
        totalLeadsCount > 0 ? totalLeadsCount : (page - 1) * limit + leads.length
    );

    // Active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (search.trim()) count++;
        if (candidateType) count++;
        if (sourceName) count++;
        if (dateFrom) count++;
        if (dateTo) count++;
        if (courseName) count++;
        if (assignedCounsellorName) count++;
        if (status) count++;
        if (conversionStatus) count++;
        return count;
    }, [
        search,
        candidateType,
        sourceName,
        dateFrom,
        dateTo,
        courseName,
        assignedCounsellorName,
        status,
        conversionStatus,
    ]);

    // Active filters query object passed to Excel export
    const activeFilters = useMemo(
        () => ({
            search: debouncedSearch.trim(),
            candidateType,
            sourceName,
            dateFrom,
            dateTo,
            courseName,
            assignedCounsellorName,
            status,
            conversionStatus,
        }),
        [
            debouncedSearch,
            candidateType,
            sourceName,
            dateFrom,
            dateTo,
            courseName,
            assignedCounsellorName,
            status,
            conversionStatus,
        ]
    );

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

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                                Admin Workspace
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">
                                Lead Pipeline
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            All Leads
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Track candidate inquiries, schedule follow-ups, and convert leads into registered students.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <ExportLeadsButton
                            filters={activeFilters}
                            leads={leads}
                            totalLeadsCount={totalLeadsCount}
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() => loadLeads(true)}
                            disabled={loading}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
                            Refresh
                        </button>

                        <Link
                            to="/admin/addlead"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add New Lead
                        </Link>
                    </div>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Leads
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-slate-900">
                            {stats.total}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                            Interested
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                            {stats.interested}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                            Ongoing
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-amber-700">
                            {stats.ongoing}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-xs">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                            Converted
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-blue-700">
                            {stats.converted}
                        </p>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setDebouncedSearch(search);
                                    }
                                }}
                                placeholder="Search by name, phone, or email..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pr-10 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setDebouncedSearch("");
                                        setPage(1);
                                    }}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                                    title="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Filter Toggle & Quick Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowFilters((prev) => !prev)}
                                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${showFilters || activeFiltersCount > 0
                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <Filter className="h-4 w-4" />
                                <span>Filters</span>
                                {activeFiltersCount > 0 && (
                                    <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                                        {activeFiltersCount}
                                    </span>
                                )}
                                {showFilters ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                )}
                            </button>

                            {activeFiltersCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 hover:border-rose-200"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Collapsible Filter Parameters (Matching Image 1 params) */}
                    {showFilters && (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 pt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                            {/* candidateType */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Candidate Type
                                </label>
                                <select
                                    value={candidateType}
                                    onChange={(e) => setCandidateType(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="">All Types</option>
                                    {CANDIDATE_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* status (candidateStatus) */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Candidate Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="">All Statuses</option>
                                    {CANDIDATE_STATUSES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* sourceName */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Source Name
                                </label>
                                <select
                                    value={sourceName}
                                    onChange={(e) => setSourceName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="">All Sources</option>
                                    {sources.map((s) => (
                                        <option key={s._id} value={s.name}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* courseName */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Course Name
                                </label>
                                <select
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="">All Courses</option>
                                    {courses.map((c) => (
                                        <option key={c._id} value={c.name}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* assignedCounsellorName */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Assigned Counsellor
                                </label>
                                <select
                                    value={assignedCounsellorName}
                                    onChange={(e) => setAssignedCounsellorName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="">All Counsellors</option>
                                    {counsellors.map((c) => (
                                        <option key={c._id} value={c.name}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* conversionStatus */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Conversion Status
                                </label>
                                <select
                                    value={conversionStatus}
                                    onChange={(e) => setConversionStatus(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="">All Conversions</option>
                                    {CONVERSION_STATUSES.map((cs) => (
                                        <option key={cs.value} value={cs.value}>
                                            {cs.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* dateFrom */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Date From
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* dateTo */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Date To
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Leads Table Container */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-16 text-slate-500">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                Loading leads...
                            </p>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500">
                            <Users className="h-12 w-12 text-slate-300" />
                            <p className="mt-3 text-base font-bold text-slate-800">
                                No leads found
                            </p>
                            <p className="mt-1 text-xs text-slate-400 max-w-sm">
                                No prospective leads matched your search or filter parameters. Try clearing filters or add a new lead.
                            </p>
                            <div className="mt-4 flex items-center gap-3">
                                {activeFiltersCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                                <Link
                                    to="/admin/addlead"
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                                >
                                    + Add Lead
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <th className="px-5 py-4">Lead </th>
                                        <th className="px-5 py-4">Type </th>
                                        <th className="px-5 py-4">Enquiry On</th>
                                        <th className="px-5 py-4">Interested Course(s)</th>
                                        <th className="px-5 py-4">Assgn. Counsellor</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">Conversion</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leads.map((lead) => {
                                        const statusConfig =
                                            CANDIDATE_STATUSES.find(
                                                (s) => s.value === lead.candidateStatus
                                            ) || {
                                                label: lead.candidateStatus || "Ongoing",
                                                color: "bg-slate-50 text-slate-700 border-slate-200",
                                            };

                                        const isConverted =
                                            lead.conversionStatus === "approved" ||
                                            Boolean(lead.convertedStudent);

                                        const coursesList = Array.isArray(lead.enrolledCourses)
                                            ? lead.enrolledCourses
                                            : [];

                                        return (
                                            <tr
                                                key={lead._id}
                                                className="transition hover:bg-slate-50/60"
                                            >
                                                {/* Name & Contact */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <Link
                                                            to={`/admin/leads/${lead._id}`}
                                                            state={{ lead }}
                                                            className="cursor-pointer text-left font-bold text-slate-900 hover:text-blue-600 transition"
                                                        >
                                                            {lead.name}
                                                        </Link>
                                                        <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3 text-slate-400" />
                                                                {lead.phone}
                                                                {lead.alternativePhone && (
                                                                    <span className="text-slate-400">
                                                                        / {lead.alternativePhone}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            {lead.email && (
                                                                <span className="flex items-center gap-1 truncate">
                                                                    <Mail className="h-3 w-3 text-slate-400" />
                                                                    {lead.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type & Source */}
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
                                                            {lead.candidateType || "lead"}
                                                        </span>
                                                        <p className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                                                            <Share2 className="h-3 w-3 text-slate-400" />
                                                            {lead.source?.name || "Direct / Unknown"}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="px-5 py-4 text-slate-600">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        {formatDate(lead.date || lead.createdAt)}
                                                    </div>
                                                </td>

                                                {/* Enrolled Courses */}
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                                        {coursesList.length === 0 ? (
                                                            <span className="text-slate-400 italic">None</span>
                                                        ) : (
                                                            coursesList.map((c, i) => (
                                                                <span
                                                                    key={c._id || i}
                                                                    className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50/70 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                                                                >
                                                                    <BookOpen className="h-2.5 w-2.5" />
                                                                    {c.name || "Course"}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Assigned Counsellor */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                        <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                                        <span className="truncate">
                                                            {lead.assignedCounsellor?.name || "Unassigned"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusConfig.color}`}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        {statusConfig.label}
                                                    </span>
                                                </td>

                                                {/* Conversion Status */}
                                                <td className="px-5 py-4">
                                                    {isConverted ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 text-[11px] font-bold text-purple-700">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Converted
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                                                            {lead.conversionStatus
                                                                ? lead.conversionStatus.replace("_", " ")
                                                                : "Not Requested"}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Edit Lead */}
                                                        <Link
                                                            to={`/admin/editlead/${lead._id}`}
                                                            state={{ lead }}
                                                            title="Edit Lead"
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-500 transition hover:bg-slate-50 hover:border-slate-300 hover:text-amber-700"
                                                        >
                                                            <SquarePen className="h-3.5 w-3.5 text-amber-500" />

                                                        </Link>
                                                        {/* Details Page Link */}
                                                        <Link
                                                            to={`/admin/leads/${lead._id}`}
                                                            state={{ lead }}
                                                            title="View Lead Details"
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 hover:text-blue-700"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 text-slate-500" />

                                                        </Link>

                                                        {/* Follow-up Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => openFollowUpModal(lead)}
                                                            title="Add Follow-up"
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                                                        >
                                                            <CalendarClock className="h-3.5 w-3.5 text-blue-600" />

                                                        </button>

                                                        {/* Convert Button (Admin Only) */}
                                                        {!isConverted && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openConvertModal(lead)}
                                                                title="Convert Lead to Student"
                                                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                                                            >
                                                                <UserPlus className="h-3.5 w-3.5" />

                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer (Query Params: page, limit) */}
                    {leads.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-200 bg-slate-50/80 px-5 py-3.5 text-xs text-slate-600">
                            <div className="flex flex-wrap items-center gap-3">
                                <div>
                                    Showing{" "}
                                    <span className="font-bold text-slate-900">
                                        {startLeadIndex}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-bold text-slate-900">
                                        {endLeadIndex}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-bold text-slate-900">
                                        {totalLeadsCount > 0 ? totalLeadsCount : leads.length}
                                    </span>{" "}
                                    leads
                                    {" "}• Page <span className="font-bold text-slate-900">{page}</span> of{" "}
                                    <span className="font-bold text-slate-900">{Math.max(totalPages, 1)}</span>
                                </div>

                                {/* Rows per page dropdown */}
                                <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                                    <span className="text-slate-500">Per page:</span>
                                    <select
                                        value={limit}
                                        onChange={(e) => {
                                            setLimit(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>

                            {/* Page Buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPage(1)}
                                    disabled={page <= 1 || loading}
                                    title="First Page"
                                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page <= 1 || loading}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Prev</span>
                                </button>

                                <div className="flex items-center gap-1">
                                    {getPageNumbers().map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPage(p)}
                                            disabled={loading}
                                            className={`h-7 min-w-7 cursor-pointer rounded-lg px-2 text-xs font-bold transition ${p === page
                                                ? "bg-blue-600 text-white shadow-xs"
                                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page >= totalPages || loading}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPage(totalPages)}
                                    disabled={page >= totalPages || loading}
                                    title="Last Page"
                                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* MODAL 1: ADD FOLLOW-UP (Image 2) */}
                {/* ========================================================================= */}
                {selectedLeadForFollowUp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setSelectedLeadForFollowUp(null)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <CalendarClock className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Add Follow-up
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Lead:{" "}
                                        <span className="font-semibold text-slate-800">
                                            {selectedLeadForFollowUp.name}
                                        </span>{" "}
                                        ({selectedLeadForFollowUp.phone})
                                    </p>
                                </div>
                            </div>

                            {/* Follow-up Form */}
                            <form onSubmit={handleFollowUpSubmit} className="mt-5 space-y-4">
                                {/* Description */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Discussion Summary / Notes <span className="text-rose-500">*</span>
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
                                        placeholder="e.g. Discussed the Screen Acting Course and scheduled another call."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {/* Call Date */}
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>

                                    {/* Next Call Date */}
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                            Next Follow-up Date
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLeadForFollowUp(null)}
                                        disabled={submittingFollowUp}
                                        className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingFollowUp}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {submittingFollowUp ? (
                                            <>
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                <span>Save Follow-up</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL 2: CONVERT LEAD TO STUDENT (Image 3) */}
                {/* ========================================================================= */}
                {selectedLeadForConvert && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setSelectedLeadForConvert(null)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Convert Lead to Student
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Admin Action • Transition prospect to enrolled
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                                You are converting{" "}
                                <span className="font-bold">{selectedLeadForConvert.name}</span>.
                                This will officially enroll the lead into the student database.
                            </div>

                            {/* Convert Form */}
                            <form onSubmit={handleConvertSubmit} className="mt-4 space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Conversion Remarks
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
                                        onClick={() => setSelectedLeadForConvert(null)}
                                        disabled={submittingConvert}
                                        className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingConvert}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {submittingConvert ? (
                                            <>
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                <span>Converting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                <span>Confirm Convert</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL 3: LEAD DETAIL DRAWER/MODAL */}
                {/* ========================================================================= */}
                {selectedLeadForDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7 space-y-4">
                            <button
                                type="button"
                                onClick={() => setSelectedLeadForDetails(null)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="border-b border-slate-100 pb-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                    Lead Details
                                </span>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {selectedLeadForDetails.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    ID: {selectedLeadForDetails._id}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Phone
                                    </p>
                                    <p className="font-semibold text-slate-800 mt-0.5">
                                        {selectedLeadForDetails.phone}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Alternative Phone
                                    </p>
                                    <p className="font-semibold text-slate-800 mt-0.5">
                                        {selectedLeadForDetails.alternativePhone || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Email
                                    </p>
                                    <p className="font-semibold text-slate-800 mt-0.5 truncate">
                                        {selectedLeadForDetails.email || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Gender / DOB
                                    </p>
                                    <p className="font-semibold text-slate-800 mt-0.5 capitalize">
                                        {selectedLeadForDetails.gender || "N/A"}{" "}
                                        {selectedLeadForDetails.dob
                                            ? `(${formatDate(selectedLeadForDetails.dob)})`
                                            : ""}
                                    </p>
                                </div>

                                <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Full Address
                                    </p>
                                    <p className="font-semibold text-slate-800 mt-0.5">
                                        {selectedLeadForDetails.fullAddress || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Source
                                    </p>
                                    <p className="font-semibold text-slate-800 mt-0.5">
                                        {selectedLeadForDetails.source?.name || "Unknown"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Assgn. Counsellor
                                    </p>
                                    <p className="font-semibold text-slate-800 mt-0.5">
                                        {selectedLeadForDetails.assignedCounsellor?.name || "None"}
                                    </p>
                                </div>
                            </div>

                            {/* Remarks List if present */}
                            {Array.isArray(selectedLeadForDetails.remarks) &&
                                selectedLeadForDetails.remarks.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                            Follow-up Remarks ({selectedLeadForDetails.remarks.length})
                                        </h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {selectedLeadForDetails.remarks.map((r, i) => (
                                                <div
                                                    key={i}
                                                    className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-700"
                                                >
                                                    <p>{r.description || r.text || JSON.stringify(r)}</p>
                                                    {r.date && (
                                                        <p className="text-[10px] text-slate-400 mt-1">
                                                            {formatDate(r.date)}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLeadForDetails(null)}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
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

export default AdminLeads;
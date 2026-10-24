import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Users, Search, Filter, RefreshCw, Plus, Phone, Mail, Calendar, BookOpen, UserCheck, X,
    RotateCcw, Sparkles, ChevronDown, ChevronUp, Check, Copy, IndianRupee, FileText,
    Eye, ExternalLink, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, PhoneCall, ShieldCheck,
    CreditCard,
    SquarePen,
} from "lucide-react";
import {
    studentUrl,
    courseUrl,
    counsellorUrl,
    adminUrl,
} from "../../config/config";

const PAYMENT_STATUSES = [
    { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20" },
    { value: "partial", label: "Partial", color: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20" },
    { value: "paid", label: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20" },
    { value: "overdue", label: "Overdue", color: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20" },
];

function CounsellorStudent() {
    // Student list & loading state
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedField, setCopiedField] = useState(null);

    // Filter dropdown options from backend
    const [courses, setCourses] = useState([]);
    const [counsellors, setCounsellors] = useState([]);

    // Query filter states (Matching all 10 query params)
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sId, setSId] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [assignedCounsellorName, setAssignedCounsellorName] = useState("");
    const [admissionFrom, setAdmissionFrom] = useState("");
    const [admissionTo, setAdmissionTo] = useState("");
    const [courseName, setCourseName] = useState("");
    const [isActive, setIsActive] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudentsCount, setTotalStudentsCount] = useState(0);

    // Modals state
    const [selectedStudentForDetails, setSelectedStudentForDetails] = useState(null);
    const [selectedStudentForDocs, setSelectedStudentForDocs] = useState(null);

    // Fetch reference dropdown data once (Courses & Counsellors)
    useEffect(() => {
        let isMounted = true;
        const fetchReferences = async () => {
            try {
                const counsellorToken = localStorage.getItem("token");
                const headers = counsellorToken ? { Authorization: `Bearer ${counsellorToken}` } : {};

                const [crsRes, cnlRes] = await Promise.all([
                    axios
                        .get(courseUrl.courses, { headers })
                        .catch(() => ({ data: { data: [] } })),
                    axios
                        .get(counsellorUrl.counsellorAll, { headers })
                        .catch(() => ({ data: { data: [] } })),
                ]);

                if (isMounted) {
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
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Load students with all query params and backend pagination
    const loadStudents = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const counsellorToken = localStorage.getItem("token");
            const headers = counsellorToken ? { Authorization: `Bearer ${counsellorToken}` } : {};

            const params = {
                page,
                limit,
            };
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
            if (sId.trim()) params.s_id = sId.trim();
            if (paymentStatus) params.paymentStatus = paymentStatus;
            if (assignedCounsellorName) params.assignedCounsellorName = assignedCounsellorName;
            if (admissionFrom) params.admissionFrom = admissionFrom;
            if (admissionTo) params.admissionTo = admissionTo;
            if (courseName) params.courseName = courseName;
            if (isActive !== "") params.isActive = isActive;

            const targetUrl = studentUrl?.students || adminUrl?.students;
            let response;
            try {
                response = await axios.get(targetUrl, { params, headers });
            } catch (err) {
                if (err.response?.status === 404 && adminUrl?.students && targetUrl !== adminUrl.students) {
                    response = await axios.get(adminUrl.students, { params, headers });
                } else {
                    throw err;
                }
            }

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
                total = result.total ?? result.totalStudents ?? result.count ?? result.data.length;
                calculatedTotalPages = result.totalPages ?? result.pages ?? Math.ceil(total / limit) ?? 1;
            } else if (Array.isArray(result?.students)) {
                list = result.students;
                total = result.total ?? result.totalStudents ?? result.count ?? result.students.length;
                calculatedTotalPages = result.totalPages ?? result.pages ?? Math.ceil(total / limit) ?? 1;
            } else if (result?.data?.students && Array.isArray(result.data.students)) {
                list = result.data.students;
                total = result.data.total ?? result.data.totalStudents ?? result.data.count ?? result.data.students.length;
                calculatedTotalPages = result.data.totalPages ?? result.data.pages ?? Math.ceil(total / limit) ?? 1;
            } else if (result?.pagination) {
                list = Array.isArray(result.data) ? result.data : (Array.isArray(result.students) ? result.students : []);
                total = result.pagination.total ?? list.length;
                calculatedTotalPages = result.pagination.totalPages ?? Math.ceil(total / limit) ?? 1;
            } else if (result && result._id) {
                list = [result];
                total = 1;
                calculatedTotalPages = 1;
            }

            setStudents(list);
            setTotalStudentsCount(total);
            setTotalPages(calculatedTotalPages || 1);
        } catch (err) {
            console.error("Fetch students error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message || err.message || "Failed to load students."
            );
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [
        debouncedSearch,
        sId,
        paymentStatus,
        assignedCounsellorName,
        admissionFrom,
        admissionTo,
        courseName,
        isActive,
        page,
        limit,
    ]);

    // Automatically reload students whenever query params or page change
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadStudents(true);
    }, [loadStudents]);

    // Reset all filters
    const handleClearFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setSId("");
        setPaymentStatus("");
        setAssignedCounsellorName("");
        setAdmissionFrom("");
        setAdmissionTo("");
        setCourseName("");
        setIsActive("");
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

    // Calculate active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (sId.trim()) count++;
        if (paymentStatus) count++;
        if (assignedCounsellorName) count++;
        if (admissionFrom) count++;
        if (admissionTo) count++;
        if (courseName) count++;
        if (isActive !== "") count++;
        return count;
    }, [
        sId,
        paymentStatus,
        assignedCounsellorName,
        admissionFrom,
        admissionTo,
        courseName,
        isActive,
    ]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = totalStudentsCount || students.length;
        const paid = students.filter((s) => s.paymentStatus === "paid").length;
        const pending = students.filter((s) => s.paymentStatus === "pending").length;
        const partialOrOverdue = students.filter(
            (s) => s.paymentStatus === "partial" || s.paymentStatus === "overdue"
        ).length;
        const activeCount = students.filter((s) => s.isActive).length;

        // Total revenue collected / fees
        const totalRevenue = students.reduce((acc, curr) => acc + (Number(curr.totalFees) || 0), 0);

        return {
            total,
            paid,
            pending,
            partialOrOverdue,
            activeCount,
            totalRevenue,
        };
    }, [students, totalStudentsCount]);

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

    // Currency formatting helper
    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || amount === "") return "₹0";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Initials helper
    const getInitials = (name) => {
        if (!name) return "ST";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Range helpers for pagination summary
    const startStudentIndex = totalStudentsCount === 0 ? 0 : (page - 1) * limit + 1;
    const endStudentIndex = Math.min(
        page * limit,
        totalStudentsCount > 0 ? totalStudentsCount : (page - 1) * limit + students.length
    );

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* ========================================================================= */}
                {/* 1. HEADER SECTION */}
                {/* ========================================================================= */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                Counsellor Workspace
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">
                                Student Directory
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            All Students
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage enrolled students, fee records, admission profiles, and uploaded verification documents.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => loadStudents(true)}
                            disabled={loading}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
                            Refresh
                        </button>

                        <Link
                            to="/counsellor/addstudent"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Add New Student
                        </Link>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. STATS SUMMARY CARDS */}
                {/* ========================================================================= */}
                {/* <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Total Enrolled
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Users className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">
                            {stats.total}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            {stats.activeCount} active learners
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Fully Paid
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                            {stats.paid}
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-600/80 font-medium">
                            Clear fees status
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                                Payment Pending
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                <CreditCard className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-amber-700">
                            {stats.pending}
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-700/80 font-medium">
                            Awaiting clearance
                        </p>
                    </div>

                    <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                                Overdue / Partial
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                                <IndianRupee className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-rose-700">
                            {stats.partialOrOverdue}
                        </p>
                        <p className="mt-0.5 text-[11px] text-rose-700/80 font-medium">
                            Requires follow-up
                        </p>
                    </div>
                </div> */}

                {/* ========================================================================= */}
                {/* 3. SEARCH & FILTERS CONTAINER (All 10 query params supported) */}
                {/* ========================================================================= */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    {/* Top Row: Search Input + Toggle Filter Button */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Param 1: `search` (name, email, phone) */}
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
                                placeholder="Search students by name, email, or phone number..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pr-10 pl-10 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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

                        {/* Filter Toggle Button */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${showFilters || activeFiltersCount > 0
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <Filter className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Filters</span>
                                {activeFiltersCount > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                                        {activeFiltersCount}
                                    </span>
                                )}
                                {showFilters ? (
                                    <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                )}
                            </button>

                            {activeFiltersCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    title="Clear All Filters"
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expandable Advanced Filters Grid */}
                    {showFilters && (
                        <div className="grid gap-3 pt-3 border-t border-slate-100 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Param 2: Student ID `s_id` */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Student ID (s_id)
                                </label>
                                <input
                                    type="text"
                                    value={sId}
                                    onChange={(e) => {
                                        setSId(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="e.g. STU-2026-0001"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Param 3: `paymentStatus` */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Payment Status
                                </label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => {
                                        setPaymentStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value="">All Payment Statuses</option>
                                    {PAYMENT_STATUSES.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Param 4: `courseName` */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Course Name
                                </label>
                                <select
                                    value={courseName}
                                    onChange={(e) => {
                                        setCourseName(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value="">All Courses</option>
                                    {courses.map((course) => (
                                        <option key={course._id} value={course.name}>
                                            {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Param 5: `assignedCounsellorName` */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Assigned Counsellor
                                </label>
                                <select
                                    value={assignedCounsellorName}
                                    onChange={(e) => {
                                        setAssignedCounsellorName(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value="">All Counsellors</option>
                                    {counsellors.map((counsellor) => (
                                        <option key={counsellor._id} value={counsellor.name}>
                                            {counsellor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Param 6: `admissionFrom` */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Admission From Date
                                </label>
                                <input
                                    type="date"
                                    value={admissionFrom}
                                    onChange={(e) => {
                                        setAdmissionFrom(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Param 7: `admissionTo` */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Admission To Date
                                </label>
                                <input
                                    type="date"
                                    value={admissionTo}
                                    onChange={(e) => {
                                        setAdmissionTo(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Param 8: `isActive` */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Account Status
                                </label>
                                <select
                                    value={isActive}
                                    onChange={(e) => {
                                        setIsActive(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value="">All (Active &amp; Inactive)</option>
                                    <option value="true">Active Only</option>
                                    <option value="false">Inactive Only</option>
                                </select>
                            </div>

                            {/* Param 9: Items Per Page `limit` */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Per Page Limit
                                </label>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value={5}>5 Per Page</option>
                                    <option value={10}>10 Per Page</option>
                                    <option value={20}>20 Per Page</option>
                                    <option value={50}>50 Per Page</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* 4. STUDENTS TABLE CONTAINER */}
                {/* ========================================================================= */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                            <p className="mt-3 text-xs font-semibold text-slate-600">
                                Fetching students directory...
                            </p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <Users className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-base font-bold text-slate-900">
                                No Students Found
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                No records matched your current search parameters and filter settings.
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-3">
                                {activeFiltersCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                                <Link
                                    to="/counsellor/addstudent"
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                                >
                                    + Add Student
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <th className="px-5 py-4">Student &amp; ID</th>
                                        <th className="px-5 py-4">Contact Details</th>
                                        <th className="px-5 py-4">Enrolled Course &amp; Fees</th>
                                        <th className="px-5 py-4">Admission Date</th>
                                        <th className="px-5 py-4">Assigned Counsellor</th>
                                        <th className="px-5 py-4">Payment Status</th>
                                        <th className="px-5 py-4">Documents</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map((student) => {
                                        const paymentConfig =
                                            PAYMENT_STATUSES.find(
                                                (p) => p.value === student.paymentStatus
                                            ) || {
                                                label: student.paymentStatus || "Pending",
                                                color: "bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20",
                                            };

                                        const coursesList = Array.isArray(student.enrolledCourses) && student.enrolledCourses.length > 0
                                            ? student.enrolledCourses
                                            : student.enrolledCourse
                                                ? [student.enrolledCourse]
                                                : [];

                                        const docCount = Array.isArray(student.documents) ? student.documents.length : 0;

                                        return (
                                            <tr
                                                key={student._id || student.s_id}
                                                className="transition hover:bg-slate-50/60"
                                            >
                                                {/* Student & ID */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 font-bold text-white shadow-2xs">
                                                            {getInitials(student.name)}
                                                        </div>
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedStudentForDetails(student)}
                                                                className="cursor-pointer text-left font-bold text-slate-900 hover:text-emerald-600 transition"
                                                            >
                                                                {student.name}
                                                            </button>
                                                            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                                                                <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                                                                    {student.s_id || "No ID"}
                                                                </span>
                                                                {student.s_id && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopy(student.s_id, "Student ID")}
                                                                        className="cursor-pointer text-slate-400 hover:text-emerald-600"
                                                                        title="Copy Student ID"
                                                                    >
                                                                        {copiedField === "Student ID" ? (
                                                                            <Check className="h-3 w-3 text-emerald-600" />
                                                                        ) : (
                                                                            <Copy className="h-3 w-3" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                                                                {student.gender || "Gender N/A"} • {student.age ? `${student.age} yrs` : "Age N/A"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contact Details */}
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1 text-[11px] text-slate-500">
                                                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                                                            <Phone className="h-3 w-3 text-slate-400" />
                                                            <span>{student.phone}</span>
                                                            {student.alternativePhone && (
                                                                <span className="text-slate-400">
                                                                    / {student.alternativePhone}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {student.email ? (
                                                            <div className="flex items-center gap-1 text-slate-600 truncate max-w-[170px]">
                                                                <Mail className="h-3 w-3 text-slate-400" />
                                                                <span>{student.email}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No email</span>
                                                        )}
                                                        {student.address && (
                                                            <div className="flex items-center gap-1 text-slate-500 truncate max-w-[170px]">
                                                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                                                <span className="truncate">{student.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Course & Fees */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                                            {coursesList.length === 0 ? (
                                                                <span className="text-slate-400 italic">None</span>
                                                            ) : (
                                                                coursesList.map((c, i) => (
                                                                    <span
                                                                        key={c._id || i}
                                                                        className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50/70 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                                                                    >
                                                                        <BookOpen className="h-2.5 w-2.5" />
                                                                        {c.name || "Course"}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                        <p className="mt-1.5 font-bold text-slate-800 text-[11px]">
                                                            {formatCurrency(student.totalFees)}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Admission Date */}
                                                <td className="px-5 py-4 text-slate-600">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{formatDate(student.dateOfAdmission || student.createdAt)}</span>
                                                    </div>
                                                    <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${student.isActive
                                                        ? "bg-emerald-100/70 text-emerald-700"
                                                        : "bg-slate-100 text-slate-500"
                                                        }`}>
                                                        {student.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </td>

                                                {/* Assigned Counsellor */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                        <span className="truncate max-w-[130px]">
                                                            {student.assignedCounsellor?.name || "Unassigned"}
                                                        </span>
                                                    </div>
                                                    {student.assignedCounsellor?.email && (
                                                        <p className="text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5">
                                                            {student.assignedCounsellor.email}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Payment Status */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ${paymentConfig.color}`}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        {paymentConfig.label}
                                                    </span>
                                                </td>

                                                {/* Documents */}
                                                <td className="px-5 py-4">
                                                    {docCount > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedStudentForDocs(student)}
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 transition"
                                                        >
                                                            <FileText className="h-3 w-3 text-emerald-600" />
                                                            <span>{docCount} {docCount === 1 ? "Doc" : "Docs"}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400 italic">None</span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedStudentForDetails(student)}
                                                            title="View Student Profile"
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-slate-300 hover:text-emerald-700"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                                                        </button>

                                                        <Link
                                                            to={`/counsellor/students/edit/${student._id || student.s_id}`}
                                                            state={{ student }}
                                                            title="Edit Student"
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                                                        >
                                                            <SquarePen className="h-3.5 w-3.5 text-slate-500 hover:text-emerald-600" />
                                                        </Link>
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
                    {students.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-200 bg-slate-50/80 px-5 py-3.5 text-xs text-slate-600">
                            <div className="flex flex-wrap items-center gap-3">
                                <div>
                                    Showing{" "}
                                    <span className="font-bold text-slate-900">
                                        {startStudentIndex}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-bold text-slate-900">
                                        {endStudentIndex}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-bold text-slate-900">
                                        {totalStudentsCount > 0 ? totalStudentsCount : students.length}
                                    </span>{" "}
                                    students
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
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
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
                                                ? "bg-emerald-600 text-white shadow-xs"
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
                {/* MODAL 1: STUDENT PROFILE DRAWER/MODAL */}
                {/* ========================================================================= */}
                {selectedStudentForDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7 space-y-5">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setSelectedStudentForDetails(null)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Header Info */}
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-lg font-bold text-white shadow-md shadow-emerald-500/20">
                                        {getInitials(selectedStudentForDetails.name)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-black text-slate-900">
                                                {selectedStudentForDetails.name}
                                            </h3>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${selectedStudentForDetails.isActive
                                                ? "bg-emerald-100 text-emerald-800"
                                                : "bg-slate-100 text-slate-600"
                                                }`}>
                                                {selectedStudentForDetails.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono">
                                            ID: {selectedStudentForDetails.s_id || selectedStudentForDetails._id}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Phone Number
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1 flex items-center justify-between">
                                        <span>{selectedStudentForDetails.phone}</span>
                                        <a href={`tel:${selectedStudentForDetails.phone}`} className="text-emerald-600 hover:underline">
                                            <PhoneCall className="h-3.5 w-3.5" />
                                        </a>
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Alternative Phone
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1">
                                        {selectedStudentForDetails.alternativePhone || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Email Address
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1 truncate">
                                        {selectedStudentForDetails.email || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Demographics (Gender / Age)
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1 capitalize">
                                        {selectedStudentForDetails.gender || "N/A"}{" "}
                                        {selectedStudentForDetails.age ? `• ${selectedStudentForDetails.age} years old` : ""}
                                    </p>
                                </div>

                                <div className="col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Residential Address
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1">
                                        {selectedStudentForDetails.address || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Admission Date
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1">
                                        {formatDate(selectedStudentForDetails.dateOfAdmission || selectedStudentForDetails.createdAt)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Total Course Fees
                                    </p>
                                    <p className="font-bold text-emerald-700 mt-1 text-sm">
                                        {formatCurrency(selectedStudentForDetails.totalFees)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Payment Status
                                    </p>
                                    <p className="font-bold capitalize text-slate-900 mt-1">
                                        {selectedStudentForDetails.paymentStatus || "pending"}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">
                                        Assigned Counsellor
                                    </p>
                                    <p className="font-semibold text-slate-900 mt-1">
                                        {selectedStudentForDetails.assignedCounsellor?.name || "Unassigned"}
                                    </p>
                                </div>
                            </div>

                            {/* Enrolled Courses */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Enrolled Courses
                                </h4>
                                <div className="space-y-1.5">
                                    {(Array.isArray(selectedStudentForDetails.enrolledCourses) && selectedStudentForDetails.enrolledCourses.length > 0
                                        ? selectedStudentForDetails.enrolledCourses
                                        : selectedStudentForDetails.enrolledCourse
                                            ? [selectedStudentForDetails.enrolledCourse]
                                            : []
                                    ).map((c, i) => (
                                        <div
                                            key={c._id || i}
                                            className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs"
                                        >
                                            <span className="font-bold text-slate-900 capitalize">
                                                {c.name || "Course"}
                                            </span>
                                            {c.totalFees && (
                                                <span className="font-semibold text-emerald-800">
                                                    {formatCurrency(c.totalFees)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Uploaded Documents List */}
                            {Array.isArray(selectedStudentForDetails.documents) &&
                                selectedStudentForDetails.documents.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                            Documents ({selectedStudentForDetails.documents.length})
                                        </h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {selectedStudentForDetails.documents.map((doc, idx) => (
                                                <div
                                                    key={doc._id || idx}
                                                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <FileText className="h-4 w-4 text-emerald-600" />
                                                        <div>
                                                            <p className="font-semibold text-slate-800 capitalize">
                                                                {doc.documentName || "Document"}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                Uploaded: {formatDate(doc.uploadedAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {doc.documentUrl && (
                                                        <a
                                                            href={doc.documentUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            View
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {/* Modal Close Action */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <Link
                                    to={`/counsellor/students/edit/${selectedStudentForDetails._id || selectedStudentForDetails.s_id}`}
                                    state={{ student: selectedStudentForDetails }}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
                                >
                                    <SquarePen className="h-3.5 w-3.5" />
                                    <span>Edit Student</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setSelectedStudentForDetails(null)}
                                    className="cursor-pointer rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL 2: DOCUMENTS QUICK PREVIEW MODAL */}
                {/* ========================================================================= */}
                {selectedStudentForDocs && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7 space-y-4">
                            <button
                                type="button"
                                onClick={() => setSelectedStudentForDocs(null)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Verification Documents
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Student: <span className="font-semibold text-slate-800">{selectedStudentForDocs.name}</span> ({selectedStudentForDocs.s_id})
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2.5 max-h-72 overflow-y-auto">
                                {Array.isArray(selectedStudentForDocs.documents) && selectedStudentForDocs.documents.length > 0 ? (
                                    selectedStudentForDocs.documents.map((doc, idx) => (
                                        <div
                                            key={doc._id || idx}
                                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs transition hover:bg-white hover:border-emerald-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                                                    📄
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 capitalize">
                                                        {doc.documentName || `Document ${idx + 1}`}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        Uploaded on {formatDate(doc.uploadedAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {doc.documentUrl ? (
                                                <a
                                                    href={doc.documentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    Open
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 italic">No link</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-6 text-xs text-slate-400">
                                        No documents uploaded for this student.
                                    </p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedStudentForDocs(null)}
                                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default CounsellorStudent;
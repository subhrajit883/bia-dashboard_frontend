import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Send, RefreshCw, Plus, Search, Filter, RotateCcw, Sparkles,
    CheckCircle2, AlertTriangle, Users, Mail, Clock,
    ChevronLeft, ChevronRight, Inbox
} from "lucide-react";
import { emailUrl, emailTemplateUrl, leadUrl, studentUrl, adminUrl } from "../../config/config";
import SendEmailModal from "../../components/EmailSender/SendEmailModal";
import EmailLogDetailsModal from "../../components/EmailSender/EmailLogDetailsModal";
import EmailLogsTable from "../../components/EmailSender/EmailLogsTable";

function CounsellorSendEmail() {
    // Delivery logs state
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    // Reference data for compose modal (templates, leads, students)
    const [templates, setTemplates] = useState([]);
    const [leads, setLeads] = useState([]);
    const [students, setStudents] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);

    // Search and filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // "" | "sent" | "delivered" | "failed" | "queued"
    const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest"

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Modals
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [selectedLogForDetails, setSelectedLogForDetails] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

    // Helper for auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Load email logs from GET /api/emails/logs
    const fetchLogs = useCallback(async (showToast = false) => {
        setLoadingLogs(true);
        try {
            const url = emailUrl?.logs || emailTemplateUrl?.logs || "/api/emails/logs";
            const response = await axios.get(url, { headers: getAuthHeaders() });

            let list = [];
            if (Array.isArray(response.data?.data)) {
                list = response.data.data;
            } else if (Array.isArray(response.data?.logs)) {
                list = response.data.logs;
            } else if (Array.isArray(response.data)) {
                list = response.data;
            }

            setLogs(list);
            if (showToast) {
                toast.success(`Updated ${list.length} email logs`);
            }
        } catch (err) {
            console.error("Fetch email logs error:", err.response?.data || err);
            toast.error(err.response?.data?.message || "Failed to fetch email logs.");
            setLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    // Load references (templates, leads, students) for compose modal
    const fetchReferences = useCallback(async () => {
        setLoadingRecipients(true);
        try {
            const headers = getAuthHeaders();

            const [tmplRes, leadsRes, studentsRes] = await Promise.all([
                axios
                    .get(emailTemplateUrl?.templates || emailUrl?.templates || "/api/emails/templates", { headers })
                    .catch(() => ({ data: { data: [] } })),
                axios
                    .get(leadUrl?.lead || "/api/leads", { headers })
                    .catch(() => ({ data: { data: [] } })),
                axios
                    .get(studentUrl?.students || adminUrl?.students || "/api/students", { headers })
                    .catch(() => ({ data: { data: [] } })),
            ]);

            // Templates
            const tmplList = Array.isArray(tmplRes.data?.data)
                ? tmplRes.data.data
                : Array.isArray(tmplRes.data)
                    ? tmplRes.data
                    : [];
            setTemplates(tmplList);

            // Leads
            const leadList = Array.isArray(leadsRes.data?.data)
                ? leadsRes.data.data
                : Array.isArray(leadsRes.data?.leads)
                    ? leadsRes.data.leads
                    : Array.isArray(leadsRes.data)
                        ? leadsRes.data
                        : [];
            setLeads(leadList);

            // Students
            const studentList = Array.isArray(studentsRes.data?.data)
                ? studentsRes.data.data
                : Array.isArray(studentsRes.data?.students)
                    ? studentsRes.data.students
                    : Array.isArray(studentsRes.data)
                        ? studentsRes.data
                        : [];
            setStudents(studentList);
        } catch (err) {
            console.error("Reference fetch error:", err);
        } finally {
            setLoadingRecipients(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        fetchReferences();
    }, [fetchLogs, fetchReferences]);

    // Copy helper
    const handleCopy = (text, fieldId) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Filter and sort calculations
    const filteredLogs = useMemo(() => {
        return logs
            .filter((log) => {
                // Search filter (subject, recipient email, template title)
                if (search.trim()) {
                    const q = search.toLowerCase();
                    const subjectMatch = (log.subject || "").toLowerCase().includes(q);
                    const templateMatch = (log.template?.title || "").toLowerCase().includes(q);
                    const recipientMatch = Array.isArray(log.recipients) &&
                        log.recipients.some((r) => r.toLowerCase().includes(q));
                    const idMatch = (log._id || "").toLowerCase().includes(q);

                    if (!subjectMatch && !templateMatch && !recipientMatch && !idMatch) {
                        return false;
                    }
                }

                // Status filter
                if (statusFilter && log.status?.toLowerCase() !== statusFilter.toLowerCase()) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "newest") {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                }
                if (sortBy === "oldest") {
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                }
                return 0;
            });
    }, [logs, search, statusFilter, sortBy]);

    // Clear filters
    const handleClearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setSortBy("newest");
        setPage(1);
    };

    // Stats calculations
    const stats = useMemo(() => {
        const totalDispatches = logs.length;
        const sentSuccess = logs.filter(
            (l) => l.status === "sent" || l.status === "delivered"
        ).length;
        const failed = logs.filter(
            (l) => l.status === "failed" || l.status === "bounced"
        ).length;
        const totalRecipientsCount = logs.reduce(
            (acc, curr) => acc + (Array.isArray(curr.recipients) ? curr.recipients.length : 0),
            0
        );

        return {
            totalDispatches,
            sentSuccess,
            failed,
            totalRecipientsCount,
        };
    }, [logs]);

    // Paginated subset
    const totalPages = Math.ceil(filteredLogs.length / limit) || 1;
    const paginatedLogs = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredLogs.slice(start, start + limit);
    }, [filteredLogs, page, limit]);

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

                                Counsellor Workspace
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">
                                Send Emails &amp; Delivery Logs
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Email Dispatch &amp; Delivery Logs
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Broadcast targeted email messages to leads and students, and audit real-time SMTP delivery logs.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => fetchLogs(true)}
                            disabled={loadingLogs}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${loadingLogs ? "animate-spin text-emerald-600" : ""}`} />
                            Refresh Logs
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsComposeModalOpen(true)}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-95"
                        >
                            <Send className="h-4 w-4" />
                            Compose &amp; Send Email
                        </button>
                    </div>
                </div>
                {/* <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Total Dispatches
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Mail className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">
                            {stats.totalDispatches}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            Campaign delivery batches
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Successfully Sent
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                            {stats.sentSuccess}
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-600/80 font-medium">
                            Delivered to mail servers
                        </p>
                    </div>

                    <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                                Delivery Failures
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                                <AlertTriangle className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-rose-700">
                            {stats.failed}
                        </p>
                        <p className="mt-0.5 text-[11px] text-rose-700/80 font-medium">
                            Failed / bounced deliveries
                        </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                Total Recipients
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                                <Users className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-indigo-900">
                            {stats.totalRecipientsCount}
                        </p>
                        <p className="mt-0.5 text-[11px] text-indigo-600/80 font-medium">
                            Individual email inboxes
                        </p>
                    </div>
                </div> */}

                {/* ========================================================================= */}
                {/* 3. SEARCH & FILTERS CONTAINER */}
                {/* ========================================================================= */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search logs by subject, recipient email, or template title..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pr-4 pl-10 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setPage(1);
                                    }}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                            >
                                <option value="">All Delivery Statuses</option>
                                <option value="sent">Sent</option>
                                <option value="delivered">Delivered</option>
                                <option value="failed">Failed</option>
                                <option value="queued">Queued</option>
                            </select>

                            {/* Sort Filter Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>

                            {(search || statusFilter || sortBy !== "newest") && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    title="Reset Filters"
                                    className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. EMAIL LOGS MAIN CONTENT */}
                {/* ========================================================================= */}
                {loadingLogs ? (
                    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-slate-200 bg-white text-slate-400">
                        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                        <p className="mt-3 text-xs font-semibold text-slate-600">
                            Fetching delivery audit logs...
                        </p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="py-20 text-center rounded-2xl border border-slate-200 bg-white shadow-xs p-8">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Inbox className="h-7 w-7" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">
                            {logs.length === 0 ? "No Email Logs Recorded" : "No Matching Delivery Logs"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                            {logs.length === 0
                                ? "You haven't dispatched any emails yet. Use the compose button above to send your first message to leads or students."
                                : "No delivery logs match your active search and filter criteria."}
                        </p>

                        <div className="mt-6 flex justify-center gap-3">
                            {(search || statusFilter) && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Clear Filters
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsComposeModalOpen(true)}
                                className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                            >
                                + Compose Email
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Table View */
                    <EmailLogsTable
                        logs={paginatedLogs}
                        onSelectLog={(log) => setSelectedLogForDetails(log)}
                        onCopy={handleCopy}
                        copiedField={copiedField}
                    />
                )}

                {/* ========================================================================= */}
                {/* 5. PAGINATION FOOTER */}
                {/* ========================================================================= */}
                {!loadingLogs && filteredLogs.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs text-slate-600 shadow-2xs">
                        <div>
                            Showing <span className="font-bold text-slate-900">{paginatedLogs.length}</span> of{" "}
                            <span className="font-bold text-slate-900">{filteredLogs.length}</span> logs
                            {" "}• Page <span className="font-bold text-slate-900">{page}</span> of{" "}
                            <span className="font-bold text-slate-900">{totalPages}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={page <= 1}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Previous
                            </button>

                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={page >= totalPages}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODALS */}
                {/* ========================================================================= */}
                <SendEmailModal
                    isOpen={isComposeModalOpen}
                    onClose={() => setIsComposeModalOpen(false)}
                    onSendSuccess={() => fetchLogs()}
                    templates={templates}
                    leads={leads}
                    students={students}
                    loadingRecipients={loadingRecipients}
                    tokenStorageKey="token"
                />

                <EmailLogDetailsModal
                    log={selectedLogForDetails}
                    onClose={() => setSelectedLogForDetails(null)}
                />
            </div>
        </section>
    );
}

export default CounsellorSendEmail;
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Mail, Plus, Search, Filter, RefreshCw, X, RotateCcw, Sparkles,
    ChevronDown, ChevronUp, Layers, Grid, List, ShieldCheck, FileEdit,
    ChevronLeft, ChevronRight, CornerDownLeft
} from "lucide-react";
import { emailTemplateUrl, emailUrl } from "../../config/config";
import { QUICK_TEMPLATES } from "../../components/EmailTemplates/emailTemplateConstants";
import EmailTemplateCard from "../../components/EmailTemplates/EmailTemplateCard";
import EmailTemplateTable from "../../components/EmailTemplates/EmailTemplateTable";
import EmailTemplateFormModal from "../../components/EmailTemplates/EmailTemplateFormModal";
import EmailTemplatePreviewModal from "../../components/EmailTemplates/EmailTemplatePreviewModal";
import EmailTemplateDeleteModal from "../../components/EmailTemplates/EmailTemplateDeleteModal";
import { preserveEmailSpacing } from "../../components/EmailTemplates/emailHtmlUtils";

function AdminEmail() {
    // Templates state
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
    const [copiedTag, setCopiedTag] = useState(null);

    // Filters and Search
    const [search, setSearch] = useState("");
    const [targetTypeFilter, setTargetTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // "" | "draft" | "published" | "active" | "inactive"
    const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "title"
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(9);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null); // null if creating, template object if editing
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form inputs state (targetType default: "all")
    const [formData, setFormData] = useState({
        title: "",
        subject: "",
        body: "",
        targetType: "all",
        isDraft: false,
        isActive: true,
    });

    // Helper to get authorization headers with Bearer token
    const getAuthHeaders = () => {
        const token = localStorage.getItem("adminToken");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Load templates from GET /api/emails/templates
    const fetchTemplates = useCallback(async (showToast = false) => {
        setLoading(true);
        try {
            const url = emailTemplateUrl?.templates || emailUrl?.templates || "/api/emails/templates";
            const res = await axios.get(url, { headers: getAuthHeaders() });

            let list = [];
            if (Array.isArray(res.data?.data)) {
                list = res.data.data;
            } else if (Array.isArray(res.data)) {
                list = res.data;
            } else if (Array.isArray(res.data?.templates)) {
                list = res.data.templates;
            } else if (res.data?.template) {
                list = [res.data.template];
            }

            setTemplates(list);
            if (showToast) {
                toast.success(`Synced ${list.length} email templates`);
            }
        } catch (err) {
            console.error("Fetch email templates error:", err.response?.data || err);
            toast.error(err.response?.data?.message || "Failed to load email templates.");
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Open Modal for Creating
    const handleOpenCreateModal = (preset = null) => {
        setEditingTemplate(null);
        if (preset) {
            setFormData({
                title: preset.title,
                subject: preset.subject,
                body: preset.body,
                targetType: preset.targetType || "all",
                isDraft: preset.isDraft ?? false,
                isActive: true,
            });
        } else {
            setFormData({
                title: "",
                subject: "",
                body: "",
                targetType: "all",
                isDraft: false,
                isActive: true,
            });
        }
        setIsFormModalOpen(true);
    };

    // Open Modal for Editing (PUT)
    const handleOpenEditModal = (template) => {
        setEditingTemplate(template);
        setFormData({
            title: template.title || "",
            subject: template.subject || "",
            body: template.body || "",
            targetType: template.targetType || "all",
            isDraft: Boolean(template.isDraft),
            isActive: template.isActive !== undefined ? template.isActive : true,
        });
        setIsFormModalOpen(true);
    };

    // Submit Create (POST) or Update (PUT)
    const handleSubmitForm = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error("Please enter a template title.");
            return;
        }
        if (!formData.subject.trim()) {
            toast.error("Please enter an email subject.");
            return;
        }
        if (!formData.body.trim()) {
            toast.error("Please provide email body content.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: formData.title.trim(),
                subject: formData.subject.trim(),
                body: preserveEmailSpacing(formData.body),
                isDraft: Boolean(formData.isDraft),
                targetType: formData.targetType || "all",
                isActive: Boolean(formData.isActive),
            };

            const headers = getAuthHeaders();

            if (editingTemplate) {
                // PUT /api/emails/templates/:templateid
                const updateUrl = emailTemplateUrl?.templateById
                    ? emailTemplateUrl.templateById(editingTemplate._id)
                    : `/api/emails/templates/${editingTemplate._id}`;

                await axios.put(updateUrl, payload, { headers });
                toast.success("Template updated successfully!");
            } else {
                // POST /api/emails/templates
                const createUrl = emailTemplateUrl?.templates || emailUrl?.templates || "/api/emails/templates";
                await axios.post(createUrl, payload, { headers });
                toast.success("Template created successfully!");
            }

            setIsFormModalOpen(false);
            fetchTemplates();
        } catch (err) {
            console.error("Save template error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to save email template. Please check the backend."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Template (DELETE /api/emails/templates/:templateid)
    const handleDeleteTemplate = async () => {
        if (!templateToDelete) return;
        setDeleting(true);
        try {
            const headers = getAuthHeaders();
            const deleteUrl = emailTemplateUrl?.templateById
                ? emailTemplateUrl.templateById(templateToDelete._id)
                : `/api/emails/templates/${templateToDelete._id}`;

            await axios.delete(deleteUrl, { headers });
            toast.success("Template deleted successfully!");
            setTemplateToDelete(null);
            fetchTemplates();
        } catch (err) {
            console.error("Delete template error:", err.response?.data || err);
            toast.error(err.response?.data?.message || "Failed to delete template.");
        } finally {
            setDeleting(false);
        }
    };

    // Copy helper
    const handleCopy = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedTag(label);
        toast.success(`Copied ${label} to clipboard!`);
        setTimeout(() => setCopiedTag(null), 2000);
    };

    // Filter and sort calculations
    const filteredTemplates = useMemo(() => {
        return templates
            .filter((t) => {
                if (search.trim()) {
                    const q = search.toLowerCase();
                    const titleMatch = (t.title || "").toLowerCase().includes(q);
                    const subjectMatch = (t.subject || "").toLowerCase().includes(q);
                    const bodyMatch = (t.body || "").toLowerCase().includes(q);
                    if (!titleMatch && !subjectMatch && !bodyMatch) return false;
                }

                if (targetTypeFilter && t.targetType !== targetTypeFilter) {
                    return false;
                }

                if (statusFilter === "draft" && !t.isDraft) return false;
                if (statusFilter === "published" && t.isDraft) return false;
                if (statusFilter === "active" && !t.isActive) return false;
                if (statusFilter === "inactive" && t.isActive) return false;

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "newest") {
                    return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
                }
                if (sortBy === "oldest") {
                    return new Date(a.createdAt || a.updatedAt || 0) - new Date(b.createdAt || b.updatedAt || 0);
                }
                if (sortBy === "title") {
                    return (a.title || "").localeCompare(b.title || "");
                }
                return 0;
            });
    }, [templates, search, targetTypeFilter, statusFilter, sortBy]);

    // Active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (targetTypeFilter) count++;
        if (statusFilter) count++;
        return count;
    }, [targetTypeFilter, statusFilter]);

    // Clear filters
    const handleClearFilters = () => {
        setSearch("");
        setTargetTypeFilter("");
        setStatusFilter("");
        setSortBy("newest");
        setPage(1);
    };

    // Stats calculations
    const stats = useMemo(() => {
        const total = templates.length;
        const activePublished = templates.filter((t) => !t.isDraft && t.isActive).length;
        const drafts = templates.filter((t) => t.isDraft).length;
        const allTemplates = templates.filter((t) => t.targetType === "all" || !t.targetType).length;
        const leadTemplates = templates.filter((t) => t.targetType === "lead").length;
        const studentTemplates = templates.filter((t) => t.targetType === "student").length;

        return {
            total,
            activePublished,
            drafts,
            allTemplates,
            leadTemplates,
            studentTemplates,
        };
    }, [templates]);

    // Paginated subset
    const totalPages = Math.ceil(filteredTemplates.length / limit) || 1;
    const paginatedTemplates = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredTemplates.slice(start, start + limit);
    }, [filteredTemplates, page, limit]);

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
                                {/* <Sparkles className="h-3.5 w-3.5" /> */}
                                Admin Workspace
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">
                                Email Templates
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Email Templates
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Create, customize, and manage email communication templates with smart dynamic tags for leads and students.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => fetchTemplates(true)}
                            disabled={loading}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOpenCreateModal()}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Create Template
                        </button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. STATS SUMMARY CARDS */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Total Templates
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Mail className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">
                            {stats.total}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            Pre-configured templates
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Active &amp; Ready
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                            {stats.activePublished}
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-600/80 font-medium">
                            Published for communication
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                                Saved Drafts
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                <FileEdit className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-amber-700">
                            {stats.drafts}
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-700/80 font-medium">
                            Unpublished drafts
                        </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                Target Split
                            </p>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                                <Layers className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 text-xl font-extrabold text-indigo-900">
                            {stats.allTemplates} <span className="text-xs font-medium text-slate-400">All</span> • {stats.leadTemplates} <span className="text-xs font-medium text-slate-400">Leads</span> • {stats.studentTemplates} <span className="text-xs font-medium text-slate-400">Students</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-indigo-600/80 font-medium">
                            {stats.allTemplates} All • {stats.leadTemplates} Leads • {stats.studentTemplates} Students
                        </p>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. SEARCH & FILTERS CONTAINER */}
                {/* ========================================================================= */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    {/* Top Row: Search Input + Mode Switcher + Toggle Filter Button */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search input */}
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search templates by title, subject line, or body contents..."
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
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Controls: View toggle + Filter toggle */}
                        <div className="flex items-center gap-2">
                            {/* View Switcher: Grid vs Table */}
                            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={`cursor-pointer rounded-lg p-1.5 transition ${viewMode === "grid"
                                        ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                                        : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    title="Card Grid View"
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("table")}
                                    className={`cursor-pointer rounded-lg p-1.5 transition ${viewMode === "table"
                                        ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                                        : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    title="Table Row View"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Filter toggle */}
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

                            {/* Reset button */}
                            {(activeFiltersCount > 0 || search || sortBy !== "newest") && (
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
                        <div className="grid gap-3 pt-3 border-t border-slate-100 sm:grid-cols-3">
                            {/* Filter 1: Target Type */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Target Audience
                                </label>
                                <select
                                    value={targetTypeFilter}
                                    onChange={(e) => {
                                        setTargetTypeFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value="">All Audiences</option>
                                    <option value="all">General / All ("all")</option>
                                    <option value="lead">Lead Only ("lead")</option>
                                    <option value="student">Student Only ("student")</option>
                                </select>
                            </div>

                            {/* Filter 2: Status */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Template Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="published">Published Only</option>
                                    <option value="draft">Drafts Only</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>

                            {/* Filter 3: Sorting */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="title">Title (A - Z)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* 4. TEMPLATES MAIN CONTENT */}
                {/* ========================================================================= */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-slate-200 bg-white text-slate-400">
                        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                        <p className="mt-3 text-xs font-semibold text-slate-600">
                            Fetching email templates...
                        </p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="py-20 text-center rounded-2xl border border-slate-200 bg-white shadow-xs p-8">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Mail className="h-7 w-7" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">
                            {templates.length === 0 ? "No Email Templates Yet" : "No Matching Templates Found"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                            {templates.length === 0
                                ? "You haven't created any email templates yet. Create your first template or choose one of our quick starter presets below."
                                : "No templates match your current search and filter settings. Try clearing the filters."}
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            {activeFiltersCount > 0 && (
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
                                onClick={() => handleOpenCreateModal()}
                                className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                            >
                                + Create Custom Template
                            </button>
                        </div>

                        {/* Quick Presets for fast onboarding */}
                        {templates.length === 0 && (
                            <div className="mt-10 pt-8 border-t border-slate-100">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                    Quick Starter Presets (Click to create)
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3 max-w-4xl mx-auto text-left">
                                    {QUICK_TEMPLATES.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleOpenCreateModal(preset)}
                                            className="group flex flex-col justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 transition text-left cursor-pointer"
                                        >
                                            <div>
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-600 group-hover:border-emerald-200 group-hover:text-emerald-700">
                                                    {preset.targetType}
                                                </span>
                                                <h4 className="mt-2 text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                                                    {preset.title}
                                                </h4>
                                                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                                                    {preset.subject}
                                                </p>
                                            </div>
                                            <span className="mt-3 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                                Use this preset <CornerDownLeft className="h-3 w-3" />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : viewMode === "grid" ? (
                    /* 4A. GRID CARD VIEW */
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {paginatedTemplates.map((template) => (
                            <EmailTemplateCard
                                key={template._id}
                                template={template}
                                onPreview={(t) => setPreviewTemplate(t)}
                                onDuplicate={(t) =>
                                    handleOpenCreateModal({
                                        title: `${t.title} (Copy)`,
                                        subject: t.subject,
                                        body: t.body,
                                        targetType: t.targetType,
                                        isDraft: true,
                                    })
                                }
                                onEdit={(t) => handleOpenEditModal(t)}
                                onDelete={(t) => setTemplateToDelete(t)}
                            />
                        ))}
                    </div>
                ) : (
                    /* 4B. TABLE ROW VIEW */
                    <EmailTemplateTable
                        templates={paginatedTemplates}
                        onPreview={(t) => setPreviewTemplate(t)}
                        onEdit={(t) => handleOpenEditModal(t)}
                        onDelete={(t) => setTemplateToDelete(t)}
                    />
                )}

                {/* ========================================================================= */}
                {/* 5. PAGINATION FOOTER */}
                {/* ========================================================================= */}
                {!loading && filteredTemplates.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs text-slate-600 shadow-2xs">
                        <div>
                            Showing <span className="font-bold text-slate-900">{paginatedTemplates.length}</span> of{" "}
                            <span className="font-bold text-slate-900">{filteredTemplates.length}</span> templates
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
                <EmailTemplateFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    editingTemplate={editingTemplate}
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleSubmitForm}
                    submitting={submitting}
                />

                <EmailTemplatePreviewModal
                    template={previewTemplate}
                    onClose={() => setPreviewTemplate(null)}
                    onEdit={(t) => handleOpenEditModal(t)}
                    onCopy={handleCopy}
                    copiedTag={copiedTag}
                />

                <EmailTemplateDeleteModal
                    template={templateToDelete}
                    onClose={() => setTemplateToDelete(null)}
                    onConfirm={handleDeleteTemplate}
                    deleting={deleting}
                />
            </div>
        </section>
    );
}

export default AdminEmail;
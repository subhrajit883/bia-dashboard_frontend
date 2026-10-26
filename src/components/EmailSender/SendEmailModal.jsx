import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Send, X, Sparkles, RefreshCw, Users, CheckSquare, Square,
    Search, UserCheck, BookOpen, AlertCircle
} from "lucide-react";
import { emailUrl, emailTemplateUrl } from "../../config/config";
import { DYNAMIC_VARIABLES, renderWithSampleData } from "./emailSendConstants";
import EmailRichTextEditor from "../EmailTemplates/EmailRichTextEditor";
import { preserveEmailSpacing } from "../EmailTemplates/emailHtmlUtils";

function SendEmailModal({
    isOpen,
    onClose,
    onSendSuccess,
    templates = [],
    leads = [],
    students = [],
    loadingRecipients = false,
    tokenStorageKey = "adminToken",
    authToken,
}) {
    // Form fields
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [title, setTitle] = useState("");
    const [customSubject, setCustomSubject] = useState("");
    const [customBody, setCustomBody] = useState("");

    // Recipient selection states
    const [recipientTab, setRecipientTab] = useState("leads"); // "leads" | "students"
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [recipientSearch, setRecipientSearch] = useState("");

    const [sending, setSending] = useState(false);

    // Reset or populate fields when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedTemplateId("");
            setTitle("");
            setCustomSubject("");
            setCustomBody("");
            setSelectedLeadIds([]);
            setSelectedStudentIds([]);
            setRecipientSearch("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Handle template selection from dropdown
    const handleTemplateChange = (templateId) => {
        setSelectedTemplateId(templateId);
        if (!templateId) return;

        const tmpl = templates.find((t) => t._id === templateId);
        if (tmpl) {
            setTitle(tmpl.title || "");
            setCustomSubject(tmpl.subject || "");
            setCustomBody(tmpl.body || "");
        }
    };

    // Filter leads & students by search query
    const filteredLeads = leads.filter((l) => {
        if (!recipientSearch.trim()) return true;
        const q = recipientSearch.toLowerCase();
        return (
            (l.name || "").toLowerCase().includes(q) ||
            (l.email || "").toLowerCase().includes(q) ||
            (l.phone || "").toLowerCase().includes(q)
        );
    });

    const filteredStudents = students.filter((s) => {
        if (!recipientSearch.trim()) return true;
        const q = recipientSearch.toLowerCase();
        return (
            (s.name || "").toLowerCase().includes(q) ||
            (s.email || "").toLowerCase().includes(q) ||
            (s.phone || "").toLowerCase().includes(q) ||
            (s.s_id || "").toLowerCase().includes(q)
        );
    });

    // Toggle single lead selection
    const toggleLeadSelection = (id) => {
        setSelectedLeadIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Toggle single student selection
    const toggleStudentSelection = (id) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Select/Deselect all visible in current tab
    const toggleSelectAllCurrentTab = () => {
        if (recipientTab === "leads") {
            const allVisibleIds = filteredLeads.map((l) => l._id);
            const isAllSelected = allVisibleIds.every((id) => selectedLeadIds.includes(id));
            if (isAllSelected) {
                setSelectedLeadIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
            } else {
                setSelectedLeadIds((prev) => [...new Set([...prev, ...allVisibleIds])]);
            }
        } else {
            const allVisibleIds = filteredStudents.map((s) => s._id);
            const isAllSelected = allVisibleIds.every((id) => selectedStudentIds.includes(id));
            if (isAllSelected) {
                setSelectedStudentIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
            } else {
                setSelectedStudentIds((prev) => [...new Set([...prev, ...allVisibleIds])]);
            }
        }
    };

    // Handle sending email
    const handleSendEmail = async (e) => {
        e.preventDefault();

        const totalRecipients = selectedLeadIds.length + selectedStudentIds.length;
        if (totalRecipients === 0) {
            toast.error("Please select at least one lead or student recipient.");
            return;
        }
        if (!customSubject.trim()) {
            toast.error("Please enter an email subject line.");
            return;
        }
        if (!customBody.trim()) {
            toast.error("Please enter the email body content.");
            return;
        }

        setSending(true);
        try {
            const token =
                authToken ||
                (tokenStorageKey ? localStorage.getItem(tokenStorageKey) : null) ||
                localStorage.getItem("adminToken") ||
                localStorage.getItem("token");

            if (!token) {
                toast.error("Authentication token not found. Please log in again.");
                setSending(false);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                title: title.trim() || customSubject.trim(),
                customSubject: customSubject.trim(),
                customBody: preserveEmailSpacing(customBody),
                leadIds: selectedLeadIds,
                studentIds: selectedStudentIds,
            };

            if (selectedTemplateId) {
                payload.templateId = selectedTemplateId;
            }

            const sendUrl = emailUrl?.send || emailTemplateUrl?.send || "/api/emails/send";
            const response = await axios.post(sendUrl, payload, { headers });

            toast.success(
                response.data?.message || `Email dispatched to ${totalRecipients} recipients!`
            );
            onSendSuccess();
            onClose();
        } catch (err) {
            console.error("Email send error:", err.response?.data || err);
            toast.error(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to dispatch email. Please check your SMTP configuration."
            );
        } finally {
            setSending(false);
        }
    };

    const totalSelected = selectedLeadIds.length + selectedStudentIds.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 md:p-6 backdrop-blur-xs overflow-hidden">
            <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Fixed Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                            <Send className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                Compose &amp; Send Email
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Select template, pick recipients, customize content, and dispatch immediately.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        className="cursor-pointer rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSendEmail} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Top Row: Template Selection & Campaign Title */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Template selector */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Load from Template (Optional)
                                </label>
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                >
                                    <option value="">Custom Email (No Template)</option>
                                    {templates.map((t) => (
                                        <option key={t._id} value={t._id}>
                                            {t.title} ({t.targetType || "all"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Title input */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Email / Campaign Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Course Follow-up, Welcome Message"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                />
                            </div>
                        </div>

                        {/* Recipient Selection Section */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-emerald-600" />
                                        Select Recipients ({totalSelected} Selected)
                                    </span>
                                    <p className="text-[11px] text-slate-500">
                                        {selectedLeadIds.length} Leads • {selectedStudentIds.length} Students selected
                                    </p>
                                </div>

                                {/* Recipient Tabs */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setRecipientTab("leads")}
                                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${recipientTab === "leads"
                                                ? "bg-blue-50 text-blue-700 font-bold"
                                                : "text-slate-500 hover:text-slate-800"
                                                }`}
                                        >
                                            Leads ({leads.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRecipientTab("students")}
                                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${recipientTab === "students"
                                                ? "bg-emerald-50 text-emerald-700 font-bold"
                                                : "text-slate-500 hover:text-slate-800"
                                                }`}
                                        >
                                            Students ({students.length})
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={toggleSelectAllCurrentTab}
                                        className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                    >
                                        <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Select All</span>
                                    </button>
                                </div>
                            </div>

                            {/* Search in recipients */}
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={recipientSearch}
                                    onChange={(e) => setRecipientSearch(e.target.value)}
                                    placeholder={`Search ${recipientTab} by name, email, or phone...`}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Recipients List Container */}
                            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                                {loadingRecipients ? (
                                    <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                                        Loading {recipientTab}...
                                    </div>
                                ) : recipientTab === "leads" ? (
                                    filteredLeads.length === 0 ? (
                                        <p className="py-6 text-center text-xs text-slate-400">
                                            No leads available.
                                        </p>
                                    ) : (
                                        filteredLeads.map((lead) => {
                                            const isSelected = selectedLeadIds.includes(lead._id);
                                            return (
                                                <div
                                                    key={lead._id}
                                                    onClick={() => toggleLeadSelection(lead._id)}
                                                    className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition hover:bg-slate-50 ${isSelected ? "bg-blue-50/50" : ""
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        {isSelected ? (
                                                            <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                                                        ) : (
                                                            <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                                        )}
                                                        <div>
                                                            <p className="font-bold text-slate-800">
                                                                {lead.name}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400">
                                                                {lead.email || "No email"} • {lead.phone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                        {lead.interestedCourse?.name || lead.interestedCourse || "Lead"}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )
                                ) : filteredStudents.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-slate-400">
                                        No enrolled students available.
                                    </p>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const isSelected = selectedStudentIds.includes(student._id);
                                        return (
                                            <div
                                                key={student._id}
                                                onClick={() => toggleStudentSelection(student._id)}
                                                className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition hover:bg-slate-50 ${isSelected ? "bg-emerald-50/50" : ""
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    {isSelected ? (
                                                        <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                                                    ) : (
                                                        <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-800">
                                                            {student.name}{" "}
                                                            <span className="text-[10px] text-emerald-700 font-mono">
                                                                ({student.s_id || "Student"})
                                                            </span>
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {student.email || "No email"} • {student.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                    Active Learner
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Subject Line Input */}
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Custom Subject Line <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={customSubject}
                                onChange={(e) => setCustomSubject(e.target.value)}
                                placeholder="e.g. Information regarding your course inquiry"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>

                        {/* Rich Email Body Text Editor (Preserves line breaks, blank lines, indents) */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Custom Email Body <span className="text-rose-500">*</span>
                            </label>

                            <EmailRichTextEditor
                                value={customBody}
                                onChange={setCustomBody}
                                dynamicVariables={DYNAMIC_VARIABLES}
                                sampleDataReplacer={renderWithSampleData}
                                placeholder="Write personalized email content... All line breaks, blank lines, and indentations are preserved as HTML."
                            />
                        </div>
                    </div>

                    {/* Fixed Modal Actions Footer */}
                    <div className="shrink-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3.5">
                        <div className="text-xs text-slate-500">
                            Total Recipients: <span className="font-bold text-slate-900">{totalSelected}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={sending}
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={sending || totalSelected === 0}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                                {sending ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Dispatch to {totalSelected} Recipient{totalSelected === 1 ? "" : "s"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SendEmailModal;

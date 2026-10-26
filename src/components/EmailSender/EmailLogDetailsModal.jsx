import { useState } from "react";
import { Mail, X, Check, Copy, Clock, ShieldCheck, Tag, Info, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { STATUS_CONFIG, formatDateTime } from "./emailSendConstants";

function EmailLogDetailsModal({ log, onClose }) {
    const [copiedField, setCopiedField] = useState(null);

    if (!log) return null;

    const statusStyle =
        STATUS_CONFIG[log.status?.toLowerCase()] || STATUS_CONFIG.sent;

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName} to clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7 space-y-5">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Email Delivery Log
                                </h3>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ${statusStyle.color}`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotColor}`} />
                                    {statusStyle.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                Log ID: {log._id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3.5 text-xs">
                    {/* Subject */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Email Subject
                        </span>
                        <p className="mt-1 font-bold text-slate-900 text-sm">
                            {log.subject || "No Subject"}
                        </p>
                    </div>

                    {/* Template Used */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Template Association
                        </span>
                        {log.template ? (
                            <div className="mt-1 flex items-center justify-between">
                                <span className="font-semibold text-emerald-800">
                                    {log.template.title || log.template._id || "Linked Template"}
                                </span>
                                {log.template._id && (
                                    <span className="font-mono text-[10px] text-slate-400">
                                        ID: {log.template._id}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="mt-1 text-slate-500 italic">
                                Custom Email (No Template)
                            </p>
                        )}
                    </div>

                    {/* Recipients List */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Recipients ({Array.isArray(log.recipients) ? log.recipients.length : 0})
                            </span>
                            {Array.isArray(log.recipients) && log.recipients.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleCopy(log.recipients.join(", "), "Recipients")}
                                    className="cursor-pointer text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                                >
                                    {copiedField === "Recipients" ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                    Copy All
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                            {Array.isArray(log.recipients) && log.recipients.length > 0 ? (
                                log.recipients.map((email, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs"
                                    >
                                        <Mail className="h-3 w-3 text-slate-400" />
                                        {email}
                                    </span>
                                ))
                            ) : (
                                <p className="text-slate-400 italic">No recipients recorded</p>
                            )}
                        </div>
                    </div>

                    {/* Provider Message ID */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Provider Message ID (SMTP / SES)
                            </span>
                            {log.providerMessageId && (
                                <button
                                    type="button"
                                    onClick={() => handleCopy(log.providerMessageId, "Provider Message ID")}
                                    className="cursor-pointer text-slate-400 hover:text-emerald-600 transition"
                                    title="Copy Message ID"
                                >
                                    {copiedField === "Provider Message ID" ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            )}
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-slate-700 break-all">
                            {log.providerMessageId || "N/A"}
                        </p>
                    </div>

                    {/* Sent By & Timestamps */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Dispatched By
                            </span>
                            <p className="mt-1 font-semibold text-slate-800">
                                Name:{" "}{typeof log.sentBy === "object" ? log.sentBy?.name || "Counsellor" : log.sentBy || "Counsellor"}
                            </p>
                            <p className="mt-1 font-semibold text-slate-800">
                                Username:{" "}{typeof log.sentBy === "object" ? log.sentBy?.username || "Counsellor" : log.sentBy || "Counsellor"}
                            </p>

                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Sent Timestamp
                            </span>
                            <p className="mt-1 font-semibold text-slate-800 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {formatDateTime(log.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EmailLogDetailsModal;

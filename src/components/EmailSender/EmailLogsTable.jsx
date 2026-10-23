import { Mail, Eye, Clock, Check, Copy } from "lucide-react";
import { STATUS_CONFIG, formatDateTime } from "./emailSendConstants";

function EmailLogsTable({ logs, onSelectLog, onCopy, copiedField }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="px-5 py-4">Subject &amp; Template</th>
                            <th className="px-5 py-4">Recipients</th>
                            <th className="px-5 py-4">Delivery Status</th>
                            <th className="px-5 py-4">Provider Message ID</th>
                            <th className="px-5 py-4">Sent At</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => {
                            const statusStyle =
                                STATUS_CONFIG[log.status?.toLowerCase()] || STATUS_CONFIG.sent;
                            const recipientCount = Array.isArray(log.recipients) ? log.recipients.length : 0;
                            const primaryRecipient = recipientCount > 0 ? log.recipients[0] : "No recipient";

                            return (
                                <tr
                                    key={log._id}
                                    className="transition hover:bg-slate-50/60"
                                >
                                    {/* Subject & Template */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 font-bold text-white shadow-2xs">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="max-w-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectLog(log)}
                                                    className="cursor-pointer text-left font-bold text-slate-900 hover:text-emerald-600 transition truncate block max-w-xs"
                                                >
                                                    {log.subject || "No Subject"}
                                                </button>
                                                <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                                                    {log.template?.title ? (
                                                        <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md truncate max-w-[150px]">
                                                            {log.template.title}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">
                                                            Direct Email
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Recipients */}
                                    <td className="px-5 py-4">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                                                <span className="truncate max-w-[180px]">{primaryRecipient}</span>
                                                {recipientCount > 1 && (
                                                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                                        +{recipientCount - 1} more
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400">
                                                {recipientCount} recipient{recipientCount === 1 ? "" : "s"} total
                                            </p>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ${statusStyle.color}`}
                                        >
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotColor}`} />
                                            {statusStyle.label}
                                        </span>
                                    </td>

                                    {/* Provider Message ID */}
                                    <td className="px-5 py-4">
                                        {log.providerMessageId ? (
                                            <div className="flex items-center gap-1.5 max-w-[180px]">
                                                <span className="font-mono text-[11px] text-slate-600 truncate">
                                                    {log.providerMessageId}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onCopy(log.providerMessageId, log._id)}
                                                    className="cursor-pointer text-slate-400 hover:text-emerald-600"
                                                    title="Copy Message ID"
                                                >
                                                    {copiedField === log._id ? (
                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">N/A</span>
                                        )}
                                    </td>

                                    {/* Sent At */}
                                    <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">
                                        <div className="flex items-center gap-1 text-[11px]">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            <span>{formatDateTime(log.createdAt)}</span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onSelectLog(log)}
                                            title="View Log Details"
                                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EmailLogsTable;

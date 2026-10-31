import { Mail, Eye, SquarePen, Trash2 } from "lucide-react";
import { TARGET_TYPES, extractTags, formatDate } from "./emailTemplateConstants";

function EmailTemplateTable({ templates, onPreview, onEdit, onDelete, canEdit = true }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="px-5 py-4">Template Title</th>
                            <th className="px-5 py-4">Target Audience</th>
                            <th className="px-5 py-4">Subject Line</th>
                            <th className="px-5 py-4">Dynamic Tags</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4">Last Updated</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {templates.map((template) => {
                            const targetConfig =
                                TARGET_TYPES.find((t) => t.value === template.targetType) || {
                                    label: template.targetType || "all",
                                    color: "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20",
                                };
                            const detectedTags = extractTags(`${template.subject} ${template.body}`);
                            const showEdit = typeof canEdit === "function" ? canEdit(template) : canEdit;

                            return (
                                <tr
                                    key={template._id}
                                    className="transition hover:bg-slate-50/60"
                                >
                                    {/* Title */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 font-bold text-white shadow-2xs">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => onPreview(template)}
                                                    className="cursor-pointer text-left font-bold text-slate-900 hover:text-emerald-600 transition"
                                                >
                                                    {template.title}
                                                </button>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                    ID: {template._id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Target Type */}
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ${targetConfig.color}`}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            {targetConfig.label}
                                        </span>
                                    </td>

                                    {/* Subject */}
                                    <td className="px-5 py-4 text-slate-700 font-medium max-w-xs truncate">
                                        {template.subject}
                                    </td>

                                    {/* Dynamic Tags */}
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {detectedTags.length === 0 ? (
                                                <span className="text-slate-400 italic">None</span>
                                            ) : (
                                                detectedTags.slice(0, 3).map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))
                                            )}
                                            {detectedTags.length > 3 && (
                                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                                    +{detectedTags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        {template.isDraft ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                                Draft
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                                Published
                                            </span>
                                        )}
                                    </td>

                                    {/* Date */}
                                    <td className="px-5 py-4 text-slate-500 font-medium">
                                        {formatDate(template.updatedAt || template.createdAt)}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onPreview(template)}
                                                title="Preview Template"
                                                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>

                                            {showEdit && onEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(template)}
                                                    title="Edit Template"
                                                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                                                >
                                                    <SquarePen className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => onDelete(template)}
                                                title="Delete Template"
                                                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-rose-500 transition hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
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

export default EmailTemplateTable;

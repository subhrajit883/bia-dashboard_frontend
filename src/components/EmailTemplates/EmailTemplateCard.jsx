import { Clock, Eye, Copy, SquarePen, Trash2, Tag } from "lucide-react";
import { TARGET_TYPES, extractTags, stripHtml, formatDate } from "./emailTemplateConstants";

function EmailTemplateCard({
    template,
    onPreview,
    onDuplicate,
    onEdit,
    onDelete,
}) {
    const targetConfig =
        TARGET_TYPES.find((t) => t.value === template.targetType) || {
            label: template.targetType || "all",
            color: "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20",
        };

    const detectedTags = extractTags(`${template.subject} ${template.body}`);
    const plainTextBody = stripHtml(template.body);

    return (
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-emerald-200 hover:shadow-md">
            <div>
                {/* Top badges: Target Type & Draft/Published */}
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ${targetConfig.color}`}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {targetConfig.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                        {template.isDraft ? (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                Draft
                            </span>
                        ) : (
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Published
                            </span>
                        )}

                        <span
                            className={`h-2 w-2 rounded-full ${template.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                            title={template.isActive ? "Active template" : "Inactive template"}
                        />
                    </div>
                </div>

                {/* Template Title */}
                <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {template.title}
                </h3>

                {/* Subject line */}
                <div className="mt-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Subject Line
                    </span>
                    <p className="font-semibold text-slate-800 line-clamp-1 mt-0.5">
                        {template.subject}
                    </p>
                </div>

                {/* Snippet preview */}
                <div className="mt-3 text-xs text-slate-500">
                    <p className="line-clamp-3 leading-relaxed">
                        {plainTextBody || "No body content..."}
                    </p>
                </div>

                {/* Dynamic Tags detected */}
                {detectedTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {detectedTags.slice(0, 4).map((tag, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700"
                            >
                                <Tag className="h-2.5 w-2.5" />
                                {tag}
                            </span>
                        ))}
                        {detectedTags.length > 4 && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                +{detectedTags.length - 4} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Card Footer: Metadata and Quick Actions */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(template.updatedAt || template.createdAt)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Preview button */}
                    <button
                        type="button"
                        onClick={() => onPreview(template)}
                        title="Preview Email"
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>

                    {/* Duplicate / Clone */}
                    <button
                        type="button"
                        onClick={() => onDuplicate(template)}
                        title="Duplicate Template"
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                        type="button"
                        onClick={() => onEdit(template)}
                        title="Edit Template"
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                    >
                        <SquarePen className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                        type="button"
                        onClick={() => onDelete(template)}
                        title="Delete Template"
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-rose-500 transition hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EmailTemplateCard;

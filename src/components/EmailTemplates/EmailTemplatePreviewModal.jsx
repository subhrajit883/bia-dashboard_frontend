import { useState } from "react";
import { Eye, X, Copy, Check, SquarePen } from "lucide-react";
import { renderWithSampleData, extractTags } from "./emailTemplateConstants";

function EmailTemplatePreviewModal({ template, onClose, onEdit, onCopy, copiedTag, canEdit = true }) {
    const [previewMode, setPreviewMode] = useState("rendered"); // "rendered" | "raw"
    const showEdit = typeof canEdit === "function" ? canEdit(template) : canEdit;

    if (!template) return null;

    const detectedTags = extractTags(`${template.subject} ${template.body}`);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 sm:p-7 space-y-4">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <Eye className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {template.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Target: <strong className="text-emerald-700">{template.targetType || "all"}</strong>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className={`text-[10px] font-bold uppercase ${template.isDraft ? "text-amber-600" : "text-emerald-600"}`}>
                                    {template.isDraft ? "Draft" : "Published"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mode switch */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 mr-8">
                        <button
                            type="button"
                            onClick={() => setPreviewMode("rendered")}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition ${previewMode === "rendered"
                                ? "bg-white text-emerald-700 shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Sample Render
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode("raw")}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition ${previewMode === "raw"
                                ? "bg-white text-emerald-700 shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Raw HTML
                        </button>
                    </div>
                </div>

                {/* Simulated Mail Client Window */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs">
                    {/* Email meta header */}
                    <div className="p-4 border-b border-slate-200/80 space-y-1.5 text-xs bg-white">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400 w-16 uppercase text-[10px]">
                                Subject:
                            </span>
                            <span className="font-bold text-slate-900">
                                {previewMode === "rendered"
                                    ? renderWithSampleData(template.subject)
                                    : template.subject}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400 w-16 uppercase text-[10px]">
                                From:
                            </span>
                            <span className="text-slate-600">
                                Admissions Office &lt;counsellor@bia.edu&gt;
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400 w-16 uppercase text-[10px]">
                                To:
                            </span>
                            <span className="text-slate-600">
                                Subhrajit Mukherjee &lt;subhrajit.mukherjee@gmail.com&gt;
                            </span>
                        </div>
                    </div>

                    {/* Email Body */}
                    <div className="p-6 bg-white min-h-[260px]">
                        {previewMode === "rendered" ? (
                            <div
                                className="prose prose-sm max-w-none text-slate-800 text-xs leading-relaxed space-y-2"
                                dangerouslySetInnerHTML={{
                                    __html: renderWithSampleData(template.body),
                                }}
                            />
                        ) : (
                            <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {template.body}
                            </pre>
                        )}
                    </div>
                </div>

                {/* Detected Variables Bar */}
                {detectedTags.length > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Dynamic Variables In This Template:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {detectedTags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modal Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {/* <button
                        type="button"
                        onClick={() => onCopy(template.body, "HTML Code")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        {copiedTag === "HTML Code" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                        Copy HTML
                    </button> */}

                    <div className="flex items-center gap-2">
                        {showEdit && onEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEdit(template);
                                }}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
                            >
                                <SquarePen className="h-3.5 w-3.5" />
                                Edit Template
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmailTemplatePreviewModal;

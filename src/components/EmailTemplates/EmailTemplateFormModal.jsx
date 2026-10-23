import { X, RefreshCw } from "lucide-react";
import { DYNAMIC_VARIABLES, renderWithSampleData } from "./emailTemplateConstants";
import EmailRichTextEditor from "./EmailRichTextEditor";
import { preserveEmailSpacing } from "./emailHtmlUtils";

function EmailTemplateFormModal({
    isOpen,
    onClose,
    editingTemplate,
    formData,
    setFormData,
    onSubmit,
    submitting,
}) {
    if (!isOpen) return null;

    // Wrap form submit to guarantee email spacing preservation
    const handleFormSubmit = (e) => {
        e.preventDefault();
        const safeBody = preserveEmailSpacing(formData.body);
        // Ensure formData has normalized spacing
        setFormData((prev) => ({ ...prev, body: safeBody }));
        onSubmit(e);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 md:p-6 backdrop-blur-xs overflow-hidden">
            {/* Modal Card - strictly bounded to viewport height (max-h-[90vh]) */}
            <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Fixed Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white shrink-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {editingTemplate ? "Edit Email Template" : "Create New Email Template"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="cursor-pointer rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Wrapper with flexbox */}
                <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Title & Target Type Row */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Template Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Course Follow-up, Welcome to Academy"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Target Audience (targetType) <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.targetType}
                                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                >
                                    <option value="all">All / General Audience ("all")</option>
                                    <option value="lead">Lead ("lead") - Inquiries &amp; Prospects</option>
                                    <option value="student">Student ("student") - Enrolled Learners</option>
                                </select>
                            </div>
                        </div>

                        {/* Subject Line Input */}
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Email Subject Line <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="e.g. Information about {{course}} for {{name}}"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>

                        {/* Rich Email Body Text Editor (Preserves line breaks, blank lines, indents) */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Email Body Editor <span className="text-rose-500">*</span>
                            </label>

                            <EmailRichTextEditor
                                value={formData.body}
                                onChange={(nextBody) => setFormData((prev) => ({ ...prev, body: nextBody }))}
                                dynamicVariables={DYNAMIC_VARIABLES}
                                sampleDataReplacer={renderWithSampleData}
                                placeholder="Write your email here... All line breaks, blank lines, and indentations are preserved as HTML."
                            />
                        </div>

                        {/* Status Switches Row: Draft & Active */}
                        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-100">
                            <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition">
                                <input
                                    type="checkbox"
                                    checked={formData.isDraft}
                                    onChange={(e) => setFormData({ ...formData, isDraft: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">
                                        Save as Draft
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Drafts remain unpublished and will not be used in automations.
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">
                                        Template Active
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Enable template for counsellor selection &amp; sending.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Fixed Footer with Action Buttons */}
                    <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-3.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-60"
                        >
                            {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                            {editingTemplate ? "Update Template" : "Save Template"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EmailTemplateFormModal;

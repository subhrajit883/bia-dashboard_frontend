import { Trash2, RefreshCw } from "lucide-react";

function EmailTemplateDeleteModal({ template, onClose, onConfirm, deleting }) {
    if (!template) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <Trash2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Delete Email Template?
                        </h3>
                        <p className="text-xs text-slate-500">
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-xs text-rose-900">
                    Are you sure you want to permanently delete:
                    <p className="mt-1 font-bold text-rose-950">
                        &ldquo;{template.title}&rdquo;
                    </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 transition disabled:opacity-60"
                    >
                        {deleting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EmailTemplateDeleteModal;

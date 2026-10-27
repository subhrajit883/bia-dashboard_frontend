// Status styling and labels for email logs
export const STATUS_CONFIG = {
    sent: {
        label: "Sent",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20",
        dotColor: "bg-emerald-500",
    },
    delivered: {
        label: "Delivered",
        color: "bg-teal-50 text-teal-700 border-teal-200 ring-teal-500/20",
        dotColor: "bg-teal-500",
    },
    failed: {
        label: "Failed",
        color: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
        dotColor: "bg-rose-500",
    },
    bounced: {
        label: "Bounced",
        color: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
        dotColor: "bg-rose-500",
    },
    queued: {
        label: "Queued",
        color: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20",
        dotColor: "bg-amber-500",
    },
};

// Common dynamic tags
export const DYNAMIC_VARIABLES = [
    { tag: "{{name}}", label: "Recipient Name" },
    { tag: "{{course}}", label: "Course Name" },
    { tag: "{{counsellorName}}", label: "Counsellor Name" },
    { tag: "{{counsellorPhone}}", label: "Counsellor Phone" },
    { tag: "{{counsellorEmail}}", label: "Counsellor Email" },
];

// Format date and time (e.g., 23 Oct 2026, 02:57 PM)
export const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return String(isoString);
    }
};

// Format date only
export const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(isoString);
    }
};

// Sample data substitution for live preview
export const renderWithSampleData = (text) => {
    if (!text) return "";
    return text
        .replace(/\{\{\s*name\s*\}\}/gi, "Subhrajit Mukherjee")
        .replace(/\{\{\s*course\s*\}\}/gi, "Film Acting")
        .replace(/\{\{\s*counsellorName\s*\}\}/gi, "Counsellor2")
        .replace(/\{\{\s*counsellorPhone\s*\}\}/gi, "+91 98765 43210")
        .replace(/\{\{\s*counsellorEmail\s*\}\}/gi, "counsellor2@biacademy.com")
        .replace(/\{\{\s*phone\s*\}\}/gi, "+91 98765 43210")
        .replace(/\{\{\s*email\s*\}\}/gi, "candidate@example.com");
};

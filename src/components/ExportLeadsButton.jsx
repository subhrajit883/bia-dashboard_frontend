import { useState } from "react";
import toast from "react-hot-toast";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import {
    exportAllLeadsFromApi,
    generateLeadsExcel,
} from "../utils/exportLeadsToExcel";

/**
 * Reusable ExportLeadsButton component.
 * When clicked, it fetches all matching leads from the API (res.data)
 * or uses the provided leads data to generate and download an Excel (.xlsx) file.
 * 
 * @param {Object} props
 * @param {Object} [props.filters] - Current query/filter parameters to fetch all matching leads
 * @param {Array} [props.leads] - Current leads list (used as fallback or when all leads are loaded)
 * @param {number} [props.totalLeadsCount] - Total number of leads in the system/query
 * @param {string} [props.filename] - Custom filename for the exported excel file
 * @param {string} [props.className] - Additional classes for button styling
 * @param {string} [props.buttonText] - Text to show on button (default: "Export Excel")
 * @param {boolean} [props.disabled] - Disabled state override
 */
function ExportLeadsButton({
    filters = {},
    leads = [],
    totalLeadsCount = 0,
    filename,
    className = "",
    buttonText = "Export Excel",
    disabled = false,
}) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (isExporting) return;

        setIsExporting(true);
        const toastId = toast.loading("Preparing Excel sheet with leads data...");

        try {
            // Clean up filters to pass to the API
            const cleanFilters = {};
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (
                        value !== "" &&
                        value !== null &&
                        value !== undefined &&
                        key !== "page" &&
                        key !== "limit"
                    ) {
                        cleanFilters[key] = value;
                    }
                });
            }

            let result;

            // If leads already contain the entire dataset, export directly
            if (
                leads.length > 0 &&
                totalLeadsCount > 0 &&
                leads.length >= totalLeadsCount
            ) {
                result = generateLeadsExcel(leads, { filename });
            } else {
                // Otherwise, call API to fetch all matching leads from res.data
                result = await exportAllLeadsFromApi(cleanFilters, { filename });
            }

            toast.success(
                `Successfully exported ${result.count} leads to Excel!`,
                { id: toastId }
            );
        } catch (err) {
            console.error("Export leads error:", err);

            // Graceful fallback to existing leads in state if API fetch fails
            if (leads && leads.length > 0) {
                try {
                    const fallback = generateLeadsExcel(leads, { filename });
                    toast.success(
                        `Exported ${fallback.count} leads (current view) to Excel.`,
                        { id: toastId }
                    );
                    return;
                } catch {
                    // Ignore fallback failure
                }
            }

            toast.error(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to export leads to Excel.",
                { id: toastId }
            );
        } finally {
            setIsExporting(false);
        }
    };

    const isBtnDisabled =
        disabled ||
        isExporting ||
        (leads.length === 0 && (!totalLeadsCount || totalLeadsCount === 0));

    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={isBtnDisabled}
            title="Export all leads to Excel sheet (.xlsx)"
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 shadow-xs transition hover:bg-emerald-100 hover:border-emerald-300 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        >
            {isExporting ? (
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            )}
            <span>{isExporting ? "Exporting..." : buttonText}</span>
        </button>
    );
}

export default ExportLeadsButton;

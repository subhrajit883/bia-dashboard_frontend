import * as XLSX from "xlsx";
import axios from "axios";
import { leadUrl } from "../config/config";

/**
 * Extracts an array of lead objects from any standard API response shape.
 * Handles:
 *  - Array: [ {...}, {...} ]
 *  - Object with data property: { data: [ {...} ] }
 *  - Object with leads property: { leads: [ {...} ] }
 *  - Nested: { data: { leads: [ {...} ] } }
 *  - Single lead object: { _id: "...", name: "..." }
 * 
 * @param {any} apiData - The response.data or leads array received from the API
 * @returns {Array} Array of lead objects
 */
export const extractLeadsFromApiResponse = (apiData) => {
    if (!apiData) return [];
    if (Array.isArray(apiData)) return apiData;
    if (Array.isArray(apiData.data)) return apiData.data;
    if (Array.isArray(apiData.leads)) return apiData.leads;
    if (Array.isArray(apiData.data?.leads)) return apiData.data.leads;
    if (Array.isArray(apiData.result)) return apiData.result;
    if (Array.isArray(apiData.items)) return apiData.items;
    if (typeof apiData === "object" && apiData._id) return [apiData];
    return [];
};

/**
 * Helper to format date strings into YYYY-MM-DD
 */
const formatDate = (dateVal) => {
    if (!dateVal) return "";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    } catch {
        return String(dateVal);
    }
};

/**
 * Helper to format date-time strings into human readable text
 */
const formatDateTime = (dateVal) => {
    if (!dateVal) return "";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return String(dateVal);
    }
};

/**
 * Transforms a single lead object into a clean, flat record for Excel
 */
export const formatLeadForExcel = (lead, index) => {
    if (!lead || typeof lead !== "object") return {};

    // Source name
    let sourceName = "Direct / Unknown";
    if (typeof lead.source === "object" && lead.source?.name) {
        sourceName = lead.source.name;
    } else if (typeof lead.source === "string" && lead.source.trim()) {
        sourceName = lead.source;
    }

    // Enrolled / Interested Courses
    let coursesList = "";
    if (Array.isArray(lead.enrolledCourses)) {
        coursesList = lead.enrolledCourses
            .map((c) => (typeof c === "object" ? c?.name || c?.courseName : c))
            .filter(Boolean)
            .join(", ");
    }

    // Counsellor
    let counsellorName = "Unassigned";
    let counsellorEmail = "";
    if (typeof lead.assignedCounsellor === "object" && lead.assignedCounsellor) {
        counsellorName = lead.assignedCounsellor.name || "Unassigned";
        counsellorEmail = lead.assignedCounsellor.email || "";
    } else if (typeof lead.assignedCounsellor === "string") {
        counsellorName = lead.assignedCounsellor;
    }

    // Converted Status
    const isConverted =
        lead.conversionStatus === "approved" || Boolean(lead.convertedStudent);

    // Follow-ups / Remarks
    const remarks = Array.isArray(lead.remarks)
        ? lead.remarks
        : Array.isArray(lead.followUps)
            ? lead.followUps
            : [];

    let latestRemarkDate = "";
    let nextCallScheduled = "";
    let latestRemarkDescription = "";

    if (remarks.length > 0) {
        // Sort newest first
        const sorted = [...remarks].sort(
            (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
        );
        const latest = sorted[0];
        latestRemarkDate = formatDate(latest.date || latest.createdAt);
        latestRemarkDescription = latest.description || latest.notes || "";

        // Check for latest upcoming call
        const withNextCall = sorted.find((r) => r.nextCallDate);
        if (withNextCall) {
            nextCallScheduled = formatDate(withNextCall.nextCallDate);
        }
    }

    return {
        "Sl No": index + 1,
        // "Lead ID": lead._id || "",
        "Enquiry Date": formatDate(lead.date || lead.createdAt),
        "Candidate Name": lead.name || "",
        "Phone Number": lead.phone ? String(lead.phone) : "",
        "Alternative Phone": lead.alternativePhone ? String(lead.alternativePhone) : "",
        "Email Address": lead.email || "",
        "Gender": lead.gender ? lead.gender.charAt(0).toUpperCase() + lead.gender.slice(1) : "",
        "Candidate Type": lead.candidateType ? String(lead.candidateType).toUpperCase() : "LEAD",
        "Source": sourceName,
        "Interested Course(s)": coursesList || "None",
        "Assigned Counsellor": counsellorName,
        "Counsellor Email": counsellorEmail,
        "Candidate Status": lead.candidateStatus
            ? lead.candidateStatus.charAt(0).toUpperCase() + lead.candidateStatus.slice(1)
            : "Ongoing",
        // "Conversion Status": lead.conversionStatus
        //     ? lead.conversionStatus.replace(/_/g, " ").toUpperCase()
        //     : "NOT REQUESTED",
        "Converted to Student": isConverted ? "Yes" : "No",
        "Date of Birth": formatDate(lead.dob),
        "Full Address": lead.fullAddress || "",
        "Total Follow-ups": remarks.length,
        "Latest Follow-up Date": latestRemarkDate,
        "Next Call Date": nextCallScheduled,
        "Latest Follow-up Note": latestRemarkDescription,
        "Last Updated": formatDateTime(lead.updatedAt || lead.createdAt),
    };
};

/**
 * Calculates responsive column widths for an Excel worksheet based on max text length
 */
const calculateColumnWidths = (rows) => {
    if (!rows || rows.length === 0) return [];
    const keys = Object.keys(rows[0]);
    return keys.map((key) => {
        let maxLen = key.length;
        for (const row of rows) {
            const val = row[key];
            if (val !== undefined && val !== null) {
                const str = String(val);
                if (str.length > maxLen) {
                    maxLen = Math.min(str.length, 50);
                }
            }
        }
        return { wch: Math.max(maxLen + 3, 10) };
    });
};

/**
 * Generates and downloads an Excel file (.xlsx) from raw API response or lead array.
 * 
 * @param {any} leadsOrApiResponse - The raw res.data from API or an array of leads
 * @param {Object} options - Options including custom filename
 * @returns {Object} { count, filename }
 */
export const generateLeadsExcel = (leadsOrApiResponse, options = {}) => {
    const rawLeads = extractLeadsFromApiResponse(leadsOrApiResponse);

    if (!rawLeads || rawLeads.length === 0) {
        throw new Error("No leads found in the provided data to export.");
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = options.filename || `Academy_Leads_Report_${todayStr}.xlsx`;

    // 1. Convert leads into rows
    const rows = rawLeads.map((lead, idx) => formatLeadForExcel(lead, idx));

    // 2. Create workbook & worksheet
    const wb = XLSX.utils.book_new();
    const wsLeads = XLSX.utils.json_to_sheet(rows);

    // 3. Set auto-width columns
    wsLeads["!cols"] = calculateColumnWidths(rows);

    // 4. Append Leads Sheet
    XLSX.utils.book_append_sheet(wb, wsLeads, "Leads Data");

    // 5. Create a Summary Sheet
    const interestedCount = rawLeads.filter(
        (l) => l.candidateStatus === "interested"
    ).length;
    const ongoingCount = rawLeads.filter(
        (l) => l.candidateStatus === "ongoing"
    ).length;
    const closedCount = rawLeads.filter(
        (l) => l.candidateStatus === "closed"
    ).length;
    const convertedCount = rawLeads.filter(
        (l) => l.conversionStatus === "approved" || Boolean(l.convertedStudent)
    ).length;

    const summaryData = [
        { "Summary Metric": "Total Leads Exported", "Details": rawLeads.length },
        { "Summary Metric": "Ongoing Leads", "Details": ongoingCount },
        { "Summary Metric": "Interested Leads", "Details": interestedCount },
        { "Summary Metric": "Closed Leads", "Details": closedCount },
        { "Summary Metric": "Converted to Students", "Details": convertedCount },
        {
            "Summary Metric": "Conversion Rate",
            "Details":
                rawLeads.length > 0
                    ? `${((convertedCount / rawLeads.length) * 100).toFixed(1)}%`
                    : "0.0%",
        },
        { "Summary Metric": "Generated On", "Details": new Date().toLocaleString("en-IN") },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 26 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Overview Summary");

    // 6. Write and trigger browser download
    XLSX.writeFile(wb, filename);

    return {
        count: rawLeads.length,
        filename,
    };
};

/**
 * Fetches all leads from the API matching the specified filters and exports them to an Excel file.
 * 
 * @param {Object} filters - Active filter query params (search, candidateType, dateFrom, etc.)
 * @param {Object} options - Custom options (e.g., custom filename)
 * @returns {Promise<Object>} { count, filename }
 */
export const exportAllLeadsFromApi = async (filters = {}, options = {}) => {
    const adminToken = localStorage.getItem("adminToken");
    const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

    // Request all matching leads with limit: 10000 to bypass page limits
    const params = {
        page: 1,
        limit: 10000,
        ...filters,
    };

    // Clean up empty filter values
    Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === null || params[k] === undefined) {
            delete params[k];
        }
    });

    const response = await axios.get(leadUrl.lead, {
        params,
        headers,
    });

    // Pass response.data directly to generateLeadsExcel
    return generateLeadsExcel(response.data, options);
};

export default generateLeadsExcel;

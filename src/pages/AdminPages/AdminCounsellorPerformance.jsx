import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    BarChart3,
    Users,
    UserCheck,
    Filter,
    RefreshCw,
    FileSpreadsheet,
    Printer,
    Sparkles,
    RotateCcw,
    ChevronRight,
    ArrowUpRight,
    Phone,
    Mail,
    Clock,
    X,
    BookOpen,
    Eye,
    Percent,
    PieChart as PieChartIcon,
    Target,
} from "lucide-react";
import {
    counsellorPerformanceUrl,
    counsellorUrl,
    courseUrl,
} from "../../config/config";

// Color palettes for visual charts and cards
const STATUS_COLORS = {
    ongoing: { bg: "bg-blue-500", text: "text-blue-700", hex: "#3b82f6", label: "Ongoing" },
    interested: { bg: "bg-emerald-500", text: "text-emerald-700", hex: "#10b981", label: "Interested" },
    closed: { bg: "bg-purple-500", text: "text-purple-700", hex: "#a855f7", label: "Closed" },
    notInterested: { bg: "bg-slate-400", text: "text-slate-600", hex: "#94a3b8", label: "Not Interested" },
    notUseful: { bg: "bg-amber-500", text: "text-amber-700", hex: "#f59e0b", label: "Not Useful" },
    notResponding: { bg: "bg-orange-500", text: "text-orange-700", hex: "#f97316", label: "Not Responding" },
    disconnectCall: { bg: "bg-rose-500", text: "text-rose-700", hex: "#f43f5e", label: "Disconnect Call" },
};

const CHART_PALETTE = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#8b5cf6", // Violet
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#64748b", // Slate
];

// Interactive SVG Donut / Pie Chart Component
function SvgDonutChart({ data = [], size = 200, innerRadius = 60, title = "Total" }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const total = useMemo(() => {
        return data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    }, [data]);

    // Calculate arc paths
    const slices = useMemo(() => {
        if (total === 0) return [];
        let currentAngle = -Math.PI / 2; // start from top (12 o'clock)
        const radius = size / 2 - 10;
        const cx = size / 2;
        const cy = size / 2;

        return data.map((item, idx) => {
            const val = Number(item.value) || 0;
            const sliceAngle = (val / total) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;

            // Coordinates for outer and inner arcs
            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);

            const x3 = cx + innerRadius * Math.cos(endAngle);
            const y3 = cy + innerRadius * Math.sin(endAngle);
            const x4 = cx + innerRadius * Math.cos(startAngle);
            const y4 = cy + innerRadius * Math.sin(startAngle);

            const largeArc = sliceAngle > Math.PI ? 1 : 0;

            const pathData =
                sliceAngle >= 2 * Math.PI - 0.001
                    ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} L ${cx - 0.001} ${cy - innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy - innerRadius} Z`
                    : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

            const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";

            return {
                ...item,
                pathData,
                percentage,
                idx,
            };
        });
    }, [data, total, size, innerRadius]);

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <PieChartIcon className="h-8 w-8" />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">No chart data available</p>
            </div>
        );
    }

    const hoveredItem = hoveredIndex !== null ? slices[hoveredIndex] : null;

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            {/* SVG Donut */}
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {slices.map((slice, idx) => (
                        <path
                            key={idx}
                            d={slice.pathData}
                            fill={slice.color || CHART_PALETTE[idx % CHART_PALETTE.length]}
                            className="cursor-pointer transition-all duration-200 hover:opacity-90"
                            style={{
                                transformOrigin: `${size / 2}px ${size / 2}px`,
                                transform: hoveredIndex === idx ? "scale(1.04)" : "scale(1)",
                            }}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    ))}
                </svg>

                {/* Center metric indicator */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-900">
                        {hoveredItem ? hoveredItem.value : total}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 max-w-[80px] truncate">
                        {hoveredItem ? hoveredItem.label : title}
                    </span>
                    {hoveredItem && (
                        <span className="text-[10px] font-semibold text-blue-600">
                            {hoveredItem.percentage}%
                        </span>
                    )}
                </div>
            </div>

            {/* Interactive Legend */}
            <div className="flex flex-col gap-2 max-w-xs text-xs">
                {slices.map((slice, idx) => (
                    <div
                        key={idx}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 transition cursor-pointer ${
                            hoveredIndex === idx ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                        }`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: slice.color || CHART_PALETTE[idx % CHART_PALETTE.length] }}
                            />
                            <span className="truncate capitalize text-slate-700">{slice.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                            <span className="font-bold text-slate-900">{slice.value}</span>
                            <span className="text-slate-400">({slice.percentage}%)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AdminCounsellorPerformance() {
    // Active View Mode: 'performance' (Overview) | 'report' (Analytics, Charts & Export)
    const [activeTab, setActiveTab] = useState("performance");

    // Loading states
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Dropdown reference lists
    const [counsellorsList, setCounsellorsList] = useState([]);
    const [coursesList, setCoursesList] = useState([]);

    // Filter states (all 4 query params)
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [counsellorId, setCounsellorId] = useState("");
    const [courseId, setCourseId] = useState("");

    // Performance Overview API Data (`counsellorPerformanceUrl.performance`)
    const [summary, setSummary] = useState(null);
    const [performanceList, setPerformanceList] = useState([]);

    // Report API Data (`counsellorPerformanceUrl.report`)
    const [reportList, setReportList] = useState([]);

    // Modal state for viewing a counsellor's assigned leads
    const [leadsDrawerCounsellor, setLeadsDrawerCounsellor] = useState(null);

    // Fetch dropdown filters (Counsellors & Courses)
    useEffect(() => {
        let isMounted = true;
        const fetchDropdowns = async () => {
            try {
                const adminToken = localStorage.getItem("adminToken");
                const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

                const [cnlRes, crsRes] = await Promise.all([
                    axios.get(counsellorUrl.counsellorAll, { headers }).catch(() => ({ data: { data: [] } })),
                    axios.get(courseUrl.courses, { headers }).catch(() => ({ data: { data: [] } })),
                ]);

                if (isMounted) {
                    const cList = Array.isArray(cnlRes.data?.data)
                        ? cnlRes.data.data
                        : Array.isArray(cnlRes.data)
                        ? cnlRes.data
                        : [];
                    const crsData = Array.isArray(crsRes.data?.data)
                        ? crsRes.data.data
                        : Array.isArray(crsRes.data)
                        ? crsRes.data
                        : [];

                    setCounsellorsList(cList);
                    setCoursesList(crsData);
                }
            } catch (err) {
                console.error("Dropdown fetch error:", err);
            }
        };

        fetchDropdowns();
        return () => {
            isMounted = false;
        };
    }, []);

    // Main data fetcher for both Performance and Report APIs
    const fetchData = useCallback(
        async (isBackground = false) => {
            if (!isBackground) setLoading(true);
            else setRefreshing(true);

            try {
                const adminToken = localStorage.getItem("adminToken");
                const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

                // Construct query parameters
                const params = {};
                if (from) params.from = from;
                if (to) params.to = to;
                if (counsellorId) {
                    params.counsellorId = counsellorId;
                    params.counsellor = counsellorId;
                }
                if (courseId) {
                    params.courseId = courseId;
                    params.course = courseId;
                }

                // Call both endpoints simultaneously
                const [perfRes, reportRes] = await Promise.all([
                    axios
                        .get(counsellorPerformanceUrl.performance, { params, headers })
                        .catch((e) => {
                            console.error("Performance API error:", e);
                            return { data: null };
                        }),
                    axios
                        .get(counsellorPerformanceUrl.report, { params, headers })
                        .catch((e) => {
                            console.error("Report API error:", e);
                            return { data: null };
                        }),
                ]);

                // Parse Performance Data
                if (perfRes.data?.success) {
                    setSummary(perfRes.data.summary || null);
                    setPerformanceList(Array.isArray(perfRes.data.data) ? perfRes.data.data : []);
                } else if (Array.isArray(perfRes.data?.data)) {
                    setPerformanceList(perfRes.data.data);
                }

                // Parse Report Data
                if (reportRes.data?.success && Array.isArray(reportRes.data.data)) {
                    setReportList(reportRes.data.data);
                } else if (Array.isArray(reportRes.data?.data)) {
                    setReportList(reportRes.data.data);
                }
            } catch (err) {
                console.error("Fetch performance error:", err.response?.data || err);
                toast.error(
                    err.response?.data?.message || err.message || "Failed to load counsellor performance."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [from, to, counsellorId, courseId]
    );

    // Initial and param change trigger
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Quick Date Preset helper
    const handleDatePreset = (preset) => {
        const now = new Date();
        const formatDateStr = (d) => d.toISOString().slice(0, 10);

        if (preset === "today") {
            const todayStr = formatDateStr(now);
            setFrom(todayStr);
            setTo(todayStr);
        } else if (preset === "7days") {
            const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            setFrom(formatDateStr(past));
            setTo(formatDateStr(now));
        } else if (preset === "30days") {
            const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            setFrom(formatDateStr(past));
            setTo(formatDateStr(now));
        } else if (preset === "thisMonth") {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            setFrom(formatDateStr(firstDay));
            setTo(formatDateStr(now));
        } else if (preset === "all") {
            setFrom("");
            setTo("");
        }
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFrom("");
        setTo("");
        setCounsellorId("");
        setCourseId("");
    };

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (from) count++;
        if (to) count++;
        if (counsellorId) count++;
        if (courseId) count++;
        return count;
    }, [from, to, counsellorId, courseId]);

    // Initials helper
    const getInitials = (name) => {
        if (!name) return "CN";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Excel / CSV Export Function
    const handleExportExcel = () => {
        const sourceData = reportList.length > 0 ? reportList : performanceList;
        if (!sourceData || sourceData.length === 0) {
            toast.error("No data available to export.");
            return;
        }

        const headers = [
            "Counsellor ID",
            "Counsellor Name",
            "Total Leads / Inquiries",
            "Ongoing",
            "Interested",
            "Closed",
            "Converted to Student",
            "Pending Approval",
            "Follow-up Calls",
            "Conversion Rate (%)",
        ];

        const rows = sourceData.map((row) => {
            const total = row.totalLeads ?? row.totalCandidates ?? 0;
            const conv = row.converted ?? row.conversionMetrics?.converted ?? 0;
            const rate = total > 0 ? ((conv / total) * 100).toFixed(1) : "0.0";

            return [
                `"${row.counsellorId || row._id || ""}"`,
                `"${row.counsellorName || "Counsellor"}"`,
                total,
                row.ongoing ?? row.statusBreakdown?.ongoing ?? 0,
                row.interested ?? row.statusBreakdown?.interested ?? 0,
                row.closed ?? row.statusBreakdown?.closed ?? 0,
                conv,
                row.pendingApproval ?? row.conversionMetrics?.pendingConversion ?? 0,
                row.followUps ?? row.totalFollowUps ?? 0,
                `"${rate}%"`,
            ];
        });

        // Add summary row
        if (summary) {
            rows.push([
                `"TOTAL"`,
                `"ACADEMY SUMMARY"`,
                summary.totalCandidates,
                "-",
                "-",
                summary.closedCount,
                summary.convertedCount,
                summary.pendingConversionCount,
                summary.totalFollowUps,
                `"${summary.overallConversionRate}%"`,
            ]);
        }

        const csvContent =
            "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `Counsellor_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Excel/CSV report exported successfully!");
    };

    // PDF / Print Export Function
    const handleExportPDF = () => {
        window.print();
    };

    // Computed Aggregated Status Breakdown for Pie Chart
    const aggregatedStatusData = useMemo(() => {
        const counts = {
            ongoing: 0,
            closed: 0,
            interested: 0,
            notInterested: 0,
            notResponding: 0,
            disconnectCall: 0,
        };

        performanceList.forEach((c) => {
            if (c.statusBreakdown) {
                counts.ongoing += c.statusBreakdown.ongoing || 0;
                counts.closed += c.statusBreakdown.closed || 0;
                counts.interested += c.statusBreakdown.interested || 0;
                counts.notInterested += c.statusBreakdown.notInterested || 0;
                counts.notResponding += c.statusBreakdown.notResponding || 0;
                counts.disconnectCall += c.statusBreakdown.disconnectCall || 0;
            }
        });

        return [
            { label: "Closed", value: counts.closed, color: STATUS_COLORS.closed.hex },
            { label: "Ongoing", value: counts.ongoing, color: STATUS_COLORS.ongoing.hex },
            { label: "Interested", value: counts.interested, color: STATUS_COLORS.interested.hex },
            { label: "Not Interested", value: counts.notInterested, color: STATUS_COLORS.notInterested.hex },
            { label: "Not Responding", value: counts.notResponding, color: STATUS_COLORS.notResponding.hex },
            { label: "Disconnect Call", value: counts.disconnectCall, color: STATUS_COLORS.disconnectCall.hex },
        ].filter((i) => i.value > 0);
    }, [performanceList]);

    // Computed Ingestion Source Breakdown (Leads vs Walk-ins)
    const intakeSourceData = useMemo(() => {
        let leads = 0;
        let walkIns = 0;

        if (summary) {
            leads = summary.leadsCount || 0;
            walkIns = summary.walkInsCount || 0;
        } else {
            performanceList.forEach((c) => {
                leads += c.leadsCount || 0;
                walkIns += c.walkInsCount || 0;
            });
        }

        return [
            { label: "Walk-in Visitors", value: walkIns, color: "#8b5cf6" },
            { label: "Online Leads", value: leads, color: "#3b82f6" },
        ].filter((i) => i.value > 0);
    }, [summary, performanceList]);

    // Computed Counsellor Share of Total Conversions
    const counsellorConversionsData = useMemo(() => {
        return performanceList
            .map((c, i) => ({
                label: c.counsellorName || "Staff",
                value: c.conversionMetrics?.converted || 0,
                color: CHART_PALETTE[i % CHART_PALETTE.length],
            }))
            .filter((i) => i.value > 0);
    }, [performanceList]);

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 print:p-0 print:bg-white">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* ========================================================================= */}
                {/* 1. HEADER SECTION */}
                {/* ========================================================================= */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Link to="/admin/counsellors" className="hover:text-blue-600 transition">
                                Counsellors
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold uppercase tracking-wider text-blue-700">
                                <Sparkles className="h-3 w-3" />
                                Analytics &amp; Reports
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                            Counsellor Performance
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Conversion efficiency, pipeline metrics, follow-up activities, and executive reports.
                        </p>
                    </div>

                    {/* Action Buttons: Refresh, Excel & PDF */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => fetchData(true)}
                            disabled={loading || refreshing}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs transition hover:bg-emerald-100"
                        >
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                            <span>Export Excel</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportPDF}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                        >
                            <Printer className="h-4 w-4" />
                            <span>Print / PDF</span>
                        </button>
                    </div>
                </div>

                {/* Print Header (Only visible when printing / saving PDF) */}
                <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Academy Counsellor Performance &amp; Conversion Report
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Generated on {new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-600">
                            <p className="font-bold">Bengal Institute of Animation Arts</p>
                            <p>Admin Operations Directorate</p>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. TOP SUMMARY METRICS CARDS */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                    {/* Total Candidates */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Total Inquiries
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-slate-900">
                            {summary ? summary.totalCandidates : 0}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                            <span>{summary?.leadsCount || 0} Leads</span>
                            <span>•</span>
                            <span>{summary?.walkInsCount || 0} Walk-ins</span>
                        </div>
                    </div>

                    {/* Overall Conversion Rate */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                Conversion Rate
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                                <Percent className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-emerald-800">
                            {summary ? `${summary.overallConversionRate}%` : "0%"}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                            {summary?.convertedCount || 0} Enrolled Students
                        </p>
                    </div>

                    {/* Closed Candidates */}
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                                Closed Pipeline
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                                <Target className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-purple-800">
                            {summary ? summary.closedCount : 0}
                        </p>
                        <p className="mt-1 text-[10px] text-purple-700 font-medium">
                            {summary?.closedToStudentConversionRate || 0}% closed conversion
                        </p>
                    </div>

                    {/* Total Follow-ups Logged */}
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                Follow-up Calls
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-amber-800">
                            {summary ? summary.totalFollowUps : 0}
                        </p>
                        <p className="mt-1 text-[10px] text-amber-700">
                            Call discussions recorded
                        </p>
                    </div>

                    {/* Active Counsellors */}
                    <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Active Staff
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <UserCheck className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-slate-900">
                            {performanceList.length}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                            Performance records
                        </p>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. FILTER TOOLBAR (4 PARAMS FROM POSTMAN) */}
                {/* ========================================================================= */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4 print:hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Filter Performance Parameters
                            </span>
                            {activeFiltersCount > 0 && (
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                    {activeFiltersCount} Active
                                </span>
                            )}
                        </div>

                        {/* Date Preset Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-slate-400 text-[11px] mr-1">Presets:</span>
                            <button
                                type="button"
                                onClick={() => handleDatePreset("today")}
                                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDatePreset("7days")}
                                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                            >
                                Last 7 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDatePreset("thisMonth")}
                                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDatePreset("all")}
                                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                            >
                                All Time
                            </button>
                            {activeFiltersCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Inputs Grid: from, to, counsellorId, courseId */}
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {/* Param 1: from */}
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Date From (from)
                            </label>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </div>

                        {/* Param 2: to */}
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Date To (to)
                            </label>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </div>

                        {/* Param 3: counsellorId */}
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Counsellor (counsellorId)
                            </label>
                            <select
                                value={counsellorId}
                                onChange={(e) => setCounsellorId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                            >
                                <option value="">All Counsellors</option>
                                {counsellorsList.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name} (@{c.username || "counsellor"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Param 4: courseId */}
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Course (courseId)
                            </label>
                            <select
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white capitalize"
                            >
                                <option value="">All Courses</option>
                                {coursesList.map((crs) => (
                                    <option key={crs._id} value={crs._id}>
                                        {crs.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. TABS NAVIGATION: OVERVIEW vs REPORT */}
                {/* ========================================================================= */}
                <div className="flex border-b border-slate-200 print:hidden">
                    <button
                        type="button"
                        onClick={() => setActiveTab("performance")}
                        className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold cursor-pointer transition ${
                            activeTab === "performance"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        <span>Counsellor Overview ({performanceList.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("report")}
                        className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold cursor-pointer transition ${
                            activeTab === "report"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <PieChartIcon className="h-4 w-4" />
                        <span>Executive Reports &amp; Charts ({reportList.length})</span>
                    </button>
                </div>

                {/* ========================================================================= */}
                {/* 5. TAB 1: PERFORMANCE CARDS OVERVIEW */}
                {/* ========================================================================= */}
                {activeTab === "performance" && (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                                <p className="mt-3 text-xs font-semibold text-slate-600">
                                    Fetching counsellor performance data...
                                </p>
                            </div>
                        ) : performanceList.length === 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <BarChart3 className="h-7 w-7" />
                                </div>
                                <h3 className="mt-3 text-base font-bold text-slate-900">
                                    No Performance Records Found
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                                    Try clearing or adjusting the date range, counsellor, or course filters.
                                </p>
                                {activeFiltersCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Clear Active Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2">
                                {performanceList.map((counsellor) => {
                                    const convRate = counsellor.conversionMetrics?.conversionRate || 0;
                                    const total = counsellor.totalCandidates || 0;
                                    const leads = counsellor.leadsCount || 0;
                                    const walkIns = counsellor.walkInsCount || 0;
                                    const followUps = counsellor.totalFollowUps || 0;

                                    return (
                                        <div
                                            key={counsellor.counsellorId}
                                            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs transition hover:shadow-xs space-y-5"
                                        >
                                            {/* Top Row: Counsellor Info & Conversion Pill */}
                                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-base font-bold text-white shadow-md shadow-blue-500/20">
                                                        {getInitials(counsellor.counsellorName)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-slate-900">
                                                            {counsellor.counsellorName}
                                                        </h3>
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                            {counsellor.counsellorPhone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="h-3 w-3 text-slate-400" />
                                                                    {counsellor.counsellorPhone}
                                                                </span>
                                                            )}
                                                            {counsellor.counsellorEmail && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-3 w-3 text-slate-400" />
                                                                    {counsellor.counsellorEmail}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                                                        <Percent className="h-3 w-3 text-emerald-600" />
                                                        {convRate}% Conv.
                                                    </span>
                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                        {counsellor.conversionMetrics?.converted || 0} Converted
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Key Metrics Row */}
                                            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Total Handled
                                                    </span>
                                                    <p className="mt-1 text-base font-black text-slate-900">
                                                        {total}
                                                    </p>
                                                    <span className="text-[10px] text-slate-500">
                                                        {leads} Leads • {walkIns} Walk
                                                    </span>
                                                </div>

                                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Follow-up Calls
                                                    </span>
                                                    <p className="mt-1 text-base font-black text-blue-600">
                                                        {followUps}
                                                    </p>
                                                    <span className="text-[10px] text-slate-500">
                                                        Interactions
                                                    </span>
                                                </div>

                                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Closed Leads
                                                    </span>
                                                    <p className="mt-1 text-base font-black text-purple-600">
                                                        {counsellor.statusBreakdown?.closed || 0}
                                                    </p>
                                                    <span className="text-[10px] text-slate-500">
                                                        Conversions: {counsellor.conversionMetrics?.closedToStudentConversionRate || 0}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Breakdown Pills */}
                                            {counsellor.statusBreakdown && (
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                        Status Breakdown
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5 text-xs">
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700 font-semibold text-[11px]">
                                                            Ongoing: <strong>{counsellor.statusBreakdown.ongoing || 0}</strong>
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-purple-700 font-semibold text-[11px]">
                                                            Closed: <strong>{counsellor.statusBreakdown.closed || 0}</strong>
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 font-semibold text-[11px]">
                                                            Interested: <strong>{counsellor.statusBreakdown.interested || 0}</strong>
                                                        </span>
                                                        {counsellor.statusBreakdown.notResponding > 0 && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-orange-700 font-semibold text-[11px]">
                                                                Not Responding: {counsellor.statusBreakdown.notResponding}
                                                            </span>
                                                        )}
                                                        {counsellor.statusBreakdown.disconnectCall > 0 && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700 font-semibold text-[11px]">
                                                                Disconnect: {counsellor.statusBreakdown.disconnectCall}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Courses Covered */}
                                            {Array.isArray(counsellor.courses) && counsellor.courses.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                        Courses Handled
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {counsellor.courses.map((crs, idx) => (
                                                            <span
                                                                key={crs.courseId || idx}
                                                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 capitalize"
                                                            >
                                                                <BookOpen className="h-2.5 w-2.5 text-slate-500" />
                                                                {crs.courseName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer Action: View Assigned Leads */}
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                <span className="text-[11px] text-slate-400">
                                                    {Array.isArray(counsellor.leads) ? counsellor.leads.length : 0} assigned leads records
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => setLeadsDrawerCounsellor(counsellor)}
                                                    className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    <span>View Assigned Leads</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 6. TAB 2: EXECUTIVE REPORT & PIE CHARTS */}
                {/* ========================================================================= */}
                {activeTab === "report" && (
                    <div className="space-y-6">
                        {/* Visual Analytics Row: 3 Interactive Charts */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Chart 1: Status Distribution */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
                                <div className="border-b border-slate-100 pb-3 mb-4">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Pipeline Status Breakdown
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Distribution of all candidate stages
                                    </p>
                                </div>
                                <SvgDonutChart
                                    data={aggregatedStatusData}
                                    title="Leads"
                                    size={180}
                                    innerRadius={50}
                                />
                            </div>

                            {/* Chart 2: Intake Source Ratio */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
                                <div className="border-b border-slate-100 pb-3 mb-4">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Ingestion Channel Mix
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Walk-in visits vs online inquiries
                                    </p>
                                </div>
                                <SvgDonutChart
                                    data={intakeSourceData}
                                    title="Total"
                                    size={180}
                                    innerRadius={50}
                                />
                            </div>

                            {/* Chart 3: Conversion Share */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs md:col-span-2 lg:col-span-1">
                                <div className="border-b border-slate-100 pb-3 mb-4">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Counsellor Conversion Share
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Conversions delivered by staff
                                    </p>
                                </div>
                                <SvgDonutChart
                                    data={counsellorConversionsData}
                                    title="Converted"
                                    size={180}
                                    innerRadius={50}
                                />
                            </div>
                        </div>

                        {/* Executive Performance Matrix Table (from `counsellorPerformanceUrl.report`) */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-slate-50/70 p-5 gap-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Consolidated Performance Matrix
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Official performance report data retrieved from /api/reports/counsellor-performance
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 print:hidden">
                                    <button
                                        type="button"
                                        onClick={handleExportExcel}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Download CSV / Excel</span>
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            <th className="px-5 py-3.5">Counsellor</th>
                                            <th className="px-5 py-3.5 text-center">Total Inquiries</th>
                                            <th className="px-5 py-3.5 text-center">Ongoing</th>
                                            <th className="px-5 py-3.5 text-center">Interested</th>
                                            <th className="px-5 py-3.5 text-center">Closed</th>
                                            <th className="px-5 py-3.5 text-center">Converted</th>
                                            <th className="px-5 py-3.5 text-center">Pending Appr.</th>
                                            <th className="px-5 py-3.5 text-center">Follow-ups</th>
                                            <th className="px-5 py-3.5 text-right">Conversion Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(reportList.length > 0 ? reportList : performanceList).map((item, idx) => {
                                            const total = item.totalLeads ?? item.totalCandidates ?? 0;
                                            const ongoing = item.ongoing ?? item.statusBreakdown?.ongoing ?? 0;
                                            const interested = item.interested ?? item.statusBreakdown?.interested ?? 0;
                                            const closed = item.closed ?? item.statusBreakdown?.closed ?? 0;
                                            const converted = item.converted ?? item.conversionMetrics?.converted ?? 0;
                                            const pending = item.pendingApproval ?? item.conversionMetrics?.pendingConversion ?? 0;
                                            const followUps = item.followUps ?? item.totalFollowUps ?? 0;
                                            const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0.0";

                                            return (
                                                <tr key={item._id || item.counsellorId || idx} className="hover:bg-slate-50/60 transition">
                                                    <td className="px-5 py-4 font-bold text-slate-900">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                                                                {getInitials(item.counsellorName)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{item.counsellorName || "Counsellor"}</p>
                                                                <p className="text-[10px] text-slate-400 font-mono">
                                                                    ID: {item.counsellorId || item._id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center font-bold text-slate-800">
                                                        {total}
                                                    </td>
                                                    <td className="px-5 py-4 text-center text-blue-600 font-semibold">
                                                        {ongoing}
                                                    </td>
                                                    <td className="px-5 py-4 text-center text-emerald-600 font-semibold">
                                                        {interested}
                                                    </td>
                                                    <td className="px-5 py-4 text-center text-purple-600 font-semibold">
                                                        {closed}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="inline-block rounded-md bg-emerald-100/70 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                                            {converted}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center text-slate-500 font-semibold">
                                                        {pending}
                                                    </td>
                                                    <td className="px-5 py-4 text-center text-amber-700 font-semibold">
                                                        {followUps}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <span className="inline-flex items-center gap-1 font-black text-emerald-700 text-sm">
                                                            {rate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 7. MODAL / DRAWER: VIEW COUNSELLOR'S ASSIGNED LEADS */}
                {/* ========================================================================= */}
                {leadsDrawerCounsellor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                        <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7 space-y-4">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setLeadsDrawerCounsellor(null)}
                                className="absolute top-5 right-5 cursor-pointer rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Header */}
                            <div className="border-b border-slate-100 pb-3.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                    Assigned Inquiries &amp; Leads
                                </span>
                                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                                    {leadsDrawerCounsellor.counsellorName}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {leadsDrawerCounsellor.leads?.length || 0} candidate prospects currently allocated
                                </p>
                            </div>

                            {/* Leads List */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {!Array.isArray(leadsDrawerCounsellor.leads) || leadsDrawerCounsellor.leads.length === 0 ? (
                                    <p className="text-center py-8 text-xs text-slate-400">
                                        No leads currently associated with this counsellor record.
                                    </p>
                                ) : (
                                    leadsDrawerCounsellor.leads.map((lead) => {
                                        return (
                                            <div
                                                key={lead._id}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-white"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 text-xs">
                                                            {lead.name}
                                                        </h4>
                                                        <span className="rounded-md bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-bold uppercase text-slate-700">
                                                            {lead.candidateType || "lead"}
                                                        </span>
                                                        <span className="rounded-md bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 capitalize">
                                                            {lead.candidateStatus || "ongoing"}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3 text-slate-400" />
                                                            {lead.phone}
                                                        </span>
                                                        {lead.email && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3 text-slate-400" />
                                                                {lead.email}
                                                            </span>
                                                        )}
                                                        {lead.source?.name && (
                                                            <span className="text-slate-400">
                                                                Source: {lead.source.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Link
                                                        to={`/admin/leads/${lead._id}`}
                                                        className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition"
                                                    >
                                                        <span>View Details</span>
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 pt-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setLeadsDrawerCounsellor(null)}
                                    className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminCounsellorPerformance;
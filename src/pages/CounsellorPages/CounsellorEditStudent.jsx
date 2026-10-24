import { useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    User, Mail, Phone, MapPin, Calendar, BookOpen, UserCheck, IndianRupee, CreditCard, FileText, UploadCloud, Plus,
    Trash2, CheckCircle2, Copy, Check, Eye, EyeOff,
    ArrowRight,
    RefreshCw, Sparkles, FileCheck2, Layers, AlertCircle, Save, ExternalLink, ArrowLeft,
    CheckSquare, Square, Key, Shield, Lock,
} from "lucide-react";
import { studentUrl, courseUrl, counsellorUrl, adminUrl } from "../../config/config";

const PAYMENT_STATUS_OPTIONS = [
    { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "partial", label: "Partial", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "paid", label: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "overdue", label: "Overdue", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const GENDER_OPTIONS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
];

const PRESET_DOCUMENTS = [
    "Aadhar card",
    "Voter Card",
    "PAN card",
    "10th Marksheet",
    "12th Marksheet",
    "Graduation Certificate",
    "Passport Size Photo",
];

const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDateForInput = (val) => {
    if (!val) return getTodayDate();
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return getTodayDate();
        return d.toISOString().slice(0, 10);
    } catch {
        return String(val).slice(0, 10);
    }
};

const INITIAL_STUDENT_FORM = {
    s_id: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    alternativePhone: "",
    address: "",
    age: "",
    gender: "female",
    dateOfAdmission: getTodayDate(),
    enrolledCourses: [],
    assignedCounsellor: "",
    totalFees: "",
    paymentStatus: "pending",
    isActive: true,
};

// Helper to convert raw student object into form state
const parseStudentToFormData = (student) => {
    if (!student) return INITIAL_STUDENT_FORM;

    // Extract enrolled course IDs
    let courseIds = [];
    if (Array.isArray(student.enrolledCourses) && student.enrolledCourses.length > 0) {
        courseIds = student.enrolledCourses.map((c) =>
            typeof c === "object" && c?._id ? c._id : c
        );
    } else if (student.enrolledCourse) {
        const cId = typeof student.enrolledCourse === "object" && student.enrolledCourse?._id
            ? student.enrolledCourse._id
            : student.enrolledCourse;
        if (cId) courseIds = [cId];
    }

    // Extract counsellor ID
    let counsellorId = "";
    if (student.assignedCounsellor) {
        if (typeof student.assignedCounsellor === "object" && student.assignedCounsellor?._id) {
            counsellorId = student.assignedCounsellor._id;
        } else if (typeof student.assignedCounsellor === "string") {
            counsellorId = student.assignedCounsellor;
        }
    }

    return {
        s_id: student.s_id || "",
        password: "", // Left blank by default so it's only updated when entered
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        alternativePhone: student.alternativePhone || "",
        address: student.address || "",
        age: student.age !== undefined && student.age !== null ? String(student.age) : "",
        gender: student.gender ? student.gender.toLowerCase() : "female",
        dateOfAdmission: formatDateForInput(student.dateOfAdmission || student.createdAt),
        enrolledCourses: courseIds,
        assignedCounsellor: counsellorId || "",
        totalFees: student.totalFees !== undefined && student.totalFees !== null ? String(student.totalFees) : "",
        paymentStatus: student.paymentStatus || "pending",
        isActive: student.isActive !== undefined ? Boolean(student.isActive) : true,
    };
};

function CounsellorEditStudent() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Multi-step form state: 1 = Details, 2 = Documents, 3 = Completed
    const [currentStep, setCurrentStep] = useState(1);

    // Form states prefilled if passed from router location state
    const [formData, setFormData] = useState(() => {
        if (location.state?.student) {
            return parseStudentToFormData(location.state.student);
        }
        return INITIAL_STUDENT_FORM;
    });

    const [initialData, setInitialData] = useState(() => {
        if (location.state?.student) {
            return parseStudentToFormData(location.state.student);
        }
        return INITIAL_STUDENT_FORM;
    });

    const [studentDetails, setStudentDetails] = useState(location.state?.student || null);
    const [loadingStudent, setLoadingStudent] = useState(!location.state?.student);
    const [studentLoadError, setStudentLoadError] = useState(null);

    const [courses, setCourses] = useState([]);
    const [counsellors, setCounsellors] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);
    const [submittingStep1, setSubmittingStep1] = useState(false);

    // Password visibility toggle in form
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Existing documents
    const [existingDocuments, setExistingDocuments] = useState(() => {
        if (location.state?.student?.documents && Array.isArray(location.state.student.documents)) {
            return location.state.student.documents;
        }
        return [];
    });

    // Step 1 Success & Updated Student details
    const [updatedStudentData, setUpdatedStudentData] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);

    // Step 2 Document states
    const [documentItems, setDocumentItems] = useState([
        { id: 1, name: "Aadhar card", file: null },
        { id: 2, name: "Voter Card", file: null },
    ]);
    const [submittingDocuments, setSubmittingDocuments] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);

    const authToken = localStorage.getItem("token");

    // Fetch student details, courses and counsellors on mount
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                // 1. Fetch courses
                const coursesPromise = axios
                    .get(courseUrl.courses, { headers })
                    .then((res) => {
                        if (res.data?.success && Array.isArray(res.data.data)) {
                            return res.data.data;
                        }
                        return [];
                    })
                    .catch((err) => {
                        console.error("Courses fetch error:", err);
                        return [];
                    });

                // 2. Fetch counsellors
                const counsellorsPromise = axios
                    .get(`${counsellorUrl.counsellorAll}`, { headers })
                    .then((res) => {
                        if (res.data?.success && Array.isArray(res.data.data)) {
                            return res.data.data;
                        }
                        return [];
                    })
                    .catch((err) => {
                        console.error("Counsellors fetch error:", err);
                        return [];
                    });

                // 3. Fetch Student details by :id
                const studentPromise = (async () => {
                    if (!id) return null;
                    try {
                        const targetUrl = `${studentUrl.students}/${id}`;
                        const res = await axios.get(targetUrl, { headers });
                        const sData = res.data?.data?.student || res.data?.data || res.data?.student || res.data;
                        if (sData && (sData._id || sData.name || sData.s_id)) {
                            return sData;
                        }
                    } catch (err) {
                        console.warn("Direct fetch GET /api/students/:id failed, attempting list query:", err);
                        // Fallback: search in students list
                        try {
                            const listRes = await axios.get(studentUrl.students, { headers });
                            const list = Array.isArray(listRes.data)
                                ? listRes.data
                                : Array.isArray(listRes.data?.data)
                                    ? listRes.data.data
                                    : Array.isArray(listRes.data?.students)
                                        ? listRes.data.students
                                        : Array.isArray(listRes.data?.data?.students)
                                            ? listRes.data.data.students
                                            : [];
                            const matched = list.find((s) => s._id === id || s.s_id === id);
                            if (matched) return matched;
                        } catch (fallbackErr) {
                            console.error("Fallback students search failed:", fallbackErr);
                        }
                        throw err;
                    }
                    return null;
                })();

                const [coursesResult, counsellorsResult, studentResult] = await Promise.allSettled([
                    coursesPromise,
                    counsellorsPromise,
                    studentPromise,
                ]);

                if (!isMounted) return;

                if (coursesResult.status === "fulfilled") {
                    setCourses(coursesResult.value);
                }
                if (counsellorsResult.status === "fulfilled") {
                    setCounsellors(counsellorsResult.value);
                }

                if (studentResult.status === "fulfilled" && studentResult.value) {
                    const s = studentResult.value;
                    setStudentDetails(s);
                    const parsed = parseStudentToFormData(s);
                    setFormData(parsed);
                    setInitialData(parsed);
                    if (Array.isArray(s.documents)) {
                        setExistingDocuments(s.documents);
                    }
                } else if (!location.state?.student) {
                    if (studentResult.status === "rejected") {
                        setStudentLoadError(
                            studentResult.reason?.response?.data?.message ||
                            "Unable to load student record from the server."
                        );
                    } else {
                        setStudentLoadError("Student record not found.");
                    }
                }
            } catch (error) {
                console.error("Error loading student edit data:", error);
                if (isMounted && !location.state?.student) {
                    toast.error("Failed to load student details.");
                    setStudentLoadError("Failed to load student details.");
                }
            } finally {
                if (isMounted) {
                    setLoadingDropdowns(false);
                    setLoadingStudent(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [id, authToken, location.state?.student]);

    // Handle student form input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Toggle course in enrolledCourses array and auto-sum totalFees
    const toggleCourse = (courseId) => {
        setFormData((prev) => {
            const exists = prev.enrolledCourses.includes(courseId);
            const updatedCourses = exists
                ? prev.enrolledCourses.filter((id) => id !== courseId)
                : [...prev.enrolledCourses, courseId];

            // Auto-sum course totalFees
            const calculatedFees = updatedCourses.reduce((sum, cId) => {
                const found = courses.find((c) => c._id === cId);
                return sum + (Number(found?.totalFees) || 0);
            }, 0);

            return {
                ...prev,
                enrolledCourses: updatedCourses,
                totalFees: calculatedFees > 0 ? String(calculatedFees) : prev.totalFees,
            };
        });
    };

    // Select all or deselect all courses
    const handleSelectAllCourses = () => {
        if (formData.enrolledCourses.length === courses.length) {
            setFormData((prev) => ({
                ...prev,
                enrolledCourses: [],
                totalFees: "",
            }));
        } else {
            const allCourseIds = courses.map((c) => c._id);
            const calculatedFees = courses.reduce(
                (sum, c) => sum + (Number(c.totalFees) || 0),
                0
            );
            setFormData((prev) => ({
                ...prev,
                enrolledCourses: allCourseIds,
                totalFees: calculatedFees > 0 ? String(calculatedFees) : prev.totalFees,
            }));
        }
    };

    // Step 1: Submit Student Details to /api/students/:id
    const handleStep1Submit = async (e, proceedToStep2 = true) => {
        if (e && e.preventDefault) e.preventDefault();

        // Validations
        if (!formData.name.trim()) {
            toast.error("Please enter the student's full name.");
            return;
        }
        if (!formData.phone.trim()) {
            toast.error("Please enter the primary phone number.");
            return;
        }
        if (!formData.age || Number(formData.age) <= 0) {
            toast.error("Please enter a valid age.");
            return;
        }
        if (!formData.address.trim()) {
            toast.error("Please enter the student's address.");
            return;
        }
        if (!formData.dateOfAdmission) {
            toast.error("Please enter the date of admission.");
            return;
        }
        if (!formData.enrolledCourses || formData.enrolledCourses.length === 0) {
            toast.error("Please select at least one enrolled course.");
            return;
        }
        if (!formData.assignedCounsellor) {
            toast.error("Please select an assigned counsellor.");
            return;
        }
        if (formData.totalFees === "" || Number(formData.totalFees) < 0) {
            toast.error("Please enter the total fees.");
            return;
        }

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            alternativePhone: formData.alternativePhone.trim(),
            address: formData.address.trim(),
            age: Number(formData.age),
            gender: formData.gender, // "male" or "female"
            dateOfAdmission: formData.dateOfAdmission || getTodayDate(),
            enrolledCourses: formData.enrolledCourses,
            enrolledCourse: formData.enrolledCourses[0] || undefined,
            assignedCounsellor: formData.assignedCounsellor,
            totalFees: Number(formData.totalFees),
            paymentStatus: formData.paymentStatus,
            isActive: Boolean(formData.isActive),
        };

        // Include editable s_id if provided
        if (formData.s_id && formData.s_id.trim()) {
            payload.s_id = formData.s_id.trim();
        }

        // Include editable password if entered
        if (formData.password && formData.password.trim()) {
            payload.password = formData.password.trim();
        }

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Session expired or token missing. Please re-login.");
            return;
        }

        const targetUrl = `${studentUrl.students}/${id}`;

        try {
            setSubmittingStep1(true);

            const headers = { Authorization: `Bearer ${token}` };

            // Send PUT request to /api/students/:id; fallback to PATCH if method not allowed
            let response;
            try {
                response = await axios.put(targetUrl, payload, { headers });
            } catch (putErr) {
                if (putErr.response?.status === 405 || putErr.response?.status === 404) {
                    response = await axios.patch(targetUrl, payload, { headers });
                } else {
                    throw putErr;
                }
            }

            if (response.data?.success === false) {
                toast.error(response.data?.message || "Failed to update student.");
                return;
            }

            const responseData = response.data?.data || response.data?.student || response.data || {};
            setUpdatedStudentData(responseData);
            toast.success(response.data?.message || "Student details updated successfully!");

            if (proceedToStep2) {
                setCurrentStep(2);
            } else {
                setCurrentStep(3);
            }
        } catch (error) {
            console.error("Update student error:", error.response?.data || error);
            if (error.response?.status === 401) {
                toast.error(
                    error.response?.data?.message ||
                    "Session expired. Please re-login."
                );
            } else {
                toast.error(
                    error.response?.data?.message ||
                    error.message ||
                    "Unable to update student."
                );
            }
        } finally {
            setSubmittingStep1(false);
        }
    };

    // Step 2 Document Handlers
    const handleAddDocumentRow = (presetName = "") => {
        setDocumentItems((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), name: presetName, file: null },
        ]);
    };

    const handleRemoveDocumentRow = (rowId) => {
        if (documentItems.length <= 1) {
            toast.error("At least one document slot must be kept.");
            return;
        }
        setDocumentItems((prev) => prev.filter((item) => item.id !== rowId));
    };

    const handleDocumentNameChange = (rowId, newName) => {
        setDocumentItems((prev) =>
            prev.map((item) => (item.id === rowId ? { ...item, name: newName } : item))
        );
    };

    const handleDocumentFileChange = (rowId, file) => {
        setDocumentItems((prev) =>
            prev.map((item) => (item.id === rowId ? { ...item, file } : item))
        );
    };

    // Step 2: Upload Documents to /api/students/:id/documents
    const handleStep2Submit = async (e) => {
        e.preventDefault();

        const studentId = id;

        if (!studentId) {
            toast.error("Student ID is missing. Please start from Step 1.");
            setCurrentStep(1);
            return;
        }

        // Filter documents that have a file selected
        const validDocs = documentItems.filter(
            (item) => item.file && item.name.trim()
        );

        if (validDocs.length === 0) {
            toast.error("Please select at least one file with a document name.");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            setSubmittingDocuments(true);
            const uploadData = new FormData();
            validDocs.forEach((doc) => {
                uploadData.append("documentNames", doc.name.trim());
                uploadData.append("documents", doc.file);
            });

            const response = await axios.post(
                `${studentUrl.students}/${studentId}/documents`,
                uploadData,
                {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data?.success === false) {
                toast.error(response.data?.message || "Failed to upload documents.");
                return;
            }

            setUploadedCount(validDocs.length);
            toast.success(
                response.data?.message || "Documents uploaded successfully!"
            );
            setCurrentStep(3);
        } catch (error) {
            console.error("Document upload error:", error.response?.data || error);
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Unable to upload documents."
            );
        } finally {
            setSubmittingDocuments(false);
        }
    };

    // Skip document upload and proceed to confirmation
    const handleSkipDocuments = () => {
        setUploadedCount(0);
        setCurrentStep(3);
    };

    // Reset form to original values
    const handleResetToInitial = () => {
        setFormData(initialData);
        toast.success("Form reset to loaded values.");
    };

    // Copy to clipboard helper
    const copyToClipboard = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success(`Copied ${key} to clipboard!`);
        setTimeout(() => setCopiedKey(null), 2500);
    };

    // Helper to format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    // Loading student state
    if (loadingStudent) {
        return (
            <section className="min-h-screen bg-slate-50 px-4 py-16 sm:px-8">
                <div className="mx-auto max-w-xl text-center py-20 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <RefreshCw className="mx-auto h-10 w-10 animate-spin text-blue-600" />
                    <h2 className="mt-4 text-lg font-bold text-slate-800">
                        Loading Student Profile...
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Fetching student record and assignment details for ID: {id}
                    </p>
                </div>
            </section>
        );
    }

    // Error state if student could not be found
    if (studentLoadError) {
        return (
            <section className="min-h-screen bg-slate-50 px-4 py-16 sm:px-8">
                <div className="mx-auto max-w-lg text-center rounded-3xl border border-rose-200 bg-white p-8 shadow-sm space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <AlertCircle className="h-7 w-7" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                        Student Not Found
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {studentLoadError}
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3">
                        <Link
                            to="/counsellor/students"
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Students List
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Page Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                Counsellor Workspace
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">
                                Student Management
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Edit Student Profile
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Update student information, course enrollment, counsellor assignment, student ID, and credentials.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/counsellor/students"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            <FileCheck2 className="h-4 w-4 text-slate-500" />
                            View All Students
                        </Link>
                    </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between">
                        {/* Step 1 Indicator */}
                        <div
                            onClick={() => setCurrentStep(1)}
                            className="flex flex-1 items-center cursor-pointer group"
                        >
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm transition-all ${currentStep > 1
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                    : currentStep === 1
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-4 ring-blue-100"
                                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                    }`}
                            >
                                {currentStep > 1 ? (
                                    <Check className="h-5 w-5 stroke-[2.5]" />
                                ) : (
                                    "1"
                                )}
                            </div>
                            <div className="ml-3 hidden sm:block">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Step 1
                                </p>
                                <p
                                    className={`text-sm font-bold ${currentStep === 1 ? "text-blue-600" : "text-slate-800"
                                        }`}
                                >
                                    Edit Details
                                </p>
                            </div>
                            <div
                                className={`mx-4 h-1 flex-1 rounded-full transition-colors ${currentStep > 1 ? "bg-emerald-500" : "bg-slate-100"
                                    }`}
                            />
                        </div>

                        {/* Step 2 Indicator */}
                        <div
                            onClick={() => setCurrentStep(2)}
                            className="flex flex-1 items-center cursor-pointer group"
                        >
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm transition-all ${currentStep > 2
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                    : currentStep === 2
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-4 ring-blue-100"
                                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                    }`}
                            >
                                {currentStep > 2 ? (
                                    <Check className="h-5 w-5 stroke-[2.5]" />
                                ) : (
                                    "2"
                                )}
                            </div>
                            <div className="ml-3 hidden sm:block">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Step 2
                                </p>
                                <p
                                    className={`text-sm font-bold ${currentStep === 2 ? "text-blue-600" : "text-slate-800"
                                        }`}
                                >
                                    Manage Documents
                                </p>
                            </div>
                            <div
                                className={`mx-4 h-1 flex-1 rounded-full transition-colors ${currentStep > 2 ? "bg-emerald-500" : "bg-slate-100"
                                    }`}
                            />
                        </div>

                        {/* Step 3 Indicator */}
                        <div className="flex items-center">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm transition-all ${currentStep === 3
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-100"
                                    : "bg-slate-100 text-slate-400"
                                    }`}
                            >
                                {currentStep === 3 ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    "3"
                                )}
                            </div>
                            <div className="ml-3 hidden sm:block">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Step 3
                                </p>
                                <p
                                    className={`text-sm font-bold ${currentStep === 3 ? "text-emerald-600" : "text-slate-400"
                                        }`}
                                >
                                    Completed
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Existing Student Info Banner */}
                {studentDetails?.s_id && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-3 text-xs text-blue-900">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-500">Editing Student:</span>
                            <span className="font-bold text-slate-900">{studentDetails.name}</span>
                            <span className="font-mono font-bold bg-white border border-blue-200 px-2 py-0.5 rounded-md text-blue-700">
                                {formData.s_id || studentDetails.s_id}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                            API Endpoint: <code className="font-mono text-blue-700 font-semibold">/api/students/{id}</code>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 1: STUDENT DETAILS FORM */}
                {/* ========================================================================= */}
                {currentStep === 1 && (
                    <form
                        onSubmit={(e) => handleStep1Submit(e, true)}
                        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                    >
                        {/* Section 0: Account Credentials & System Identification (Editable s_id & password) */}
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg font-bold">Account Credentials &amp; Identification</h2>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Update student system ID (s_id) or set a new password for account login.
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Student ID (s_id) */}
                                <div>
                                    <label
                                        htmlFor="student-s_id"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Student ID (s_id)
                                    </label>
                                    <div className="relative">
                                        <Shield className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-s_id"
                                            name="s_id"
                                            type="text"
                                            value={formData.s_id}
                                            onChange={handleChange}
                                            placeholder="e.g. BIA202600006"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm font-mono font-semibold text-blue-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Editable unique registration identifier for this student.
                                    </p>
                                </div>

                                {/* Password (password) */}
                                <div>
                                    <label
                                        htmlFor="student-password"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Account Password (password)
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-password"
                                            name="password"
                                            type={showEditPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Leave blank to keep unchanged, or enter new password"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-11 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEditPassword(!showEditPassword)}
                                            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                                            title={showEditPassword ? "Hide password" : "Show password"}
                                        >
                                            {showEditPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Only updates if you enter a new value.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Personal Information */}
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <User className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg font-bold">Personal Information</h2>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Basic biographical details of the student.
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Full Name */}
                                <div>
                                    <label
                                        htmlFor="student-name"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-name"
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Amrita Sen"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Email Address */}
                                <div>
                                    <label
                                        htmlFor="student-email"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="e.g. amritasen@gmail.com"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Primary Phone */}
                                <div>
                                    <label
                                        htmlFor="student-phone"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Primary Phone Number <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-phone"
                                            name="phone"
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="e.g. 9876543242"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Alternative Phone */}
                                <div>
                                    <label
                                        htmlFor="student-alt-phone"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Alternative Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-alt-phone"
                                            name="alternativePhone"
                                            type="tel"
                                            value={formData.alternativePhone}
                                            onChange={handleChange}
                                            placeholder="e.g. 9123456534"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Age */}
                                <div>
                                    <label
                                        htmlFor="student-age"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Age <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-age"
                                            name="age"
                                            type="number"
                                            min="1"
                                            max="120"
                                            required
                                            value={formData.age}
                                            onChange={handleChange}
                                            placeholder="e.g. 32"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Gender <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {GENDER_OPTIONS.map((g) => (
                                            <button
                                                key={g.value}
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({ ...prev, gender: g.value }))
                                                }
                                                className={`flex items-center justify-center rounded-xl border py-3 text-sm font-semibold transition-all cursor-pointer ${formData.gender === g.value
                                                    ? "border-blue-600 bg-blue-50/60 text-blue-700 ring-2 ring-blue-500/20"
                                                    : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {g.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Selected gender sends &quot;{formData.gender}&quot; in API payload.
                                    </p>
                                </div>

                                {/* Address */}
                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="student-address"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Residential Address <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
                                        <textarea
                                            id="student-address"
                                            name="address"
                                            rows="2"
                                            required
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="e.g. Ballygunge, Kolkata, West Bengal"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Course & Counsellor Assignment */}
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg font-bold">Admission &amp; Course Assignment</h2>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Update admission date, counsellor, and one or more enrolled courses.
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Date of Admission */}
                                <div>
                                    <label
                                        htmlFor="student-date-of-admission"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Date of Admission <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-date-of-admission"
                                            name="dateOfAdmission"
                                            type="date"
                                            required
                                            value={formData.dateOfAdmission}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Assigned Counsellor */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label
                                            htmlFor="assignedCounsellor"
                                            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                                        >
                                            Assigned Counsellor <span className="text-rose-500">*</span>
                                        </label>
                                        {loadingDropdowns && (
                                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                                <RefreshCw className="h-3 w-3 animate-spin" /> Loading
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <UserCheck className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <select
                                            id="assignedCounsellor"
                                            name="assignedCounsellor"
                                            required
                                            value={formData.assignedCounsellor}
                                            onChange={handleChange}
                                            disabled={loadingDropdowns}
                                            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-10 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                                        >
                                            <option value="">-- Select Counsellor --</option>
                                            {counsellors.map((counsellor) => (
                                                <option key={counsellor._id} value={counsellor._id}>
                                                    {counsellor.name} {counsellor.phone ? `(${counsellor.phone})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                                            ▼
                                        </div>
                                    </div>
                                    {counsellors.length === 0 && !loadingDropdowns && (
                                        <p className="mt-1.5 text-xs text-amber-600">
                                            No counsellors found
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Enrolled Courses (Multiple Selection) */}
                            <div>
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                            Enrolled Courses (enrolledCourses) <span className="text-rose-500">*</span>
                                        </label>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Select one or multiple courses. Course fees automatically sum up into total fees.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                                            {formData.enrolledCourses.length} selected
                                        </span>
                                        {courses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleSelectAllCourses}
                                                className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800"
                                            >
                                                {formData.enrolledCourses.length === courses.length
                                                    ? "Deselect All"
                                                    : "Select All"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {loadingDropdowns ? (
                                    <div className="flex items-center justify-center p-8 text-sm text-slate-400">
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
                                        Loading courses catalogue...
                                    </div>
                                ) : courses.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                        No courses found. Please contact administration.
                                    </div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                        {courses.map((course) => {
                                            const isSelected = formData.enrolledCourses.includes(course._id);
                                            return (
                                                <div
                                                    key={course._id}
                                                    onClick={() => toggleCourse(course._id)}
                                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${isSelected
                                                        ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20"
                                                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/60"
                                                        }`}
                                                >
                                                    <div className="mt-0.5 shrink-0 text-blue-600">
                                                        {isSelected ? (
                                                            <CheckSquare className="h-5 w-5 fill-blue-600 text-white" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-slate-400" />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p
                                                            className={`truncate text-sm font-bold ${isSelected ? "text-blue-900" : "text-slate-900"
                                                                }`}
                                                        >
                                                            {course.name}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                            {course.totalFees && (
                                                                <span className="font-semibold text-slate-700">
                                                                    ₹{course.totalFees}
                                                                </span>
                                                            )}
                                                            {course.duration && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{course.duration}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Financials & Student Status */}
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg font-bold">Fees &amp; Payment Status</h2>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Specify fee amount, payment state, and student active status.
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-3">
                                {/* Total Fees */}
                                <div>
                                    <label
                                        htmlFor="student-fees"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Total Fees (₹) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <IndianRupee className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="student-fees"
                                            name="totalFees"
                                            type="number"
                                            min="0"
                                            required
                                            value={formData.totalFees}
                                            onChange={handleChange}
                                            placeholder="e.g. 30000"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Auto-summed from selected courses or manually editable.
                                    </p>
                                </div>

                                {/* Payment Status */}
                                <div>
                                    <label
                                        htmlFor="paymentStatus"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        Payment Status <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="paymentStatus"
                                            name="paymentStatus"
                                            value={formData.paymentStatus}
                                            onChange={handleChange}
                                            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-10 pl-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 capitalize"
                                        >
                                            {PAYMENT_STATUS_OPTIONS.map((status) => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {/* Active Status Toggle */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Account Status
                                    </label>
                                    <label className="flex h-11.5 cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition hover:bg-slate-100">
                                        <span className="text-sm font-semibold text-slate-700">
                                            Active Student
                                        </span>
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                            className="h-5 w-5 rounded-md accent-blue-600 transition"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Step 1 Actions */}
                        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleResetToInitial}
                                disabled={submittingStep1}
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                            >
                                Reset to Original
                            </button>

                            <button
                                type="button"
                                onClick={(e) => handleStep1Submit(e, false)}
                                disabled={submittingStep1}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                <span>Save &amp; Finish</span>
                            </button>

                            <button
                                type="submit"
                                disabled={submittingStep1}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submittingStep1 ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span>Updating Student...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Save &amp; Upload Documents</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* ========================================================================= */}
                {/* STEP 2: DOCUMENTS UPLOAD */}
                {/* ========================================================================= */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        {/* Existing Documents Preview Card */}
                        {existingDocuments.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <FileCheck2 className="h-5 w-5 text-emerald-600" />
                                        <h3 className="text-base font-bold text-slate-900">
                                            Existing Uploaded Documents ({existingDocuments.length})
                                        </h3>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400">
                                        Already attached to this student
                                    </span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                    {existingDocuments.map((doc, idx) => (
                                        <div
                                            key={doc._id || idx}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                                                <span className="font-semibold text-slate-800 capitalize truncate">
                                                    {doc.documentName || `Document ${idx + 1}`}
                                                </span>
                                            </div>
                                            {doc.documentUrl && (
                                                <a
                                                    href={doc.documentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 shrink-0"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Document Upload Form */}
                        <form
                            onSubmit={handleStep2Submit}
                            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                        >
                            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-900">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <h2 className="text-lg font-bold">Step 2: Upload Documents</h2>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Upload verification documents (e.g. Aadhar card, Voter card,
                                        certificates). Endpoint:{" "}
                                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-blue-700">
                                            /api/students/{id}/documents
                                        </code>
                                    </p>
                                </div>

                                {/* Quick Add Presets */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-400">
                                        Quick Add:
                                    </span>
                                    {PRESET_DOCUMENTS.slice(0, 4).map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => handleAddDocumentRow(preset)}
                                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
                                        >
                                            + {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Document Rows */}
                            <div className="space-y-4">
                                {documentItems.map((doc, index) => (
                                    <div
                                        key={doc.id}
                                        className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300 sm:p-5"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                                                <Layers className="h-3.5 w-3.5 text-blue-600" />
                                                Document #{index + 1}
                                            </span>
                                            {documentItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDocumentRow(doc.id)}
                                                    className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {/* Document Name */}
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                    Document Name (documentNames)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={doc.name}
                                                    onChange={(e) =>
                                                        handleDocumentNameChange(doc.id, e.target.value)
                                                    }
                                                    placeholder="e.g. Aadhar card, Voter Card"
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                                />
                                            </div>

                                            {/* File Input */}
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                    Select File (documents)
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-600 transition hover:border-blue-500 hover:bg-blue-50/30">
                                                        <UploadCloud className="h-4 w-4 text-blue-600 shrink-0" />
                                                        <span className="truncate">
                                                            {doc.file ? doc.file.name : "Choose File (PDF, Image)"}
                                                        </span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    handleDocumentFileChange(
                                                                        doc.id,
                                                                        e.target.files[0]
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </label>

                                                    {doc.file && (
                                                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 shrink-0">
                                                            {formatFileSize(doc.file.size)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Another Document Button */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => handleAddDocumentRow("")}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-blue-600"
                                >
                                    <Plus className="h-4 w-4 text-blue-600" />
                                    Add Another Document Slot
                                </button>
                            </div>

                            {/* Step 2 Actions */}
                            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleSkipDocuments}
                                    disabled={submittingDocuments}
                                    className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-4"
                                >
                                    Skip document upload &amp; finish
                                </button>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Back to Details
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submittingDocuments}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {submittingDocuments ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                <span>Uploading Documents...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="h-4 w-4" />
                                                <span>Upload Documents &amp; Finish</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 3: UPDATE CONFIRMATION & SUMMARY */}
                {/* ========================================================================= */}
                {currentStep === 3 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-6">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="h-10 w-10 stroke-[2.2]" />
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-slate-900">
                                Student Profile Updated Successfully!
                            </h2>
                            <p className="text-sm text-slate-500">
                                All changes including admission date, enrolled courses, and credentials have been updated.
                            </p>
                        </div>

                        {/* Student Summary Card */}
                        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-left space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Student Name
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                    {formData.name}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Student ID (s_id)
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-blue-700">
                                        {formData.s_id || studentDetails?.s_id || updatedStudentData?.s_id || id}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            copyToClipboard(
                                                formData.s_id || studentDetails?.s_id || updatedStudentData?.s_id || id,
                                                "Student ID"
                                            )
                                        }
                                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                    >
                                        {copiedKey === "Student ID" ? (
                                            <Check className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Date of Admission
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                    {formData.dateOfAdmission}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Enrolled Courses
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                    {formData.enrolledCourses.length} course(s) selected
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Phone Number
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                    {formData.phone}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Total Fees
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                    ₹{formData.totalFees}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Payment Status
                                </span>
                                <span className="capitalize text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                                    {formData.paymentStatus}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    New Documents Uploaded
                                </span>
                                <span className="text-sm font-semibold text-slate-700">
                                    {uploadedCount} file(s) uploaded
                                </span>
                            </div>
                        </div>

                        {/* Post Completion Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700"
                            >
                                Edit Details Again
                            </button>

                            <Link
                                to="/counsellor/students"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <FileCheck2 className="h-4 w-4 text-slate-500" />
                                View All Students
                            </Link>

                            <Link
                                to="/counsellor/leads"
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-transparent px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
                            >
                                Go to Leads
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default CounsellorEditStudent;
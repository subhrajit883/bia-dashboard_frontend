import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, MapPin, Calendar, BookOpen, UserCheck, IndianRupee, CreditCard, FileText, UploadCloud, Plus,
  Trash2, CheckCircle2, Copy, Check, Eye, EyeOff,
  ArrowRight,
  RefreshCw, Sparkles, FileCheck2, Layers, CheckSquare, Square,
} from "lucide-react";
import { adminApi } from "../../config/axios";
import { adminUrl, counsellorUrl } from "../../config/config";

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

const INITIAL_STUDENT_FORM = {
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

function AdminAddStudent() {
  // Multi-step form state: 1 = Details, 2 = Documents, 3 = Completed
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [formData, setFormData] = useState(INITIAL_STUDENT_FORM);
  const [courses, setCourses] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [submittingStep1, setSubmittingStep1] = useState(false);

  // Step 1 Success & Created Student details
  const [createdStudentData, setCreatedStudentData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Step 2 Document states
  const [documentItems, setDocumentItems] = useState([
    { id: 1, name: "Aadhar card", file: null },
    { id: 2, name: "Voter Card", file: null },
  ]);
  const [submittingDocuments, setSubmittingDocuments] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const authToken = localStorage.getItem("adminToken");
  // Fetch courses and counsellors on mount
  useEffect(() => {
    let isMounted = true;

    const loadDropdownData = async () => {
      try {
        // 1. Fetch courses using adminApi
        const coursesPromise = adminApi.get(adminUrl.courses).then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            return res.data.data;
          }
          return [];
        });

        // 2. Fetch counsellors with NO authorization or custom headers as required
        const counsellorsPromise = axios
          .get(`${counsellorUrl.counsellorActive}`)
          .then((res) => {
            if (res.data?.success && Array.isArray(res.data.data)) {
              return res.data.data;
            }
            return [];
          });

        const [coursesResult, counsellorsResult] = await Promise.all([
          coursesPromise,
          counsellorsPromise,
        ]);

        if (isMounted) {
          setCourses(coursesResult);
          setCounsellors(counsellorsResult);
        }
      } catch (error) {
        console.error("Error loading dropdown data:", error);
        if (isMounted) {
          toast.error(
            error.response?.data?.message ||
            error.message ||
            "Failed to load courses or counsellors."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingDropdowns(false);
        }
      }
    };

    loadDropdownData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Step 1: Submit Student Details
  const handleStep1Submit = async (e) => {
    e.preventDefault();

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

    try {
      setSubmittingStep1(true);
      const response = await adminApi.post(adminUrl.students, payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data?.success === false) {
        toast.error(response.data?.message || "Failed to create student.");
        return;
      }

      const responseData = response.data?.data || {};
      const studentId = responseData.id || responseData.student?._id;

      if (!studentId) {
        toast.error("Student ID was not returned by the server.");
        return;
      }

      setCreatedStudentData(responseData);
      toast.success(response.data?.message || "Student created successfully!");
      setCurrentStep(2);
    } catch (error) {
      console.error("Create student error:", error.response?.data || error);
      if (error.response?.status === 401) {
        toast.error(
          error.response?.data?.message ||
          "Please re-login"
        );
      } else {
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Unable to create student."
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

  const handleRemoveDocumentRow = (id) => {
    if (documentItems.length <= 1) {
      toast.error("At least one document slot must be kept.");
      return;
    }
    setDocumentItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDocumentNameChange = (id, newName) => {
    setDocumentItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handleDocumentFileChange = (id, file) => {
    setDocumentItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file } : item))
    );
  };

  // Step 2: Upload Documents
  const handleStep2Submit = async (e) => {
    e.preventDefault();

    const studentId =
      createdStudentData?.id || createdStudentData?.student?._id;

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

    const authToken =
      localStorage.getItem("authToken");

    try {
      setSubmittingDocuments(true);
      const uploadData = new FormData();
      validDocs.forEach((doc) => {
        uploadData.append("documentNames", doc.name.trim());
        uploadData.append("documents", doc.file);
      });

      const response = await adminApi.post(
        `${adminUrl.students}/${studentId}/documents`,
        uploadData,
        {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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

  // Reset all forms to add another student
  const handleAddAnotherStudent = () => {
    setFormData(INITIAL_STUDENT_FORM);
    setCreatedStudentData(null);
    setDocumentItems([
      { id: 1, name: "Aadhar card", file: null },
      { id: 2, name: "Voter Card", file: null },
    ]);
    setUploadedCount(0);
    setCurrentStep(1);
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

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">

                Admin Workspace
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                Student Enrollment
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Add New Student
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete student registration with personal, academic details and
              document verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/students"
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
            <div className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm transition-all ${currentStep > 1
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : currentStep === 1
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-4 ring-blue-100"
                    : "bg-slate-100 text-slate-400"
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
                  Student Details
                </p>
              </div>
              <div
                className={`mx-4 h-1 flex-1 rounded-full transition-colors ${currentStep > 1 ? "bg-emerald-500" : "bg-slate-100"
                  }`}
              />
            </div>

            {/* Step 2 Indicator */}
            <div className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm transition-all ${currentStep > 2
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : currentStep === 2
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-4 ring-blue-100"
                    : "bg-slate-100 text-slate-400"
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
                  Upload Documents
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

        {currentStep === 1 && (
          <form
            onSubmit={handleStep1Submit}
            className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
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
                      placeholder="e.g. 28"
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
                  <h2 className="text-lg font-bold">Admission & Course Assignment</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Select admission date, counsellor, and one or more enrolled courses.
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
                    No courses found. Please add courses first in Admin Courses.
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
                  <h2 className="text-lg font-bold">Fees & Payment Status</h2>
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
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-10 pl-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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
                onClick={() => setFormData(INITIAL_STUDENT_FORM)}
                disabled={submittingStep1}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={submittingStep1}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingStep1 ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Creating Student...</span>
                  </>
                ) : (
                  <>
                    <span>Upload Documents</span>
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
            {/* Created Student Summary Banner */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Step 1 Completed: Student Created!
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Student record for{" "}
                      <span className="font-semibold text-slate-900">
                        {createdStudentData?.student?.name || formData.name}
                      </span>{" "}
                      has been saved. Below are the generated login credentials.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Student ID badge */}
                  <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500">
                      ID:
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-700">
                      {createdStudentData?.s_id || "N/A"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          createdStudentData?.s_id,
                          "Student ID"
                        )
                      }
                      title="Copy Student ID"
                      className="text-slate-400 hover:text-blue-600"
                    >
                      {copiedKey === "Student ID" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Initial Password badge */}
                  {createdStudentData?.initialPassword && (
                    <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 shadow-xs">
                      <span className="text-xs font-semibold text-slate-500">
                        Password:
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {showPassword
                          ? createdStudentData.initialPassword
                          : "••••••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        title="Toggle password"
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            createdStudentData.initialPassword,
                            "Initial Password"
                          )
                        }
                        title="Copy Password"
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {copiedKey === "Initial Password" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                    certificates).<span className="text-red-500 font-semibold"> File limit is 200 kb</span>
                    {/* <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-blue-700">
                      /api/students/&#123;id&#125;/documents
                    </code> */}
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
        {/* STEP 3: ENROLLMENT CONFIRMATION & SUMMARY */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Student Enrolled Successfully!
              </h2>
              <p className="text-sm text-slate-500">
                Student record has been created and verified in the academy
                system.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student Name
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {createdStudentData?.student?.name || formData.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student ID (s_id)
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-700">
                    {createdStudentData?.s_id || "N/A"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(createdStudentData?.s_id, "Student ID")
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

              {createdStudentData?.initialPassword && (
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Initial Password
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-800">
                      {showPassword
                        ? createdStudentData.initialPassword
                        : "••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          createdStudentData.initialPassword,
                          "Initial Password"
                        )
                      }
                      className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    >
                      {copiedKey === "Initial Password" ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

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
                  Uploaded Documents
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
                onClick={handleAddAnotherStudent}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Another Student
              </button>

              <Link
                to="/admin/students"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
              >
                <FileCheck2 className="h-4 w-4 text-slate-500" />
                View All Students
              </Link>

              <Link
                to="/admin/leads"
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

export default AdminAddStudent;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  UserCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Share2,
  Tag,
  Plus,
  ArrowRight,
  RotateCcw,
  CheckSquare,
  Square,
  Users,
} from "lucide-react";
import {
  sourcesUrl,
  courseUrl,
  counsellorUrl,
  leadUrl,
} from "../../config/config";

const CANDIDATE_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "walk-in", label: "Walk-in" },
];

const CANDIDATE_STATUS_OPTIONS = [
  { value: "ongoing", label: "Ongoing" },
  { value: "interested", label: "Interested" },
  { value: "not interested", label: "Not Interested" },
  { value: "not useful", label: "Not Useful" },
  { value: "not responding", label: "Not Responding" },
  { value: "disconnect call", label: "Disconnect Call" },
  { value: "closed", label: "Closed" },
];

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const INITIAL_FORM = {
  candidateType: "lead",
  source: "",
  date: getTodayDate(),
  name: "",
  phone: "",
  alternativePhone: "",
  gender: "female",
  email: "",
  dob: "",
  fullAddress: "",
  enrolledCourses: [],
  assignedCounsellor: "",
  candidateStatus: "ongoing",
};

function AdminAddLead() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [sources, setSources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [counsellors, setCounsellors] = useState([]);

  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdLead, setCreatedLead] = useState(null);

  // Fetch sources, courses, counsellors
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        const adminToken = localStorage.getItem("adminToken");
        const headers = adminToken
          ? { Authorization: `Bearer ${adminToken}` }
          : {};

        const [sourcesRes, coursesRes, counsellorsRes] = await Promise.all([
          axios
            .get(sourcesUrl.sources, { headers })
            .catch(() => ({ data: { data: [] } })),
          axios
            .get(courseUrl.courses, { headers })
            .catch(() => ({ data: { data: [] } })),
          axios
            .get(counsellorUrl.counsellorAll)
            .catch(() => ({ data: { data: [] } })),
        ]);

        if (isMounted) {
          setSources(
            Array.isArray(sourcesRes.data?.data) ? sourcesRes.data.data : []
          );
          setCourses(
            Array.isArray(coursesRes.data?.data) ? coursesRes.data.data : []
          );
          setCounsellors(
            Array.isArray(counsellorsRes.data?.data)
              ? counsellorsRes.data.data
              : []
          );
        }
      } catch (err) {
        console.error("Error loading dropdown data:", err);
        if (isMounted) {
          toast.error("Failed to load some dropdown options.");
        }
      } finally {
        if (isMounted) {
          setLoadingDropdowns(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle course in enrolledCourses array
  const toggleCourse = (courseId) => {
    setFormData((prev) => {
      const exists = prev.enrolledCourses.includes(courseId);
      if (exists) {
        return {
          ...prev,
          enrolledCourses: prev.enrolledCourses.filter((id) => id !== courseId),
        };
      } else {
        return {
          ...prev,
          enrolledCourses: [...prev.enrolledCourses, courseId],
        };
      }
    });
  };

  const handleSelectAllCourses = () => {
    if (formData.enrolledCourses.length === courses.length) {
      setFormData((prev) => ({ ...prev, enrolledCourses: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        enrolledCourses: courses.map((c) => c._id),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) {
      toast.error("Please enter the lead name.");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter the primary phone number.");
      return;
    }
    if (!formData.source) {
      toast.error("Please select a lead source.");
      return;
    }
    if (!formData.assignedCounsellor) {
      toast.error("Please assign a counsellor.");
      return;
    }
    if (!formData.enrolledCourses || formData.enrolledCourses.length === 0) {
      toast.error("Please select at least one enrolled course.");
      return;
    }

    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      toast.error("Admin token not found. Please log in at /admin/login.");
      return;
    }

    const payload = {
      candidateType: formData.candidateType,
      candidateStatus: formData.candidateStatus || "ongoing",
      source: formData.source,
      date: formData.date || getTodayDate(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      alternativePhone: formData.alternativePhone.trim(),
      gender: formData.gender,
      email: formData.email.trim(),
      dob: formData.dob,
      fullAddress: formData.fullAddress.trim(),
      enrolledCourses: formData.enrolledCourses,
      assignedCounsellor: formData.assignedCounsellor,
    };

    try {
      setSubmitting(true);

      const response = await axios.post(leadUrl.lead, payload, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.data?.success === false) {
        toast.error(response.data?.message || "Failed to create lead.");
        return;
      }

      const createdData = response.data?.data || payload;
      setCreatedLead(createdData);
      toast.success(response.data?.message || "Lead added successfully!");
    } catch (err) {
      console.error("Create lead error:", err.response?.data || err);
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized (401). Please re-login at /admin/login.");
      } else {
        toast.error(
          err.response?.data?.message ||
          err.message ||
          "Unable to create lead."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setCreatedLead(null);
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Admin Workspace
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                Lead Intake
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Add New Lead
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Register an incoming prospective student lead, assign counsellor, and track source.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/leads"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Users className="h-4 w-4 text-slate-500" />
              All Leads
            </Link>
          </div>
        </div>

        {/* Success Confirmation Card */}
        {createdLead && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Lead Created Successfully!
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Lead record for{" "}
                    <span className="font-semibold text-slate-900">
                      {formData.name}
                    </span>{" "}
                    has been saved to the database.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Lead
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lead Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* Section 1: Lead Type, Source & Date */}
          <div className="space-y-6">
            {/* <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Share2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold">Source & Inquiry Details</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Specify candidate categorization, acquisition channel, and intake date.
              </p>
            </div> */}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Candidate Type */}
              <div>
                <label
                  htmlFor="candidateType"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Candidate Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="candidateType"
                    name="candidateType"
                    value={formData.candidateType}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-10 pl-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    {CANDIDATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                    ▼
                  </div>
                </div>
              </div>

              {/* Candidate Status */}
              <div>
                <label
                  htmlFor="candidateStatus"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Status <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Sparkles className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="candidateStatus"
                    name="candidateStatus"
                    value={formData.candidateStatus}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-10 pl-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    {CANDIDATE_STATUS_OPTIONS.map((status) => (
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

              {/* Source */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="source"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Lead Source <span className="text-rose-500">*</span>
                  </label>
                  {loadingDropdowns && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Loading
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Share2 className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="source"
                    name="source"
                    required
                    value={formData.source}
                    onChange={handleChange}
                    disabled={loadingDropdowns}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-10 pl-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  >
                    <option value="">-- Select Source --</option>
                    {sources.map((src) => (
                      <option key={src._id} value={src._id}>
                        {src.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                    ▼
                  </div>
                </div>
              </div>

              {/* Inquiry Date */}
              <div>
                <label
                  htmlFor="lead-date"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Enquiry Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="lead-date"
                    name="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold">Personal Information</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Contact and biographical details of the prospective student.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="lead-name"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="lead-name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Gargi Das"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, gender: g.value }))
                      }
                      className={`flex items-center justify-center rounded-xl border py-3 text-sm font-semibold transition-all cursor-pointer ${formData.gender === g.value
                        ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="lead-phone"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Primary Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="lead-phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876545960"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Alternative Phone */}
              <div>
                <label
                  htmlFor="lead-alt-phone"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Alternative Phone
                </label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="lead-alt-phone"
                    name="alternativePhone"
                    type="tel"
                    value={formData.alternativePhone}
                    onChange={handleChange}
                    placeholder="e.g. 9123456728"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="lead-email"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="lead-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. gargidas@gmail.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="lead-dob"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Date of Birth (DOB)
                </label>
                <div className="relative">
                  <Calendar className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="lead-dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="lead-address"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Full Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
                  <textarea
                    id="lead-address"
                    name="fullAddress"
                    rows="2"
                    required
                    value={formData.fullAddress}
                    onChange={handleChange}
                    placeholder="e.g. Kolkata, West Bengal"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Enrolled Courses & Assigned Counsellor */}
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold">Course Selection & Assignment</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Choose the courses the lead is interested in and assign a dedicated counsellor.
              </p>
            </div>

            {/* Enrolled Courses Multi-select */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Enrolled / Interested Courses (enrolledCourses){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click to select one or multiple courses.
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
                    const isSelected = formData.enrolledCourses.includes(
                      course._id
                    );
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

            {/* Assigned Counsellor */}
            <div className="pt-2">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="assignedCounsellor"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Assigned Counsellor <span className="text-rose-500">*</span>
                </label>
                {loadingDropdowns && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
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
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pr-10 pl-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                >
                  <option value="">-- Select Counsellor --</option>
                  {counsellors.map((counsellor) => (
                    <option key={counsellor._id} value={counsellor._id}>
                      {counsellor.name}{" "}
                      {counsellor.phone ? `(${counsellor.phone})` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting Lead...</span>
                </>
              ) : (
                <>
                  <span>Create Lead</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AdminAddLead;
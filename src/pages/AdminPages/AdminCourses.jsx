import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../../config/axios";
import { adminUrl } from "../../config/config";
import { SquarePen, Trash2 } from "lucide-react";

const fetchCourses = async () => {
  const response = await adminApi.get(adminUrl.courses);
  const result = response.data;

  if (!result?.success || !Array.isArray(result.data)) {
    throw new Error(result?.message || "Invalid courses response.");
  }

  return result.data;
};

const INITIAL_FORM = {
  name: "",
  totalFees: "",
  duration: "",
  description: "",
};

function AdminCourses() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (error) {
      console.error("Load courses error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || error.message || "Unable to load courses."
      );
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialCourses = async () => {
      try {
        const data = await fetchCourses();
        if (isMounted) {
          setCourses(data);
        }
      } catch (error) {
        console.error("Load courses error:", error.response?.data || error);
        if (isMounted) {
          toast.error(
            error.response?.data?.message ||
            error.message ||
            "Unable to load courses."
          );
        }
      } finally {
        if (isMounted) {
          setTableLoading(false);
        }
      }
    };

    loadInitialCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    setTableLoading(true);
    loadCourses();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingCourse(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: formData.name.trim(),
      totalFees: formData.totalFees.trim(),
      duration: formData.duration.trim(),
      description: formData.description.trim(),
    };

    if (
      !payload.name ||
      !payload.totalFees ||
      !payload.duration ||
      !payload.description
    ) {
      toast.error("Please fill in all course fields.");
      return;
    }

    try {
      setLoading(true);
      const response = editingCourse
        ? await adminApi.put(`${adminUrl.courses}/${editingCourse._id}`, payload)
        : await adminApi.post(adminUrl.courses, payload);

      if (response.data?.success === false) {
        toast.error(
          response.data.message ||
          `Unable to ${editingCourse ? "update" : "create"} course.`
        );
        return;
      }

      toast.success(
        response.data?.message ||
        `Course ${editingCourse ? "updated" : "created"} successfully.`
      );
      resetForm();
      await loadCourses();
    } catch (error) {
      console.error("Save course error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Unable to save course."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name || "",
      totalFees: String(course.totalFees ?? ""),
      duration: course.duration || "",
      description: course.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = async (course) => {
    try {
      const response = await adminApi.put(`${adminUrl.courses}/${course._id}`, {
        isActive: !course.isActive,
      });

      if (response.data?.success === false) {
        toast.error(response.data.message || "Unable to update course status.");
        return;
      }

      toast.success(response.data?.message || "Course status updated.");
      await loadCourses();
    } catch (error) {
      console.error("Update course status error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Unable to update course status."
      );
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete the course "${course.name}"?`)) {
      return;
    }

    try {
      const response = await adminApi.delete(
        `${adminUrl.courses}/${course._id}`
      );

      if (response.data?.success === false) {
        toast.error(response.data.message || "Unable to delete course.");
        return;
      }

      toast.success(response.data?.message || "Course deleted successfully.");
      if (editingCourse?._id === course._id) {
        resetForm();
      }
      await loadCourses();
    } catch (error) {
      console.error("Delete course error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Unable to delete course."
      );
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Admin workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Courses
          </h1>
          <p className="mt-2 text-slate-600">
            Create and manage the courses available in your program catalogue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {editingCourse ? "Edit course" : "Add a course"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the course name, fees, duration, and description.
            </p>
          </div>

          <div>
            <label
              htmlFor="course-name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Course name
            </label>
            <input
              id="course-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Genpro"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              required
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="course-fees"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Total fees
              </label>
              <input
                id="course-fees"
                name="totalFees"
                type="number"
                min="0"
                step="any"
                value={formData.totalFees}
                onChange={handleChange}
                placeholder="30000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>

            <div>
              <label
                htmlFor="course-duration"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Duration
              </label>
              <input
                id="course-duration"
                name="duration"
                type="text"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 3 weeks"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="course-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>
            <textarea
              id="course-description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the course..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              required
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : editingCourse
                  ? "Save changes"
                  : "Create course"}
            </button>
            {editingCourse && (
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Course list
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {courses.length} {courses.length === 1 ? "course" : "courses"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={tableLoading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {tableLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Fees</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                      Loading courses...
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                      No courses found. Create your first course above.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course._id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {course.name}
                      </td>
                      <td className="max-w-xs px-6 py-4 text-slate-600">
                        <span className="line-clamp-2">
                          {course.description || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {course.totalFees != null
                          ? Number(course.totalFees).toLocaleString()
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {course.duration || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${course.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {course.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {course.createdAt
                          ? new Date(course.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {/* <button
                            type="button"
                            onClick={() => handleToggleActive(course)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {course.isActive ? "Deactivate" : "Activate"}
                          </button> */}
                          <button
                            type="button"
                            onClick={() => handleEdit(course)}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            <SquarePen />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(course)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminCourses;

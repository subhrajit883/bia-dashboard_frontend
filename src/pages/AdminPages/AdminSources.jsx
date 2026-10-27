import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../../config/axios";
import { adminUrl } from "../../config/config";
import { SquarePen, Trash } from "lucide-react";

const fetchSources = async () => {

  const response = await adminApi.get(adminUrl.sources);
  const result = response.data;

  if (!result?.success || !Array.isArray(result.data)) {
    throw new Error(result?.message || "Invalid sources response.");
  }

  return result.data;
};

function AdminSources() {
  const [name, setName] = useState("");
  const [sources, setSources] = useState([]);
  const [editingSource, setEditingSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  const loadSources = useCallback(async () => {
    try {
      const data = await fetchSources();
      setSources(data);
    } catch (error) {
      console.error("Load sources error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || error.message || "Unable to load sources."
      );
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialSources = async () => {
      try {
        const data = await fetchSources();
        if (isMounted) {
          setSources(data);
        }
      } catch (error) {
        console.error("Load sources error:", error.response?.data || error);
        if (isMounted) {
          toast.error(
            error.response?.data?.message ||
            error.message ||
            "Unable to load sources."
          );
        }
      } finally {
        if (isMounted) {
          setTableLoading(false);
        }
      }
    };

    loadInitialSources();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    setTableLoading(true);
    loadSources();
  };

  const resetForm = () => {
    setName("");
    setEditingSource(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sourceName = name.trim();

    if (!sourceName) {
      toast.error("Please enter a source name.");
      return;
    }

    try {
      setLoading(true);
      const response = editingSource
        ? await adminApi.put(`${adminUrl.sources}/${editingSource._id}`, {
          name: sourceName,
        })
        : await adminApi.post(adminUrl.sources, { name: sourceName });

      if (response.data?.success === false) {
        toast.error(
          response.data.message ||
          `Unable to ${editingSource ? "update" : "create"} source.`
        );
        return;
      }

      toast.success(
        response.data?.message ||
        `Source ${editingSource ? "updated" : "created"} successfully.`
      );
      resetForm();
      await loadSources();
    } catch (error) {
      console.error("Save source error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Unable to save source."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setName(source.name || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = async (source) => {
    try {
      const response = await adminApi.put(`${adminUrl.sources}/${source._id}`, {
        isActive: !source.isActive,
      });

      if (response.data?.success === false) {
        toast.error(response.data.message || "Unable to update source status.");
        return;
      }

      toast.success(response.data?.message || "Source status updated.");
      await loadSources();
    } catch (error) {
      console.error("Update source status error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Unable to update source status."
      );
    }
  };

  const handleDelete = async (source) => {
    if (!window.confirm(`Delete the source "${source.name}"?`)) {
      return;
    }

    try {
      const response = await adminApi.delete(
        `${adminUrl.sources}/${source._id}`
      );

      if (response.data?.success === false) {
        toast.error(response.data.message || "Unable to delete source.");
        return;
      }

      toast.success(response.data?.message || "Source deleted successfully.");
      if (editingSource?._id === source._id) {
        resetForm();
      }
      await loadSources();
    } catch (error) {
      console.error("Delete source error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Unable to delete source."
      );
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Admin workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Sources
          </h1>
          <p className="mt-2 text-slate-600">
            Create and manage the sources used to track where leads come from.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {editingSource ? "Edit source" : "Add a source"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editingSource
                ? "Update the source name and save your changes."
                : "Create a source such as Google Ads or YouTube."}
            </p>
          </div>
          <div>
            <label
              htmlFor="source-name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Source name
            </label>
            <input
              id="source-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Google Ads"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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
                : editingSource
                  ? "Save changes"
                  : "Create source"}
            </button>
            {editingSource && (
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
                Source list
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {sources.length} {sources.length === 1 ? "source" : "sources"}
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
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      Loading sources...
                    </td>
                  </tr>
                ) : sources.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      No sources found. Create your first source above.
                    </td>
                  </tr>
                ) : (
                  sources.map((source) => (
                    <tr key={source._id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {source.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${source.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {source.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {source.createdAt
                          ? new Date(source.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {/* <button
                            type="button"
                            onClick={() => handleToggleActive(source)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {source.isActive ? "Deactivate" : "Activate"}
                          </button> */}
                          <button
                            type="button"
                            onClick={() => handleEdit(source)}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            <SquarePen />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(source)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Trash />
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

export default AdminSources;

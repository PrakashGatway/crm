import { useState, useEffect } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/UserContext";
import api from "../../axiosInstance";

export default function QueryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (id) {
      fetchQuery();
    }
  }, [id]);

  const fetchQuery = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/query/${id}`);
      
      // Check if non-admin user is trying to access someone else's query
      if (!isAdmin && data.data.userId._id !== user._id) {
        toast.error("You can only view your own queries");
        navigate("/queries");
        return;
      }

      setQuery(data.data);
      setStatus(data.data.status);
      setPriority(data.data.priority);
      setNotes(data.data.resolutionNotes || "");
    } catch (error) {
      toast.error(error.message || "Failed to fetch query");
      navigate("/queries");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const payload = {
        status,
        priority,
        resolutionNotes: notes,
      };

      const { data } = await api.put(`/query/${id}`, payload);
      setQuery(data.data);
      toast.success("Query updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update query");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status]}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      high: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityClasses[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <div>
      <PageMeta
        title="Query Details | Support Center"
        description="View query details"
      />
      <PageBreadcrumb
        pageTitle="Query Details"
      />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : query ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  {query.subject}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {getStatusBadge(query.status)}
                  {getPriorityBadge(query.priority)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Created: {moment(query.createdAt).format("MMM D, YYYY h:mm A")}
                  </span>
                  {query.updatedAt !== query.createdAt && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated: {moment(query.updatedAt).format("MMM D, YYYY h:mm A")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(isAdmin ? "/admin/queries" : "/queries")}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Back to List
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Query Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Query Message */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                    Query Details
                  </h3>
                  <div className="prose max-w-none text-sm text-gray-700 dark:text-gray-300">
                    {query.message}
                  </div>
                </div>

                {/* Attachments */}
                {query.attachments?.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                      Attachments ({query.attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {query.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center rounded-md border border-gray-200 p-3 dark:border-gray-700"
                        >
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center dark:bg-gray-700">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                          </div>
                          <div className="ml-4 flex-1 overflow-hidden">
                            <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Notes */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                    {isAdmin ? "Resolution Notes" : "Admin Response"}
                  </h3>
                  {isAdmin ? (
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Add resolution notes here..."
                    />
                  ) : (
                    <div className="prose max-w-none text-sm text-gray-700 dark:text-gray-300">
                      {query.resolutionNotes || "No response yet"}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Meta and Actions */}
              <div className="space-y-6">
                {/* Query Meta */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                    Query Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      {isAdmin ? (
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      ) : (
                        <div className="mt-1">{getStatusBadge(query.status)}</div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                      {isAdmin ? (
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      ) : (
                        <div className="mt-1">{getPriorityBadge(query.priority)}</div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 capitalize dark:text-white">
                        {query.category.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isAdmin && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="space-y-3">
                      <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                      >
                        {updating ? (
                          <>
                            <svg
                              className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          "Update Query"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                    Status History
                  </h3>
                  <div className="flow-root">
                    <ul className="-mb-8">
                      <li>
                        <div className="relative pb-8">
                          <span
                            className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                            aria-hidden="true"
                          ></span>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                                <svg
                                  className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Query was created
                                </p>
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                <time dateTime={query.createdAt}>
                                  {moment(query.createdAt).format("MMM D, h:mm A")}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>

                      {query.updatedAt && (
                        <li>
                          <div className="relative pb-8">
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                  <svg
                                    className="h-5 w-5 text-green-600 dark:text-green-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Query was last updated
                                  </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                  <time dateTime={query.updatedAt}>
                                    {moment(query.updatedAt).format("MMM D, h:mm A")}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">Query not found</p>
            <button
              onClick={() => navigate(isAdmin ? "/queries" : "/queries")}
              className="mt-4 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
            >
              Back to Query List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
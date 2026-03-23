import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

export default function UserMetaAdmin() {
  const [loading, setLoading] = useState(true);
  const [userMeta, setUserMeta] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserMeta();
    }
  }, [userId]);

  const fetchUserMeta = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/user-meta/${userId}`);
      setUserMeta(data.data);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch user meta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user meta?')) {
      try {
        setLoading(true);
        await axios.delete(`/api/user/meta/${userId}`);
        toast.success('User meta deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Deletion failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <PageMeta
        title="User Meta Details | Admin Dashboard"
        description="View and manage user meta details"
      />
      <PageBreadcrumb 
        pageTitle="User Meta Details" 
        breadcrumbs={[
          { title: 'Admin', path: '/admin' },
          { title: 'Users', path: '/admin/users' },
          { title: 'Meta Details', path: `/admin/user-meta/${userId}` }
        ]}
      />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              User Meta Details
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View and manage user meta information
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
          >
            Delete Meta
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : userMeta ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Callback URLs
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pay-In Callback URL</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-all">
                      {userMeta.payInCallbackUrl || 'Not configured'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pay-Out Callback URL</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-all">
                      {userMeta.payOutCallbackUrl || 'Not configured'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Whitelisted IPs
                </h4>
                {userMeta.whitelistedIPs?.length > 0 ? (
                  <div className="space-y-3">
                    {userMeta.whitelistedIPs.map((ip, index) => (
                      <div key={index} className="flex items-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          {index + 1}
                        </span>
                        <span className="ml-3 font-mono text-sm font-medium text-gray-900 dark:text-white">
                          {ip}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No IP addresses are whitelisted
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                Additional Meta Data
              </h4>
              {userMeta.meta ? (
                <div className="overflow-x-auto">
                  <pre className="rounded-md bg-gray-50 p-4 text-sm dark:bg-gray-700 dark:text-gray-200">
                    {JSON.stringify(userMeta.meta, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No additional meta data available
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              User meta not found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
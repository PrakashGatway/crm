import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export default function UserMetaAdmin() {
  const { userId } = router.query;
  const [loading, setLoading] = useState(true);
  const [userMeta, setUserMeta] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserMeta();
    }
  }, [userId]);

  const fetchUserMeta = async () => {
    try {
      const { data } = await axios.get(`/api/user/meta/${userId}`);
      setUserMeta(data.data);
      setLoading(false);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch user meta');
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
      />
      
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : userMeta ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                User Meta Details
              </h3>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50"
              >
                Delete Meta
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Callback URLs
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pay-In</p>
                    <p className="break-all font-medium text-gray-800 dark:text-white/90">
                      {userMeta.payInCallbackUrl || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pay-Out</p>
                    <p className="break-all font-medium text-gray-800 dark:text-white/90">
                      {userMeta.payOutCallbackUrl || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Whitelisted IPs
                </h4>
                <div className="space-y-2">
                  {userMeta.whitelistedIPs?.length > 0 ? (
                    userMeta.whitelistedIPs.map((ip, index) => (
                      <div key={index}>
                        <p className="text-xs text-gray-500 dark:text-gray-400">IP {index + 1}</p>
                        <p className="font-medium text-gray-800 dark:text-white/90">{ip}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No IPs whitelisted</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 md:col-span-2">
                <h4 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Additional Meta
                </h4>
                <pre className="overflow-auto rounded bg-gray-50 p-3 text-sm dark:bg-gray-800">
                  {userMeta.meta ? JSON.stringify(userMeta.meta, null, 2) : 'No additional meta data'}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">User meta not found</p>
        )}
      </div>
    </div>
  );
}
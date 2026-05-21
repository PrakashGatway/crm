import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import api from '../axiosInstance';

type AuthContextType = {
  user: any | null;
  token: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
};
import { io } from "socket.io-client";
// import { toast } from 'react-toastify';
import { toast } from "sonner";



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [status, setStatus] = useState();
  const [wallet, setWallet] = useState() as any;
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState(() => {
    return JSON.parse(localStorage.getItem("notifications") || "[]");
  });


  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        setToken(accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        await fetchUserProfile();
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const getCookie = (name) => {
    return document.cookie
      .split("; ")
      .find(row => row.startsWith(name + "="))
      ?.split("=")[1];
  };

  useEffect(() => {
    if (!user) return;

    const allowedRoles = ["admin", "leader", "counselor"];

    if (!allowedRoles.includes(user.role)) return;

    const socket = io("https://server.gatewayabroadeducations.com/lead-notifications", {
      withCredentials: true,
      auth: {
        token: getCookie("auth_token") || localStorage.getItem("accessToken"),
      }
    });

    socket.on("connect", () => {
      console.log("Lead socket connected");
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket error:", err.message);
    });

    socket.on("leadAssigned", (lead) => {

      if (isSoundEnabled()) {
        const audio = new Audio("/notify.mp3");
        audio.play();
      }

      saveNotification(lead);

      setNotifications((prevNotifications) => {
        const newNotification = {
          id: lead.leadId,
          name: lead.name,
          type: lead.type || "",
          message: lead.message || "lead notification",
          time: new Date(lead.createdAt).toISOString(),
        };
        return [newNotification, ...prevNotifications].slice(0, 10);
      });

      toast.custom(
        (t) => {

          const isMessage = lead.type === "message";

          return (
            <div
              className={`
          flex items-start gap-3 shadow-2xl rounded-2xl p-4 w-[420px] max-w-full border
          animate-in slide-in-from-top duration-300
          ${isMessage
                  ? "bg-green-50 dark:bg-green-950 border-2 border-red-400 dark:border-green-800"
                  : "bg-white dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-700"
                }
        `}
            >
              <div
                className={`
            w-10 h-10 rounded-full flex items-center justify-center
            text-white font-bold text-sm shrink-0
            ${isMessage ? "" : "bg-gray-700"}
          `}
              >
                {isMessage ? <img src={"./whats.svg"} className="w-full h-full shadow-2xl object-cover" /> : lead.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`
                text-sm font-semibold truncate
                ${isMessage
                        ? "text-green-800 dark:text-green-200"
                        : "text-gray-900 dark:text-white"
                      }
              `}
                  >
                    {isMessage
                      ? `${lead.name || "Unknown"} sent a message`
                      : lead.type || "New Lead"}
                  </p>
                  <button
                    onClick={() => toast.dismiss(t)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <p
                  className={`
              text-xs mt-1 break-words
              ${isMessage
                      ? "text-green-700 dark:text-green-300"
                      : "text-gray-500"
                    }
            `}
                >
                  {lead.message || "Lead notification"}
                </p>
                <div className="flex items-center justify-between mt-1">

                  {isMessage && (
                    <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                      WhatsApp Message
                    </span>
                  )}

                  <button
                    onClick={() => {
                      toast.dismiss(t);

                      if (isMessage) {
                        navigate(`/leads?q=${lead?.phone10 || lead?.phone || ""}&name=${lead?.name || ""}&lead=${lead?.leadId}`)
                      } else {
                        navigate(`/leads`);
                      }
                    }}
                    className={`
                text-sm font-semibold hover:underline
                ${isMessage
                        ? "text-green-700 dark:text-green-300"
                        : "text-blue-600"
                      }
              `}
                  >
                    {isMessage ? "Open Chat" : "View"}
                  </button>
                </div>
              </div>
            </div>
          );
        },
        {
          duration: 5000,

          position:
            lead.type === "message"
              ? "bottom-right"
              : "top-right",
        }
      );
    });

    return () => {
      socket.disconnect();
    };

  }, [user]);

  const isSoundEnabled = () => {
    return localStorage.getItem("notify_sound") !== "false"; // default ON
  };

  const toggleSound = () => {
    const current = localStorage.getItem("notify_sound");
    localStorage.setItem("notify_sound", current === "false" ? "true" : "false");
  };

  const saveNotification = (lead) => {
    const existing = JSON.parse(localStorage.getItem("notifications") || "[]");

    const newNotification = {
      id: lead.leadId,
      name: lead.name,
      message: `${lead.name} just got assigned to you`,
      time: new Date(lead.createdAt).toISOString()
    };

    const updated = [newNotification, ...existing].slice(0, 10); // keep only 10

    localStorage.setItem("notifications", JSON.stringify(updated));
  };

  const formatLeadStatus = (data = []) => {
    return data.reduce((acc, item) => {
      if (item?.isActive) {
        acc[item.key] = item.name;
      }
      return acc;
    }, {});
  };

  const fetchUserProfile = async () => {
    try {
      const [leadstatus, response] = await Promise.all([
        api.get("/status"),
        api.get('/auth/me')
      ]);
      // const response = await api.get('/auth/me');
      const statusValues = formatLeadStatus(leadstatus?.data?.data)
      setStatus(statusValues);
      setUser(response.data?.data);
    } catch (err) {
      logout();
      throw err;
    }
  };


  const logout = async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    await api.get("auth/logout");
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common['Authorization'];
    window.location.href = "/signin";
  };

  const value = {
    user,
    wallet,
    token,
    LeadStatus: status || {},
    logout,
    loading,
    fetchUserProfile,
    toggleSound,
    notifications,
    setNotifications,
    isSoundEnabled
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
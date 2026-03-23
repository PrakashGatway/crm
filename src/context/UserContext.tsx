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

    console.log(getCookie("auth_token"))

    const socket = io("https://uat.gatewayabroadeducations.com/lead-notifications", {
      withCredentials: true,
      auth: {
        token: getCookie("auth_token") || localStorage.getItem("accessToken"),
      }
    });

    socket.on("connect", () => {
      console.log("Lead socket connected");
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
          message: lead.message || "lead notification",
          time: new Date(lead.createdAt).toISOString(),
        };
        return [newNotification, ...prevNotifications].slice(0, 10);
      });

      toast.custom((t) => (
        <div className="flex items-start gap-3 bg-white dark:bg-gray-900 shadow-xl  rounded-xl p-3 px-4 w-[420px] max-w-full border border-gray-300 dark:border-gray-700 animate-in slide-in-from-top">

          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
            {lead.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              New Lead
            </p>
            <p className="text-xs text-gray-500">
              {lead.message || "lead notification"}
            </p>
          </div>
          <div>
            <button
              onClick={() => { toast.dismiss(t); navigate(`/leads`) }}
              className="mt-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              View
            </button>
          </div>

          <button
            onClick={() => toast.dismiss(t)}
            className="text-gray-600 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>
      ), {
        duration: 3000,
      });
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

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data?.data);
      setWallet(response.data?.wallet);
    } catch (err) {
      logout();
      throw err;
    }
  };

  useEffect(() => {
    if (user && !user?.category?._id) {
      navigate('/course/category');
    }
    console.log('clicked')
  }, [user, location.pathname]);


  const logout = async () => {
    // localStorage.removeItem('accessToken');
    // localStorage.removeItem('refreshToken');
    // sessionStorage.removeItem('accessToken');
    // sessionStorage.removeItem('refreshToken');
    await api.get("auth/logout");
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common['Authorization'];
    window.location.href = "https://www.gatewayabroadeducations.com";
  };

  const value = {
    user,
    wallet,
    token,
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
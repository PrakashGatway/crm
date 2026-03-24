import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "./context/UserContext";
import { AuthRoute, ProtectedRoute } from "./components/RouteGaurds";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { ToastContainer } from "react-toastify";
import UserListPage from "./pages/userList";

import ComingSoon from "./pages/OtherPage/ComingSoon";













import LeadManagement from "./pages/Leads/LeadManagement";


import SupportPage from "./pages/Support/Supports";





import DailyReport from "./pages/Leads/DailyReport";
import { Toaster } from "sonner";
import SignIn from "./pages/AuthPages/SignIn";
import LeadStatusPage from "./pages/Setting/leadStatus";

// Define roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  EDITOR: 'editor',
  COUNSEL: 'counselor',
  MANAGER: "manager",
  LEADER: "leader",
};

export default function App() {

  return (
    <Router>
      <AuthProvider>
        <ToastContainer
          style={{ zIndex: 999999 }}
        />
        <Toaster position="top-center" richColors closeButton />
        <ScrollToTop />
        <Routes>
          <Route element={<AuthRoute />}>
            <Route path="/signin" element={<SignIn />} />
          </Route>

          <Route element={<ProtectedRoute />}>

            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />
              <Route path="/profile" element={<UserProfiles />} />
          
              <Route path="/support" element={<SupportPage />} />
              <Route path="/setting" element={<LeadStatusPage/>} />

              <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                <Route path="/users" element={<UserListPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={[ROLES.COUNSEL, ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER]} />}>
                <Route path="/leads" element={<LeadManagement />} />
                 <Route path="/lead-report" element={<DailyReport />} /> 
              </Route>

              <Route path="*" element={<ComingSoon />} />
            </Route>
          </Route>
          <Route path="/unauthorized" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
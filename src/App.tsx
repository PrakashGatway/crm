import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "./context/UserContext";
import { AuthRoute, ProtectedRoute } from "./components/RouteGaurds";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
// import Home from "./pages/Dashboard/Home";
import { ToastContainer } from "react-toastify";
import UserListPage from "./pages/userList";

import ComingSoon from "./pages/OtherPage/ComingSoon";
import LeadManagement from "./pages/Leads/LeadManagement";


import SupportPage from "./pages/Support/Supports";
import DailyReport from "./pages/Leads/DailyReport";
import { Toaster } from "sonner";
import SignIn from "./pages/AuthPages/SignIn";
import LeadStatusPage from "./pages/Setting/leadStatus";
import TeamManagement from "./pages/Team";
import LeadAssignmentManagement from "./pages/assignRules";
import LeadDetailPage from "./pages/LeadDetails";
import LeadDetailPageM from "./pages/leadDetail/LeadDetailPage";
import CallAnalytics from "./pages/Dashboard/CallAnalysis";
import FollowUpBot from "./layout/Followup";
import JoinMeetingPage from "./MeetingJoin";
import EmailBroadcast from "./pages/EmailMarketing";
import WhatsappPage from "./pages/Whatsapp/whatsappPage";
import MessageAutomationForm from "./pages/Automation/AutomationForm";
import ChatsPage from "./pages/Whatsapp/RecentChat";

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
        <FollowUpBot />
        <Routes>
          <Route path="/join-meeting/:id" element={<JoinMeetingPage />} />
          <Route element={<AuthRoute />}>
            <Route path="/signin" element={<SignIn />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<CallAnalytics />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/teams" element={<TeamManagement />} />
              <Route path="/rules" element={<LeadAssignmentManagement />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/setting" element={<LeadStatusPage />} />
              <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                <Route path="/users" element={<UserListPage />} />
                {/* <Route path="/automations" element={<AutomationList />} /> */}
                <Route path="/automations/create" element={<MessageAutomationForm />} />
                <Route path="/automations/edit/:id" element={<MessageAutomationForm />} />
              </Route>
              <Route element={<ProtectedRoute roles={[ROLES.COUNSEL, ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADER]} />}>
                <Route path="/leads" element={<LeadManagement />} />
                <Route path="/leads/:id" element={<LeadDetailPage />} />
                <Route path="/leadsss" element={<LeadDetailPageM />} />
                <Route path="/lead-report" element={<DailyReport />} />
                <Route path="/broadcast" element={<EmailBroadcast />} />
                <Route path="/whatsapp" element={<WhatsappPage />} />
                <Route path="/chat" element={<ChatsPage />} />
                {/* <Route path="/auto/edit/:id" element={<AutomationEditor />} /> */}
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
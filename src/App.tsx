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
import PagesManagement from "./pages/Website/Pages";
import EntityManagement from "./pages/Website/Entities";
import ComingSoon from "./pages/OtherPage/ComingSoon";
import CategoryManagement from "./pages/Courses/Categories";
import CourseManagement from "./pages/Courses/Courses";
import ModuleManagement from "./pages/Courses/Modules";
import ContentManagement from "./pages/Content/Contents";
import CategorySelectionPage from "./pages/Category/CategorySelection";
import CourseListingPage from "./pages/CourseList/CourseUsers";
import VideoPlayerPage from "./pages/Player/Player";
import MockTestsPage from "./userView/TestSeries";
import EventCalendar from "./userView/Events";
import CourseDetailPage from "./userView/CourseDetails";
import CheckoutPage from "./userView/CheckoutPage";
import OffersPage from "./userView/MyOffer";
import ReferAndEarnPage from "./userView/Referal";
import TransactionsPage from "./userView/TransationPage";
import PromoCodeManagement from "./pages/Offers/offers";
import MyCoursesPage from "./userView/MyCourse";
import StudyMaterialPage from "./userView/StudyMaterial";
import PaymentStatusPage from "./userView/PaymentStatus";
import AdminTransactionsPage from "./pages/Transaction";
import LeadManagement from "./pages/Leads/LeadManagement";
import CourseDetailPageee from "./userView/MyCourseDetail";
import ExamManagement from "./pages/Tests/Exam";
import SectionManagement from "./pages/Tests/Sections";
import TestSeriesManagement from "./pages/Tests/Tests";
import QuestionManagement from "./pages/Tests/Questions";
import SupportPage from "./pages/Support/Supports";
import BlogCategoryManagement from "./pages/Website/BlogCategories";
import ArticleManagement from "./pages/Website/Blogs";
import CommentsManagement from "./pages/Website/BlogComent";
import MockTest from "./userView/Mocktest";
import TestQuestionPage from "./userView/Testquestionpage";
import PackageManagement from "./pages/Tests/Packages";
import FullLengthTestPage from "./pages/TestScreen/FullTest";
import FullTestsPage from "./userView/SatTest";
import QuestionManagementPage from "./pages/mcu/Questions";
import TestTemplateManagementPage from "./pages/mcu/TestTemplates";
import SatTestAttemptPage from "./pages/SatTest/SatAttempts";
import GmatTestAttemptPage from "./pages/mcu/GmatTest";
import GreTestAttemptPage from "./pages/mcu/GreAttempts";
import GmatTestAnalysisPage from "./pages/mcu/GmatAnaysis";
import PteExamPage from "./pages/PTEtest/PteAttempts";
import TestSeriesManagementPage from "./pages/TestSeries/TestSeriesPage";
import TestSeriesDetailPage from "./usercomponent/TestSeriesDetail";
import DailyReport from "./pages/Leads/DailyReport";
import { Toaster } from "sonner";
import SignIn from "./pages/AuthPages/SignIn";

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
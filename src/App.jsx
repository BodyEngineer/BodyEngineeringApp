import LandingPage from "./pages/LandingPage";
import MemberLogin from './pages/MemberLogin'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import OwnerProtectedRoute from "./components/OwnerProtectedRoute";
import MemberProtectedRoute from "./components/MemberProtectedRoute";
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MemberProfile from './pages/MemberProfile';
import Members from './pages/Members'
import AddMember from './pages/AddMember'
import EditMember from './pages/EditMember'
import MemberDetail from './pages/MemberDetail'
import Attendance from './pages/Attendance'
import Alerts from './pages/Alerts'
import MemberDashboard from './pages/MemberDashboard'
import BodyAssessment from './pages/BodyAssessment'
import MyTransformation from "./pages/MyTransformation";
import OnlineClients from './pages/OnlineClients'
import AddOnlineClient from './pages/AddOnlineClient'
import AddAssessment from './pages/AddAssessment'
import AssessmentTimeline from './pages/AssessmentTimeline';
import OnlineClientProfile from './pages/OnlineClientProfile';   
import OnlineDashboard from "./pages/OnlineDashboard"; 
import WebsiteManagement from "./pages/WebsiteManagement";
import WebsiteTransformations from "./pages/WebsiteTransformations";
import WebsiteHeroMedia from "./pages/WebsiteHeroMedia";
import WebsiteTestimonials from "./pages/WebsiteTestimonials";
import WebsitePrograms from './pages/WebsitePrograms'
import ManagePrograms from "./pages/ManagePrograms";
import WebsiteHeroManagement from "./pages/WebsiteHeroManagement";
import WebsiteSettings from "./pages/admin/WebsiteSettings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OwnerForgotPassword from "./pages/admin/OwnerForgotPassword";
import CoachProfileManagement from "./pages/CoachProfileManagement";
import MemberAttendance from "./pages/MemberAttendance";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
  path="/owner-forgot-password"
  element={<OwnerForgotPassword />}
/>

          <Route path="/member-login" element={<MemberLogin />} />

          <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password"
  element={<ResetPassword />}
/>

          <Route
  path="/online-dashboard"
  element={
    <MemberProtectedRoute>
      <OnlineDashboard />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/member-attendance"
  element={
    <MemberProtectedRoute>
      <MemberAttendance />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/member-dashboard"
  element={
    <MemberProtectedRoute>
      <MemberDashboard />
    </MemberProtectedRoute>
  }
/>



<Route
  path="/member-dashboard/my-transformation"
  element={
    <MemberProtectedRoute>
      <MyTransformation />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/member-dashboard/profile"
  element={
    <MemberProtectedRoute>
      <MemberProfile />
    </MemberProtectedRoute>
  }
/>
          <Route
            element={
              <OwnerProtectedRoute>
                <Layout />
              </OwnerProtectedRoute>
            }
          >
            <Route
  path="/website-management"
  element={<WebsiteManagement />}
/>
<Route
  path="/website-management/hero"
  element={<WebsiteHeroMedia />}
/>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/add" element={<AddMember />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/members/:id/edit" element={<EditMember />} />
            <Route path="/online-clients" element={<OnlineClients />} />
            <Route path="/online-clients/add" element={<AddOnlineClient />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route
  path="/website-settings"
  element={<WebsiteSettings />}
/>
            <Route path="/online-clients/:id/add-assessment" element={<AddAssessment />} />
            <Route
  path="/body-assessment"
  element={<BodyAssessment />}
/>
<Route path="/online-clients/:id/timeline" element={<AssessmentTimeline/>} />
<Route
    path="/online-clients/:id"
    element={<OnlineClientProfile />}
/>


            <Route path="/alerts" element={<Alerts />} />

<Route
  path="/website-management/transformations"
  element={<WebsiteTransformations />}
/>

<Route
  path="/website-management/testimonials"
  element={<WebsiteTestimonials />}
/>

<Route
path= "website-management/programs"
element= {<WebsitePrograms />}
/>

<Route
  path="/manage-programs"
  element={<ManagePrograms />}
/>

<Route
  path="/website-management/hero"
  element={<WebsiteHeroManagement />}
/>

<Route
  path="/website-management/coach"
  element={<CoachProfileManagement />}
/>




</Route>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/member-login" replace />} />
        </Routes>

        
      </BrowserRouter>

    </AuthProvider>
  )
}

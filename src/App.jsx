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
import WorkoutPlan from "./pages/WorkoutPlan";
import DietPlan from "./pages/DietPlan";
import MemberDietPlan from "./pages/MemberDietPlan";
import OnlineDietPlan from "./pages/OnlineDietPlan";
import MonthlyCheckin from "./pages/MonthlyCheckin";
import AddOnlineWorkout from "./pages/AddOnlineWorkout";
import OnlineWorkoutPlan from "./pages/OnlineWorkoutPlan";
import OnlinePerformance from "./pages/OnlinePerformance";
import OwnerOnlinePerformance from "./pages/OwnerOnlinePerformance";
import OnlineAssessment from "./pages/OnlineAssessment";
import OnlineTransformationTimeline from "./pages/OnlineTransformationTimeline";
import PaymentHistory from "./pages/PaymentHistory"


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
  path="/member-dashboard"
  element={
    <MemberProtectedRoute>
      <MemberDashboard />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/member-diet-plan"
  element={
    <MemberProtectedRoute>
      <MemberDietPlan />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/member-dashboard/workout-plan"
  element={
    <MemberProtectedRoute>
      <WorkoutPlan />
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
  path="/member-attendance"
  element={
    <MemberProtectedRoute>
      <MemberAttendance />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/member-dashboard/monthly-checkin"
  element={
    <MemberProtectedRoute>
      <MonthlyCheckin />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/online-dashboard/performance"
  element={<OnlinePerformance />}
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
  path="/online-dashboard/assessment"
  element={
    <MemberProtectedRoute>
      <OnlineAssessment />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/online-dashboard/transformation"
  element={<OnlineTransformationTimeline />}
/>

<Route
  path="/online-transformation-timeline"
  element={
    <MemberProtectedRoute>
      <OnlineTransformationTimeline />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/online-clients/:clientId/performance"
  element={
    <OwnerProtectedRoute>
      <OwnerOnlinePerformance />
    </OwnerProtectedRoute>
  }
/>


<Route
  path="/online-dashboard/diet"
  element={
    <MemberProtectedRoute>
      <OnlineDietPlan />
    </MemberProtectedRoute>
  }
/>

<Route
  path="/online-dashboard/workout"
  element={
    <MemberProtectedRoute>
      <OnlineWorkoutPlan />
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

<Route
  path="/website-management/contact"
  element={<WebsiteSettings />}
/>

<Route
  path="/online-clients/:clientId/diet-plan"
  element={
    <OwnerProtectedRoute>
      <DietPlan />
    </OwnerProtectedRoute>
  }
/>

<Route
  path="/members/:memberId/diet-plan"
  element={<DietPlan />}
/>

            <Route
  path="/body-assessment"
  element={<BodyAssessment />}
/>
<Route path="/online-clients/:id/timeline" element={<AssessmentTimeline/>} />
<Route
    path="/online-clients/:id"
    element={<OnlineClientProfile />}
/>

<Route
  path="/online-clients/:id/workout/add"
  element={<AddOnlineWorkout />}
/>

<Route
  path="/online-clients/:id/workout/:workoutId/edit"
  element={<AddOnlineWorkout />}
/>


            <Route path="/alerts" element={<Alerts />} />

            <Route
  path="/payment-history"
  element={<PaymentHistory />}
/>

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

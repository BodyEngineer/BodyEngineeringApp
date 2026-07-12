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
import OnlineClientDetail from './pages/OnlineClientDetail'
import AddAssessment from './pages/AddAssessment'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/member-login" element={<MemberLogin />} />

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/add" element={<AddMember />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/members/:id/edit" element={<EditMember />} />
            <Route path="/online-clients" element={<OnlineClients />} />
            <Route path="/online-clients/add" element={<AddOnlineClient />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/online-clients/:id" element={<OnlineClientDetail />} />
            <Route path="/online-clients/:id/add-assessment" element={<AddAssessment />} />
            <Route
  path="/body-assessment"
  element={<BodyAssessment />}
/>


            <Route path="/alerts" element={<Alerts />} />
          </Route>
          <Route path="/" element={<Navigate to="/member-login" replace />} />
          <Route path="*" element={<Navigate to="/member-login" replace />} />
        </Routes>
        
      </BrowserRouter>
    </AuthProvider>
  )
}

import MemberLogin from './pages/MemberLogin'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import AddMember from './pages/AddMember'
import EditMember from './pages/EditMember'
import MemberDetail from './pages/MemberDetail'
import Attendance from './pages/Attendance'
import Alerts from './pages/Alerts'
import MemberDashboard from './pages/MemberDashboard'
import BodyAssessment from './pages/BodyAssessment'
import MyTransformation from "./pages/MyTransformation";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/member-login" element={<MemberLogin />} />
          <Route
           path="/member-dashboard"
           element={<MemberDashboard />}
            />

<Route
  path="/member-dashboard/my-transformation"
  element={<MyTransformation />}
/>

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/add" element={<AddMember />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/members/:id/edit" element={<EditMember />} />
            <Route path="/attendance" element={<Attendance />} />
 

            <Route
  path="/body-assessment"
  element={<BodyAssessment />}
/>


            <Route path="/alerts" element={<Alerts />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
      </BrowserRouter>
    </AuthProvider>
  )
}

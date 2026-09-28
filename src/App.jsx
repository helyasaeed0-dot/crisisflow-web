import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import PortalLayout from './layouts/PortalLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Notifications from './pages/Notifications';
import CitizenHome from './pages/citizen/CitizenHome';
import ReportEmergency from './pages/citizen/ReportEmergency';
import TrackIncident from './pages/citizen/TrackIncident';
import MyReports from './pages/citizen/MyReports';
import ResponderHome from './pages/responder/ResponderHome';
import AssignmentDetail from './pages/responder/AssignmentDetail';
import AssignmentHistory from './pages/responder/AssignmentHistory';
import Dashboard from './pages/admin/Dashboard';
import Incidents from './pages/admin/Incidents';
import IncidentDetail from './pages/admin/IncidentDetail';
import LiveMap from './pages/admin/LiveMap';
import Responders from './pages/admin/Responders';
import Analytics from './pages/admin/Analytics';
import AiInsights from './pages/admin/AiInsights';
import DemoControl from './pages/admin/DemoControl';
import Users from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Citizen portal */}
            <Route
              path="/citizen"
              element={
                <ProtectedRoute roles={['CITIZEN']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CitizenHome />} />
              <Route path="report" element={<ReportEmergency />} />
              <Route path="reports" element={<MyReports />} />
              <Route path="track/:id" element={<TrackIncident />} />
            </Route>

            {/* Responder portal */}
            <Route
              path="/responder"
              element={
                <ProtectedRoute roles={['RESPONDER']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ResponderHome />} />
              <Route path="assignments/:id" element={<AssignmentDetail />} />
              <Route path="history" element={<AssignmentHistory />} />
            </Route>

            {/* Notifications for citizens and responders */}
            <Route
              element={
                <ProtectedRoute roles={['CITIZEN', 'RESPONDER']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* Command center */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="incidents/:id" element={<IncidentDetail />} />
              <Route path="map" element={<LiveMap />} />
              <Route path="responders" element={<Responders />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="insights" element={<AiInsights />} />
              <Route path="demo" element={<DemoControl />} />
              <Route path="notifications" element={<Notifications />} />

              {/* Super admin only */}
              <Route
                path="users"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
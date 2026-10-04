import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Home from './pages/Home';
import Rates from './pages/Rates';
import Login from './pages/Login';
import Register from './pages/Register';
import SchedulePickup from './pages/SchedulePickup';
import PickupTracking from './pages/PickupTracking';
import Receipt from './pages/Receipt';
import NotFound from './pages/NotFound';

import Dashboard from './pages/Dashboard';
import PickupHistory from './pages/PickupHistory';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';

import CollectorDashboard from './pages/CollectorDashboard';
import CollectorPickupDetails from './pages/CollectorPickupDetails';

import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminCollectors from './pages/AdminCollectors';
import AdminPickups from './pages/AdminPickups';
import AdminPrices from './pages/AdminPrices';
import AdminReports from './pages/AdminReports';

const customerLinks = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/pickups', label: 'Pickup history' },
  { to: '/addresses', label: 'Addresses' },
  { to: '/profile', label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Customers' },
  { to: '/admin/collectors', label: 'Collectors' },
  { to: '/admin/pickups', label: 'Pickups' },
  { to: '/admin/prices', label: 'Prices' },
  { to: '/admin/reports', label: 'Reports' },
];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/rates" element={<Rates />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/schedule-pickup" element={<SchedulePickup />} />
            <Route
              path="/pickups/:id"
              element={
                <ProtectedRoute>
                  <PickupTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipt/:id"
              element={
                <ProtectedRoute>
                  <Receipt />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            element={
              <ProtectedRoute roles={['customer']}>
                <DashboardLayout links={customerLinks} />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pickups" element={<PickupHistory />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route
            path="/collector"
            element={
              <ProtectedRoute roles={['collector']}>
                <CollectorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collector/pickups/:id"
            element={
              <ProtectedRoute roles={['collector']}>
                <CollectorPickupDetails />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout links={adminLinks} />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/collectors" element={<AdminCollectors />} />
            <Route path="/admin/pickups" element={<AdminPickups />} />
            <Route path="/admin/prices" element={<AdminPrices />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

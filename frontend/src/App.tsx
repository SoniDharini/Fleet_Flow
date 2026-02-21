import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Fuel from './pages/Fuel';
import Drivers from './pages/Drivers';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';

import Register from './pages/Register';

const RoleGuard = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const activeRole = localStorage.getItem('activeRole');
  if (!activeRole) return <Navigate to="/login" replace />;
  if (activeRole === 'manager' || allowedRoles.includes(activeRole)) {
    return <Outlet />;
  }
  return <Navigate to={`/${activeRole}/dashboard`} replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />

          <Route path="manager/dashboard" element={<RoleGuard allowedRoles={['manager']} />}><Route index element={<Dashboard />} /></Route>
          <Route path="dispatcher/dashboard" element={<RoleGuard allowedRoles={['dispatcher']} />}><Route index element={<Dashboard />} /></Route>
          <Route path="safety/dashboard" element={<RoleGuard allowedRoles={['safety']} />}><Route index element={<Dashboard />} /></Route>
          <Route path="finance/dashboard" element={<RoleGuard allowedRoles={['finance']} />}><Route index element={<Dashboard />} /></Route>

          <Route element={<RoleGuard allowedRoles={['dispatcher', 'safety', 'finance']} />}><Route path="vehicles" element={<Vehicles />} /></Route>
          <Route element={<RoleGuard allowedRoles={['dispatcher', 'safety', 'finance']} />}><Route path="trips" element={<Trips />} /></Route>
          <Route element={<RoleGuard allowedRoles={['finance']} />}><Route path="maintenance" element={<Maintenance />} /></Route>
          <Route element={<RoleGuard allowedRoles={['finance']} />}><Route path="fuel" element={<Fuel />} /></Route>
          <Route element={<RoleGuard allowedRoles={['dispatcher', 'safety', 'finance']} />}><Route path="drivers" element={<Drivers />} /></Route>
          <Route element={<RoleGuard allowedRoles={['finance']} />}><Route path="analytics" element={<Analytics />} /></Route>

          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehiclesList from './pages/VehiclesList';
import VehicleForm from './pages/VehicleForm';
import Services from './pages/Services';
import Appointments from './pages/Appointments';
import ServiceOrders from './pages/ServiceOrders';
import VehicleDetails from './pages/VehicleDetails';
import RenewalDues from './pages/RenewalDues';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<VehiclesList />} />
          <Route path="/vehicles/add" element={<VehicleForm />} />
          <Route path="/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/vehicles/edit/:id" element={<VehicleForm />} />
          <Route path="/services" element={<Services />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/service-orders" element={<ServiceOrders />} />
          <Route path="/renewal-dues" element={<RenewalDues />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
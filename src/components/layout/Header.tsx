import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Function to get page title and subtitle based on current route
  const getPageInfo = () => {
    const path = location.pathname;
    
    if (path === '/dashboard') {
      return { title: 'Dashboard', subtitle: 'Welcome back to RTA Agent Portal' };
    } else if (path === '/vehicles') {
      return { title: 'Vehicles', subtitle: 'Manage all registered vehicles' };
    } else if (path === '/vehicles/add') {
      return { title: 'Add New Vehicle', subtitle: 'Enter vehicle registration details' };
    } else if (path.startsWith('/vehicles/edit/')) {
      return { title: 'Edit Vehicle', subtitle: 'Update vehicle registration details' };
    } else if (path.startsWith('/vehicles/') && path !== '/vehicles/add') {
      return { title: 'Vehicle Details', subtitle: 'View complete vehicle information' };
    } else if (path === '/services') {
      return { title: 'Services', subtitle: 'Book RTA services for your vehicle' };
    } else if (path === '/service-orders') {
      return { title: 'Service Orders', subtitle: 'Manage and track service orders' };
    } else if (path === '/appointments') {
      return { title: 'Appointments', subtitle: 'Manage service appointments' };
    } else if (path === '/renewal-dues') {
      return { title: 'Renewal Dues', subtitle: 'Track and manage upcoming renewals' };
    } else if (path === '/reports') {
      return { title: 'Reports & Analytics', subtitle: 'Generate comprehensive reports for vehicles, services, and revenue' };
    } else if (path === '/users') {
      return { title: 'Users', subtitle: 'Manage system users and permissions' };
    } else if (path === '/settings') {
      return { title: 'Settings', subtitle: 'Configure system preferences' };
    } else {
      return { title: 'RTA Agent Portal', subtitle: 'Road Transport Authority Management System' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 fixed top-0 right-0 left-0 lg:left-64 z-20 shadow">
      <div className="flex items-center flex-1 min-w-0 ml-12 lg:ml-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{title}</h1>
          <p className="text-xs sm:text-sm text-gray-600 truncate hidden sm:block">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
        <button className="relative p-2 rounded-full hover:bg-blue-50 transition">
          <Bell size={20} sm:size={22} className="text-blue-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow">
            <User size={18} sm:size={22} />
          </span>
          <span className="font-semibold text-gray-700 text-sm sm:text-base hidden sm:inline">{user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
// frontend/src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, Search, User, LogOut, Settings, ChevronDown, Home } from 'lucide-react';
import { getInitials } from '../../utils/formatters';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/complaints?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const notifications = [
    { id: 1, type: 'complaint', message: 'New complaint assigned to you', time: '5m ago' },
    { id: 2, type: 'inventory', message: 'Low stock alert: Compressor 1 Ton', time: '1h ago' },
    { id: 3, type: 'invoice', message: 'Invoice #RWP-2026-000123 paid', time: '2h ago' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 h-16 flex-shrink-0">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Left Section */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo - Hidden on desktop (shown in sidebar), visible on mobile */}
            <div className="flex items-center ml-4 lg:ml-0">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity lg:hidden"
              >
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SC</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900">SalesCare</h1>
                  <p className="text-xs text-gray-500">Service Center</p>
                </div>
              </button>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search complaints, invoices, customers..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </form>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Dashboard Button - Mobile */}
            <button
              onClick={() => navigate('/dashboard')}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              title="Go to Dashboard"
            >
              <Home className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 animate-slide-down">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                        >
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-gray-200">
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(user?.full_name)}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 animate-slide-down">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3 border-t border-gray-200">
        <form onSubmit={handleSearch} className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search complaints..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
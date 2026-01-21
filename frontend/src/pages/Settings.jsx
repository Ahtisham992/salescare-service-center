
// frontend/src/pages/Settings.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.full_name || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.username || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || 'Not set'}
                  readOnly
                />
              </div>
              <div>
                <label className="form-label">Role</label>
                <input
                  type="text"
                  className="form-input capitalize"
                  value={user?.role || ''}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <p className="text-sm text-gray-600 mb-4">
              Password change functionality - Coming soon
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">User ID</span>
                <span className="font-medium">{user?.user_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
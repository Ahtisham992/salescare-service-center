// frontend/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import Invoices from "./pages/Invoices";
import DeliveryOrders from "./pages/DeliveryOrders"; // <--- NEW IMPORT
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MaterialRequisitions from "./pages/MaterialRequisitions";
import PurchaseOrders from "./pages/PurchaseOrders";
import GoodsReceipts from "./pages/GoodsReceipts";
import Vendors from "./pages/Vendors";

// Layout
import MainLayout from "./components/layout/MainLayout";
import MasterData from "./pages/MasterData";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard - All authenticated users */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* Complaints - All authenticated users */}
              <Route path="complaints" element={<Complaints />} />

              {/* Delivery Orders - Admin, Manager, Receptionist */}
              <Route
                path="delivery-orders"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "manager", "receptionist"]}
                  >
                    <DeliveryOrders />
                  </ProtectedRoute>
                }
              />

              {/* Vendors - Admin, Manager */}
              <Route
                path="vendors"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <Vendors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/master-data"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <MasterData />
                  </ProtectedRoute>
                }
              />
              {/* Goods Receipts - Admin, Manager */}
              <Route
                path="goods-receipts"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <GoodsReceipts />
                  </ProtectedRoute>
                }
              />

              {/* Purchase Orders - Admin, Manager */}
              <Route
                path="purchase-orders"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <PurchaseOrders />
                  </ProtectedRoute>
                }
              />

              {/* Invoices - All authenticated users */}
              <Route path="invoices" element={<Invoices />} />

              {/* Inventory - All authenticated users */}
              <Route path="inventory" element={<Inventory />} />

              {/* Reports - Admin and Manager only */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route path="requisitions" element={<MaterialRequisitions />} />

              {/* Settings - All authenticated users */}
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* 404 Not Found */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">
                      404
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <a href="/dashboard" className="btn btn-primary">
                      Go to Dashboard
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </Router>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#363636",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

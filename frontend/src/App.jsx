// frontend/src/App.jsx - UPDATED WITH ALL ROUTES
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
import DeliveryOrders from "./pages/DeliveryOrders";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MaterialRequisitions from "./pages/MaterialRequisitions";
import PurchaseOrders from "./pages/PurchaseOrders";
import GoodsReceipts from "./pages/GoodsReceipts";
import Vendors from "./pages/Vendors";
import MasterData from "./pages/MasterData";
import ServiceTariffs from "./pages/ServiceTariffs";
import OperationalAreas from "./pages/OperationalAreas"; // <--- NEW IMPORT

// Layout
import MainLayout from "./components/layout/MainLayout";
import Approvals from "./pages/Approvals";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
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
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* Complaints */}
              <Route path="complaints" element={<Complaints />} />

              {/* Delivery Orders */}
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

              {/* Invoices */}
              <Route path="invoices" element={<Invoices />} />

              {/* Material Requisitions */}
              <Route path="requisitions" element={<MaterialRequisitions />} />

              {/* Inventory */}
              <Route path="inventory" element={<Inventory />} />

              {/* Purchase Orders */}
              <Route
                path="purchase-orders"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <PurchaseOrders />
                  </ProtectedRoute>
                }
              />

              {/* Goods Receipts */}
              <Route
                path="goods-receipts"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <GoodsReceipts />
                  </ProtectedRoute>
                }
              />

              {/* Vendors */}
              <Route
                path="vendors"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <Vendors />
                  </ProtectedRoute>
                }
              />

              {/* Master Data Hub */}
              <Route
                path="master-data"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <MasterData />
                  </ProtectedRoute>
                }
              />

              {/* Service Tariffs */}
              <Route
                path="master-data/tariffs"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <ServiceTariffs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="approvals"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <Approvals />
                  </ProtectedRoute>
                }
              />

              {/* Operational Areas - NEW ROUTE */}
              <Route
                path="operational-areas"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <OperationalAreas />
                  </ProtectedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Settings */}
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

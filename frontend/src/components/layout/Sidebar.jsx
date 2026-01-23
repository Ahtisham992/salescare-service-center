// frontend/src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Package,
  BarChart3,
  ClipboardList,
  Settings,
  X,
  ChevronRight,
  Truck,
  ShoppingCart,
  Users,
  Package2,
  Database, // <--- NEW IMPORT
} from "lucide-react";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, hasRole } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "manager", "technician", "receptionist"],
    },
    {
      name: "Complaints",
      href: "/complaints",
      icon: FileText,
      roles: ["admin", "manager", "technician", "receptionist"],
    },
    {
      name: "Delivery Orders",
      href: "/delivery-orders",
      icon: Truck,
      roles: ["admin", "manager", "receptionist"],
    },
    {
      name: "Invoices",
      href: "/invoices",
      icon: Receipt,
      roles: ["admin", "manager", "receptionist"],
    },
    {
      name: "Requisitions",
      href: "/requisitions",
      icon: ClipboardList,
      roles: ["admin", "manager", "technician"],
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: Package,
      roles: ["admin", "manager", "technician"],
    },
    {
      name: "Purchase Orders",
      href: "/purchase-orders",
      icon: ShoppingCart,
      roles: ["admin", "manager"],
    },
    {
      name: "Goods Receipts",
      href: "/goods-receipts",
      icon: Package2,
      roles: ["admin", "manager"],
    },
    {
      name: "Vendors",
      href: "/vendors",
      icon: Users,
      roles: ["admin", "manager"],
    },
    {
      name: "Master Data", // <--- NEW ITEM
      href: "/master-data",
      icon: Database,
      roles: ["admin", "manager"],
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["admin", "manager"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin", "manager", "technician", "receptionist"],
    },
  ];

  const filteredNavigation = navigation.filter((item) => hasRole(item.roles));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 flex-shrink-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SC</span>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold text-gray-900">SalesCare</h1>
                <p className="text-xs text-gray-500">Service Center</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-200 lg:hidden flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {filteredNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`w-5 h-5 mr-3 transition-colors flex-shrink-0 ${
                          isActive
                            ? "text-primary-600"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <div className="text-xs text-gray-500 text-center">
              <p>© 2026 SalesCare</p>
              <p className="mt-1">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
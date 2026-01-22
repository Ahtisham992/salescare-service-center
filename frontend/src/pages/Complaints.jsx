// frontend/src/pages/Complaints.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import complaintService from "../services/complaintService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/common/DataTable";
import Modal, { ModalFooter } from "../components/common/Modal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  FileText,
  ArrowLeft,
  Download,
  Save,
  UserCheck,
  Clock,
} from "lucide-react";
import {
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getPriorityColor,
  getWarrantyColor,
} from "../utils/formatters";

const Complaints = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    warranty_status: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    customer_id: "",
    product_id: "",
    serial_number: "",
    warranty_status: "Out of Warranty",
    purchase_date: "",
    complaint_type: "",
    complaint_description: "",
    priority: "Medium",
    area_id: "1",
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/customers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch technicians (for assignment)
  const { data: techniciansData } = useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch technicians");
      const result = await response.json();
      // Filter only technicians
      const techs = result.data.users.filter(u => u.role === 'technician' && u.is_active);
      return { data: { technicians: techs } };
    },
    enabled: hasRole(['admin', 'manager']), // Only fetch for admin/manager
    staleTime: 5 * 60 * 1000,
  });

  // Build query params - only include non-empty filters
  const queryParams = {
    page: currentPage,
    limit: 10,
  };

  // Only add filters if they have actual values
  if (debouncedSearch && debouncedSearch.trim()) {
    queryParams.search = debouncedSearch;
  }
  if (filters.status && filters.status !== "") {
    queryParams.status = filters.status;
  }
  if (filters.priority && filters.priority !== "") {
    queryParams.priority = filters.priority;
  }
  if (filters.warranty_status && filters.warranty_status !== "") {
    queryParams.warranty_status = filters.warranty_status;
  }

  // Fetch complaints
  const { data, isLoading, error } = useQuery({
    queryKey: ["complaints", queryParams],
    queryFn: () => complaintService.getAll(queryParams),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => complaintService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["complaints"]);
      toast.success("Complaint created successfully");
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create complaint");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => complaintService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["complaints"]);
      toast.success("Complaint updated successfully");
      setShowEditModal(false);
      setSelectedComplaint(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update complaint");
    },
  });

  // Assign technician mutation
  const assignMutation = useMutation({
    mutationFn: ({ id, technicianId }) => 
      complaintService.assignTechnician(id, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries(["complaints"]);
      toast.success("Technician assigned successfully");
      setShowAssignModal(false);
      setSelectedComplaint(null);
      setSelectedTechnician("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to assign technician");
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => complaintService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["complaints"]);
      toast.success("Status updated successfully");
      setShowStatusModal(false);
      setSelectedComplaint(null);
      setSelectedStatus("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => complaintService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["complaints"]);
      toast.success("Complaint deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete complaint");
    },
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setShowViewModal(true);
  };

  const handleEdit = (complaint) => {
    setSelectedComplaint(complaint);
    setFormData({
      customer_id: complaint.customer_id || "",
      product_id: complaint.product_id || "",
      serial_number: complaint.serial_number || "",
      warranty_status: complaint.warranty_status || "Out of Warranty",
      purchase_date: complaint.purchase_date || "",
      complaint_type: complaint.complaint_type || "",
      complaint_description: complaint.complaint_description || "",
      priority: complaint.priority || "Medium",
      area_id: complaint.area_id || "1",
    });
    setShowEditModal(true);
  };

  const handleAssign = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedTechnician(complaint.technician_id || "");
    setShowAssignModal(true);
  };

  const handleStatusChange = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedStatus(complaint.status || "");
    setShowStatusModal(true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      warranty_status: "",
    });
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      product_id: "",
      serial_number: "",
      warranty_status: "Out of Warranty",
      purchase_date: "",
      complaint_type: "",
      complaint_description: "",
      priority: "Medium",
      area_id: "1",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedComplaint) {
      updateMutation.mutate({
        id: selectedComplaint.complaint_id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedTechnician) {
      toast.error("Please select a technician");
      return;
    }
    assignMutation.mutate({
      id: selectedComplaint.complaint_id,
      technicianId: selectedTechnician,
    });
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }
    statusMutation.mutate({
      id: selectedComplaint.complaint_id,
      status: selectedStatus,
    });
  };

  const handleDownloadPDF = async (complaint) => {
    try {
      toast.success("Preparing download...");

      const pdfContent = `
COMPLAINT RECEIPT
=====================================

Complaint #: ${complaint.complaint_number}
Date: ${formatDate(complaint.complaint_date)}
Status: ${complaint.status}

CUSTOMER INFORMATION
-------------------------------------
Name: ${complaint.customer_name}
Phone: ${complaint.customer_phone}
Address: ${complaint.customer_address || 'N/A'}

PRODUCT INFORMATION
-------------------------------------
Product: ${complaint.product_name}
Serial Number: ${complaint.serial_number || "N/A"}
Warranty: ${complaint.warranty_status}

COMPLAINT DETAILS
-------------------------------------
Type: ${complaint.complaint_type || "N/A"}
Priority: ${complaint.priority}
Description: ${complaint.complaint_description}

TECHNICIAN
-------------------------------------
Assigned To: ${complaint.technician_name || 'Not Assigned'}

=====================================
Generated: ${new Date().toLocaleString()}
      `;

      const blob = new Blob([pdfContent], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Complaint_${complaint.complaint_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Complaint receipt downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download complaint details");
    }
  };

  // Table columns
  const columns = [
    {
      header: "Complaint #",
      accessor: "complaint_number",
      render: (row) => (
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">
            {row.complaint_number}
          </span>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: "customer_name",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name}</div>
          <div className="text-sm text-gray-500">{row.customer_phone}</div>
        </div>
      ),
    },
    {
      header: "Product",
      accessor: "product_name",
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{row.product_name}</div>
          {row.serial_number && (
            <div className="text-xs text-gray-500">S/N: {row.serial_number}</div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className={`badge badge-${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Priority",
      accessor: "priority",
      render: (row) => (
        <span className={`badge badge-${getPriorityColor(row.priority)}`}>
          {row.priority}
        </span>
      ),
    },
    {
      header: "Warranty",
      accessor: "warranty_status",
      render: (row) => (
        <span className={`badge badge-${getWarrantyColor(row.warranty_status)}`}>
          {row.warranty_status}
        </span>
      ),
    },
    {
      header: "Technician",
      accessor: "technician_name",
      render: (row) => (
        <div className="text-sm">
          {row.technician_name || (
            <span className="text-gray-400 italic">Not Assigned</span>
          )}
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "complaint_date",
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">
            {formatDate(row.complaint_date)}
          </div>
          <div className="text-xs text-gray-500">
            {formatRelativeTime(row.complaint_date)}
          </div>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {hasRole(["admin", "manager", "receptionist"]) && (
            <button
              onClick={() => handleEdit(row)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit Complaint"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {hasRole(["admin", "manager"]) && (
            <button
              onClick={() => handleAssign(row)}
              className="p-2 text-green-600 hover:bg-green-50 rounded"
              title="Assign Technician"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleStatusChange(row)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
            title="Update Status"
          >
            <Clock className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDownloadPDF(row)}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

          {hasRole(["admin"]) && (
            <button
              onClick={() => handleDelete(row.complaint_id)}
              className="p-2 text-danger-600 hover:bg-danger-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const complaints = data?.data?.complaints || [];
  const pagination = data?.data?.pagination || {};
  const customers = Array.isArray(customersData?.data?.customers)
    ? customersData.data.customers
    : [];
  const products = Array.isArray(productsData?.data?.products)
    ? productsData.data.products
    : [];
  const technicians = Array.isArray(techniciansData?.data?.technicians)
    ? techniciansData.data.technicians
    : [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">
            Manage customer service complaints and track resolutions
          </p>
        </div>

        {hasRole(["admin", "manager", "receptionist"]) && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Complaint
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by complaint #, customer name, phone..."
              value={searchTerm}
              onChange={handleSearch}
              className="form-input pl-10 w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? "btn-primary" : "btn-outline"} flex items-center`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>

            {(filters.status || filters.priority || filters.warranty_status || searchTerm) && (
              <button
                onClick={clearFilters}
                className="btn btn-outline flex items-center text-danger-600 border-danger-600 hover:bg-danger-50"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="form-label">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="form-input"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="form-label">Warranty Status</label>
              <select
                value={filters.warranty_status}
                onChange={(e) =>
                  handleFilterChange("warranty_status", e.target.value)
                }
                className="form-input"
              >
                <option value="">All Types</option>
                <option value="In Warranty">In Warranty</option>
                <option value="Out of Warranty">Out of Warranty</option>
                <option value="Contract Warranty">Contract Warranty</option>
                <option value="Contract Paid">Contract Paid</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={complaints}
          pagination={pagination}
          onPageChange={setCurrentPage}
          loading={isLoading}
          emptyMessage="No complaints found. Create your first complaint to get started."
        />
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <Modal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedComplaint(null);
            resetForm();
          }}
          title={selectedComplaint ? "Edit Complaint" : "Create New Complaint"}
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              {customersLoading || productsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                  <p className="text-gray-500 mt-2">Loading form data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {selectedComplaint && (
                    <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Customer, Product, Warranty Status, Serial Number, and Purchase Date cannot be changed after complaint creation.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="form-label">Customer *</label>
                    <select
                      value={formData.customer_id}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_id: e.target.value })
                      }
                      className="form-input"
                      required
                      disabled={selectedComplaint} // Disabled when editing
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.customer_id} value={customer.customer_id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                    {selectedComplaint && (
                      <p className="text-xs text-gray-500 mt-1">
                        🔒 Locked after creation
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Product *</label>
                    <select
                      value={formData.product_id}
                      onChange={(e) =>
                        setFormData({ ...formData, product_id: e.target.value })
                      }
                      className="form-input"
                      required
                      disabled={selectedComplaint} // Disabled when editing
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.product_id} value={product.product_id}>
                          {product.product_name}
                        </option>
                      ))}
                    </select>
                    {selectedComplaint && (
                      <p className="text-xs text-gray-500 mt-1">
                        🔒 Locked after creation
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) =>
                        setFormData({ ...formData, serial_number: e.target.value })
                      }
                      className="form-input"
                      placeholder="e.g., ABC123456"
                      disabled={selectedComplaint} // Disabled when editing
                    />
                    {selectedComplaint && (
                      <p className="text-xs text-gray-500 mt-1">
                        🔒 Locked after creation
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Warranty Status *</label>
                    <select
                      value={formData.warranty_status}
                      onChange={(e) =>
                        setFormData({ ...formData, warranty_status: e.target.value })
                      }
                      className="form-input"
                      required
                      disabled={selectedComplaint} // Disabled when editing
                    >
                      <option value="In Warranty">In Warranty</option>
                      <option value="Out of Warranty">Out of Warranty</option>
                      <option value="Contract Warranty">Contract Warranty</option>
                      <option value="Contract Paid">Contract Paid</option>
                    </select>
                    {selectedComplaint && (
                      <p className="text-xs text-gray-500 mt-1">
                        🔒 Locked after creation
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) =>
                        setFormData({ ...formData, purchase_date: e.target.value })
                      }
                      className="form-input"
                      disabled={selectedComplaint} // Disabled when editing
                    />
                    {selectedComplaint && (
                      <p className="text-xs text-gray-500 mt-1">
                        🔒 Locked after creation
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Priority *</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="form-input"
                      required
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="form-label">Complaint Type</label>
                    <input
                      type="text"
                      value={formData.complaint_type}
                      onChange={(e) =>
                        setFormData({ ...formData, complaint_type: e.target.value })
                      }
                      className="form-input"
                      placeholder="e.g., Not Cooling, Making Noise"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="form-label">Description *</label>
                    <textarea
                      value={formData.complaint_description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          complaint_description: e.target.value,
                        })
                      }
                      className="form-input"
                      rows="4"
                      placeholder="Describe the issue in detail..."
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedComplaint(null);
                  resetForm();
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center"
                disabled={
                  createMutation.isLoading ||
                  updateMutation.isLoading ||
                  customersLoading ||
                  productsLoading
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {selectedComplaint ? "Update" : "Create"} Complaint
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* Assign Technician Modal */}
      {showAssignModal && selectedComplaint && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedComplaint(null);
            setSelectedTechnician("");
          }}
          title="Assign Technician"
          size="md"
        >
          <form onSubmit={handleAssignSubmit}>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Complaint: {selectedComplaint.complaint_number}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedComplaint.complaint_description}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Current Status: <span className={`badge badge-${getStatusColor(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </p>
              </div>

              <div>
                <label className="form-label">Select Technician *</label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Choose a technician...</option>
                  {technicians.map((tech) => (
                    <option key={tech.user_id} value={tech.user_id}>
                      {tech.full_name} {tech.phone && `- ${tech.phone}`}
                    </option>
                  ))}
                </select>
                {technicians.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No active technicians available
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> If status is "Open", it will automatically change to "Assigned"
                </p>
              </div>
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedComplaint(null);
                  setSelectedTechnician("");
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center"
                disabled={assignMutation.isLoading || !selectedTechnician}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Assign Technician
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedComplaint && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedComplaint(null);
            setSelectedStatus("");
          }}
          title="Update Complaint Status"
          size="md"
        >
          <form onSubmit={handleStatusSubmit}>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Complaint: {selectedComplaint.complaint_number}
                </h4>
                <p className="text-sm text-gray-600">
                  Customer: {selectedComplaint.customer_name}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Current Status: <span className={`badge badge-${getStatusColor(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </p>
              </div>

              <div>
                <label className="form-label">New Status *</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select new status...</option>
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {selectedStatus === 'Completed' && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Note:</strong> Completion date will be automatically set to now
                  </p>
                </div>
              )}
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedComplaint(null);
                  setSelectedStatus("");
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center"
                disabled={statusMutation.isLoading || !selectedStatus}
              >
                <Clock className="w-4 h-4 mr-2" />
                Update Status
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {showViewModal && selectedComplaint && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedComplaint(null);
          }}
          title="Complaint Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Complaint #
                </label>
                <p className="text-gray-900 mt-1 font-semibold">
                  {selectedComplaint.complaint_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <p className="text-gray-900 mt-1">
                  {formatDate(selectedComplaint.complaint_date)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <span
                    className={`badge badge-${getStatusColor(selectedComplaint.status)}`}
                  >
                    {selectedComplaint.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Priority
                </label>
                <div className="mt-1">
                  <span
                    className={`badge badge-${getPriorityColor(selectedComplaint.priority)}`}
                  >
                    {selectedComplaint.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Customer Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900 mt-1">
                    {selectedComplaint.customer_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900 mt-1">
                    {selectedComplaint.customer_phone}
                  </p>
                </div>
                {selectedComplaint.customer_address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      Address
                    </label>
                    <p className="text-gray-900 mt-1">
                      {selectedComplaint.customer_address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Product Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Product
                  </label>
                  <p className="text-gray-900 mt-1">
                    {selectedComplaint.product_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Serial Number
                  </label>
                  <p className="text-gray-900 mt-1">
                    {selectedComplaint.serial_number || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Warranty Status
                  </label>
                  <div className="mt-1">
                    <span
                      className={`badge badge-${getWarrantyColor(selectedComplaint.warranty_status)}`}
                    >
                      {selectedComplaint.warranty_status}
                    </span>
                  </div>
                </div>
                {selectedComplaint.purchase_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Purchase Date
                    </label>
                    <p className="text-gray-900 mt-1">
                      {formatDate(selectedComplaint.purchase_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedComplaint.technician_name && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Assigned Technician
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900 font-medium">
                    {selectedComplaint.technician_name}
                  </p>
                  {selectedComplaint.technician_phone && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedComplaint.technician_phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Complaint Details
              </h4>
              {selectedComplaint.complaint_type && (
                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900 mt-1">
                    {selectedComplaint.complaint_type}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Description
                </label>
                <p className="text-gray-700 mt-1">
                  {selectedComplaint.complaint_description ||
                    "No description provided"}
                </p>
              </div>
            </div>

            {(selectedComplaint.scheduled_date || selectedComplaint.completion_date) && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedComplaint.scheduled_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Scheduled Date
                      </label>
                      <p className="text-gray-900 mt-1">
                        {formatDate(selectedComplaint.scheduled_date)}
                      </p>
                    </div>
                  )}
                  {selectedComplaint.completion_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Completed Date
                      </label>
                      <p className="text-gray-900 mt-1">
                        {formatDate(selectedComplaint.completion_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <ModalFooter>
            <button
              onClick={() => handleDownloadPDF(selectedComplaint)}
              className="btn btn-outline flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={() => setShowViewModal(false)}
              className="btn btn-primary"
            >
              Close
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};

export default Complaints;
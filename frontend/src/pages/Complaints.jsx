// ============================================
// 4. Main Complaints.jsx (Refactored)
// ============================================
// This is your new simplified Complaints.jsx

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import complaintService from "../services/complaintService";
import { useAuth } from "../context/AuthContext";
import ComplaintFilters from "../components/complaints/ComplaintFilters";
import ComplaintTable from "../components/complaints/ComplaintTable";
import CreateComplaintModal from "../components/complaints/CreateComplaintModal";
import EditComplaintModal from "../components/complaints/EditComplaintModal";
import ViewComplaintModal from "../components/complaints/ViewComplaintModal";
import AssignTechnicianModal from "../components/complaints/AssignTechnicianModal";
import UpdateStatusModal from "../components/complaints/UpdateStatusModal";
import toast from "react-hot-toast";
import { Plus, ArrowLeft } from "lucide-react";

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: 10,
  };

  if (debouncedSearch?.trim()) queryParams.search = debouncedSearch;
  if (filters.status) queryParams.status = filters.status;
  if (filters.priority) queryParams.priority = filters.priority;
  if (filters.warranty_status) queryParams.warranty_status = filters.warranty_status;

  // Fetch complaints
  const { data, isLoading } = useQuery({
    queryKey: ["complaints", queryParams],
    queryFn: () => complaintService.getAll(queryParams),
  });

  const complaints = data?.data?.complaints || [];
  const pagination = data?.data?.pagination || {};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: "", priority: "", warranty_status: "" });
    setSearchTerm("");
    setDebouncedSearch("");
  };

  const hasActiveFilters = filters.status || filters.priority || filters.warranty_status || searchTerm;

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setShowViewModal(true);
  };

  const handleEdit = (complaint) => {
    setSelectedComplaint(complaint);
    setShowEditModal(true);
  };

  const handleAssign = (complaint) => {
    setSelectedComplaint(complaint);
    setShowAssignModal(true);
  };

  const handleStatusChange = (complaint) => {
    setSelectedComplaint(complaint);
    setShowStatusModal(true);
  };

  const handleDownloadPDF = async (complaint) => {
    // ... existing download logic
    toast.success("Complaint receipt downloaded");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      try {
        await complaintService.delete(id);
        queryClient.invalidateQueries(["complaints"]);
        toast.success("Complaint deleted successfully");
      } catch (error) {
        toast.error("Failed to delete complaint");
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
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
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Complaint
          </button>
        )}
      </div>

      {/* Filters */}
      <ComplaintFilters
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table */}
      <ComplaintTable
        complaints={complaints}
        pagination={pagination}
        loading={isLoading}
        onPageChange={setCurrentPage}
        onView={handleView}
        onEdit={handleEdit}
        onAssign={handleAssign}
        onStatusChange={handleStatusChange}
        onDownload={handleDownloadPDF}
        onDelete={handleDelete}
        hasRole={hasRole}
      />

      {/* Modals */}
      <CreateComplaintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => queryClient.invalidateQueries(["complaints"])}
      />

      <EditComplaintModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
        onSuccess={() => queryClient.invalidateQueries(["complaints"])}
      />

      <ViewComplaintModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
        onDownload={handleDownloadPDF}
      />

      <AssignTechnicianModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
        onSuccess={() => queryClient.invalidateQueries(["complaints"])}
      />

      <UpdateStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
        onSuccess={() => queryClient.invalidateQueries(["complaints"])}
      />
    </div>
  );
};

export default Complaints;
// frontend/src/components/complaints/ComplaintFormFields.jsx
import React, { useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import { toast } from "react-hot-toast";
import { Plus, X, Save, Search, Check } from "lucide-react";
import api from "../../services/api"; // <--- CORRECT IMPORT FOR AUTH/PORT HANDLING

const ComplaintFormFields = ({
  formData,
  setFormData,
  customers,
  products,
  customersLoading,
  isEditing = false,
  onCustomerCreated, // Callback to refresh parent list
}) => {
  // Search State
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // New Customer Form State
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    cnic: "",
  });

  // Filter logic for search
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      (c.cnic && c.cnic.includes(customerSearch)),
  );

  // --- HANDLER: Create New Customer ---
  const handleCreateCustomer = async () => {
    // 1. Validation
    if (
      !newCustomerData.name ||
      !newCustomerData.phone ||
      !newCustomerData.email
    ) {
      toast.error("Name, Phone and Email are required");
      return;
    }

    setCreateLoading(true);
    try {
      // 2. API Call (Uses api.js to handle Token and Port 5000)
      const response = await api.post("/customers", newCustomerData);
      const result = response.data;

      if (result.success) {
        toast.success("Customer created successfully!");

        // 3. Update the Main Form with the new ID
        setFormData((prev) => ({
          ...prev,
          customer_id: result.data.customer_id,
        }));

        // 4. Update Search UI to show the new customer is selected
        setCustomerSearch(`${result.data.name} - ${result.data.phone}`);

        // 5. Reset UI states
        setShowNewCustomerForm(false);
        setShowCustomerDropdown(false);
        setNewCustomerData({
          name: "",
          email: "",
          phone: "",
          address: "",
          cnic: "",
        });

        // 6. Refresh parent list if callback provided
        if (onCustomerCreated) onCustomerCreated(result.data);
      }
    } catch (error) {
      console.error("Create customer error:", error);
      const message =
        error.response?.data?.message || "Failed to create customer";
      toast.error(message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {isEditing && (
        <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Customer, Product, Warranty Status, Serial
            Number, and Purchase Date cannot be changed after complaint
            creation.
          </p>
        </div>
      )}

      {/* ================= CUSTOMER FIELD (Search + Create) ================= */}
      <div className="col-span-2 md:col-span-1">
        <div className="flex justify-between items-center mb-1">
          <label className="form-label mb-0">Customer *</label>
          {!isEditing && !showNewCustomerForm && (
            <button
              type="button"
              onClick={() => {
                setShowNewCustomerForm(true);
                setShowCustomerDropdown(false);
                setCustomerSearch(""); // Clear search to avoid confusion
              }}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center bg-primary-50 px-2 py-1 rounded transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" /> New Customer
            </button>
          )}
        </div>

        {isEditing ? (
          // LOCKED VIEW (EDIT MODE)
          <select
            value={formData.customer_id}
            className="form-input bg-gray-50"
            disabled
          >
            <option value={formData.customer_id}>
              {customers.find((c) => c.customer_id === formData.customer_id)
                ?.name || "Selected Customer"}
            </option>
          </select>
        ) : showNewCustomerForm ? (
          // CREATE NEW CUSTOMER FORM
          <div className="bg-white p-4 rounded-lg border-2 border-primary-100 shadow-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <span className="text-sm font-bold text-gray-800 flex items-center">
                <Plus className="w-4 h-4 mr-1 text-primary-600" /> Add New
                Customer
              </span>
              <button
                onClick={() => setShowNewCustomerForm(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newCustomerData.name}
                  onChange={(e) =>
                    setNewCustomerData({
                      ...newCustomerData,
                      name: e.target.value,
                    })
                  }
                  className="form-input text-sm col-span-2"
                />

                <input
                  type="email"
                  placeholder="Email Address *"
                  value={newCustomerData.email}
                  onChange={(e) =>
                    setNewCustomerData({
                      ...newCustomerData,
                      email: e.target.value,
                    })
                  }
                  className="form-input text-sm"
                  required
                />

                <input
                  type="text"
                  placeholder="Phone *"
                  value={newCustomerData.phone}
                  onChange={(e) =>
                    setNewCustomerData({
                      ...newCustomerData,
                      phone: e.target.value,
                    })
                  }
                  className="form-input text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="CNIC (Opt)"
                  value={newCustomerData.cnic}
                  onChange={(e) =>
                    setNewCustomerData({
                      ...newCustomerData,
                      cnic: e.target.value,
                    })
                  }
                  className="form-input text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Address"
                value={newCustomerData.address}
                onChange={(e) =>
                  setNewCustomerData({
                    ...newCustomerData,
                    address: e.target.value,
                  })
                }
                className="form-input text-sm"
              />

              <button
                type="button"
                onClick={handleCreateCustomer}
                disabled={createLoading}
                className="w-full mt-2 bg-primary-600 text-white px-3 py-2 rounded-md text-sm hover:bg-primary-700 active:bg-primary-800 flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm"
              >
                {createLoading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save & Select Customer
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // SEARCH DROPDOWN MODE
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, phone, or CNIC..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  if (e.target.value === "") {
                    setFormData({ ...formData, customer_id: "" }); // Clear selection if cleared
                  }
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className={`form-input pl-10 ${formData.customer_id ? "border-green-500 ring-1 ring-green-500 bg-green-50" : ""}`}
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              {formData.customer_id && (
                <div className="absolute right-3 top-2.5">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>

            {showCustomerDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto">
                {customersLoading ? (
                  <div className="p-4 text-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm mb-2">No customers found</p>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomerForm(true)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-bold flex items-center justify-center mx-auto"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add New Customer
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.customer_id}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          customer_id: customer.customer_id,
                        });
                        setCustomerSearch(
                          `${customer.name} - ${customer.phone}`,
                        );
                        setShowCustomerDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${
                        formData.customer_id === customer.customer_id
                          ? "bg-primary-50"
                          : ""
                      }`}
                    >
                      <div className="font-medium text-gray-900 flex justify-between">
                        {customer.name}
                        {formData.customer_id === customer.customer_id && (
                          <span className="text-primary-600 text-xs font-bold">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {customer.phone}
                        {customer.cnic && (
                          <span className="text-gray-400">
                            {" "}
                            • {customer.cnic}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= PRODUCT FIELD ================= */}
      <div className="col-span-2 md:col-span-1">
        <label className="form-label">Product *</label>
        <select
          value={formData.product_id}
          onChange={(e) =>
            setFormData({ ...formData, product_id: e.target.value })
          }
          className="form-input"
          required
          disabled={isEditing}
        >
          <option value="">Select Product</option>
          {products.map((product) => (
            <option key={product.product_id} value={product.product_id}>
              {product.product_name}
            </option>
          ))}
        </select>
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1">🔒 Locked after creation</p>
        )}
      </div>

      {/* ================= SERIAL NUMBER ================= */}
      <div className="col-span-2 md:col-span-1">
        <label className="form-label">Serial Number</label>
        <input
          type="text"
          value={formData.serial_number}
          onChange={(e) =>
            setFormData({ ...formData, serial_number: e.target.value })
          }
          className="form-input"
          placeholder="e.g., ABC123456"
          disabled={isEditing}
        />
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1">🔒 Locked after creation</p>
        )}
      </div>

      {/* ================= WARRANTY STATUS ================= */}
      <div className="col-span-2 md:col-span-1">
        <label className="form-label">Warranty Status *</label>
        <select
          value={formData.warranty_status}
          onChange={(e) =>
            setFormData({ ...formData, warranty_status: e.target.value })
          }
          className="form-input"
          required
          disabled={isEditing}
        >
          <option value="In Warranty">In Warranty</option>
          <option value="Out of Warranty">Out of Warranty</option>
          <option value="Contract Warranty">Contract Warranty</option>
          <option value="Contract Paid">Contract Paid</option>
        </select>
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1">🔒 Locked after creation</p>
        )}
      </div>

      {/* ================= PURCHASE DATE ================= */}
      <div className="col-span-2 md:col-span-1">
        <label className="form-label">Purchase Date</label>
        <input
          type="date"
          value={formData.purchase_date}
          onChange={(e) =>
            setFormData({ ...formData, purchase_date: e.target.value })
          }
          className="form-input"
          disabled={isEditing}
        />
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1">🔒 Locked after creation</p>
        )}
      </div>

      {/* ================= PRIORITY ================= */}
      <div className="col-span-2 md:col-span-1">
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

      {/* ================= COMPLAINT TYPE ================= */}
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

      {/* ================= DESCRIPTION ================= */}
      <div className="col-span-2">
        <label className="form-label">Description *</label>
        <textarea
          value={formData.complaint_description}
          onChange={(e) =>
            setFormData({ ...formData, complaint_description: e.target.value })
          }
          className="form-input"
          rows="4"
          placeholder="Describe the issue in detail..."
          required
        />
      </div>
    </div>
  );
};

export default ComplaintFormFields;

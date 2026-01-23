import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal'; // Ensure you have this common component

const ProductFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('product_name', initialData.product_name);
        setValue('product_code', initialData.product_code);
        setValue('category', initialData.category);
        setValue('is_active', initialData.is_active);
      } else {
        reset({ product_name: '', product_code: '', category: '', is_active: true });
      }
    }
  }, [initialData, isOpen, setValue, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Product" : "Add Product"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name *</label>
          <input 
            {...register('product_name', { required: 'Product name is required' })}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g. Refrigerator 13 cu ft"
          />
          {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name.message}</p>}
        </div>

        {/* Product Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Code *</label>
          <input 
            {...register('product_code', { required: 'Product code is required' })}
            disabled={!!initialData} // Disable code editing
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="e.g. PRD-REF-001"
          />
          {errors.product_code && <p className="text-red-500 text-xs mt-1">{errors.product_code.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select 
            {...register('category')}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
            <option value="Refrigerator">Refrigerator</option>
            <option value="Deep Freezer">Deep Freezer</option>
            <option value="Washing Machine">Washing Machine</option>
            <option value="Air Conditioner">Air Conditioner</option>
            <option value="Microwave">Microwave</option>
            <option value="Water Dispenser">Water Dispenser</option>
          </select>
        </div>

        {/* Status Checkbox */}
        <div className="flex items-center">
          <input
            id="is_active"
            type="checkbox"
            {...register('is_active')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Active Status
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {initialData ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
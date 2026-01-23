import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';

const ItemFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('description', initialData.description);
        setValue('item_code', initialData.item_code);
        setValue('category', initialData.category);
        setValue('unit_price', initialData.unit_price);
        setValue('is_active', initialData.is_active);
      } else {
        reset({ description: '', item_code: '', category: '', unit_price: '', is_active: true });
      }
    }
  }, [initialData, isOpen, setValue, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Item" : "Add Item"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Item Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <input 
            {...register('description', { required: 'Description is required' })}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g. Compressor 1/4 HP"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        {/* Item Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Item Code *</label>
          <input 
            {...register('item_code', { required: 'Item code is required' })}
            disabled={!!initialData}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="e.g. ITM-COMP-001"
          />
          {errors.item_code && <p className="text-red-500 text-xs mt-1">{errors.item_code.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select 
              {...register('category')}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Spare Part">Spare Part</option>
              <option value="Gas">Gas</option>
              <option value="Consumable">Consumable</option>
              <option value="Tool">Tool</option>
            </select>
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Price</label>
            <input 
              type="number"
              step="0.01"
              {...register('unit_price', { min: 0 })}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Status Checkbox */}
        <div className="flex items-center">
          <input
            id="item_active"
            type="checkbox"
            {...register('is_active')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="item_active" className="ml-2 block text-sm text-gray-900">
            Active Status
          </label>
        </div>

        {/* Buttons */}
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

export default ItemFormModal;
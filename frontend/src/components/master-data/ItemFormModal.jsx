import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import { DollarSign, Percent, TrendingUp } from 'lucide-react';

const ItemFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  // Watch unit_price and markup_percentage to calculate selling_price
  const unitPrice = watch('unit_price', 0);
  const markupPercentage = watch('markup_percentage', 20);

  // Calculate selling price dynamically
  const sellingPrice = unitPrice && markupPercentage 
    ? (parseFloat(unitPrice) * (1 + parseFloat(markupPercentage) / 100)).toFixed(2)
    : '0.00';

  const profit = unitPrice && sellingPrice
    ? (parseFloat(sellingPrice) - parseFloat(unitPrice)).toFixed(2)
    : '0.00';

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('description', initialData.description);
        setValue('item_code', initialData.item_code);
        setValue('category', initialData.category);
        setValue('unit_price', initialData.unit_price);
        setValue('markup_percentage', initialData.markup_percentage || 20);
        setValue('is_active', initialData.is_active);
      } else {
        reset({ 
          description: '', 
          item_code: '', 
          category: '', 
          unit_price: '', 
          markup_percentage: 20, // Default 20%
          is_active: true 
        });
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

        {/* Pricing Section - Enhanced */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing Configuration
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Purchase Price (Cost) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Purchase Price (Cost)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 text-gray-500">Rs.</span>
                <input 
                  type="number"
                  step="0.01"
                  {...register('unit_price', { min: 0 })}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">What you pay to vendor</p>
            </div>

            {/* Markup Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Markup %
              </label>
              <div className="relative mt-1">
                <input 
                  type="number"
                  step="0.01"
                  {...register('markup_percentage', { min: 0, max: 100 })}
                  className="block w-full rounded-md border border-gray-300 pr-8 pl-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="20.00"
                />
                <Percent className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Your profit margin</p>
            </div>
          </div>

          {/* Calculated Values Display */}
          <div className="mt-4 pt-4 border-t border-blue-300 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Selling Price:</span>
              <span className="text-lg font-bold text-green-600">
                Rs. {sellingPrice}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Profit per Unit:</span>
              <span className="text-sm font-semibold text-blue-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Rs. {profit}
              </span>
            </div>
          </div>

          <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
            💡 <strong>Tip:</strong> Standard markup is 20-25%. Adjust based on item category and market rates.
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
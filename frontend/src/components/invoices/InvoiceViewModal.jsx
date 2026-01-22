// frontend/src/components/invoices/InvoiceViewModal.jsx
import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import invoiceService from '../../services/invoiceService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { numberToWords } from '../../utils/numberToWords';
import { toast } from 'react-hot-toast';
import { Download, Printer, X } from 'lucide-react';

const InvoiceViewModal = ({ isOpen, onClose, invoiceId }) => {
  const printRef = useRef();

  // Fetch full invoice details
  const { data, isLoading } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => invoiceService.getById(invoiceId),
    enabled: isOpen && !!invoiceId,
  });

  const invoice = data?.data;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast('PDF download feature coming soon', { icon: 'ℹ️' });
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Invoice" size="xl">
        <div className="py-12">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice: ${invoice.invoice_number}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Print/Download Buttons */}
        <div className="flex justify-end gap-2 no-print">
          <button
            onClick={handlePrint}
            className="btn btn-outline flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn btn-outline flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        </div>

        {/* Invoice Content - Print Friendly */}
        <div ref={printRef} className="bg-white p-8 rounded-lg border border-gray-200">
          {/* Header */}
          <div className="border-b-2 border-gray-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-sm text-gray-600 mt-1">SalesCare Service Center</p>
                <p className="text-sm text-gray-600">{invoice.area_name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {invoice.invoice_number}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Date: {formatDate(invoice.invoice_date)}
                </div>
                <div className="mt-2">
                  <span className={`badge badge-${
                    invoice.status === 'Paid' ? 'success' : 
                    invoice.status === 'Issued' ? 'warning' : 'gray'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Invoice Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Bill To:</h3>
              <div className="text-sm">
                <div className="font-semibold text-gray-900">{invoice.customer_name}</div>
                {invoice.phone && <div className="text-gray-600">Phone: {invoice.phone}</div>}
                {invoice.address && <div className="text-gray-600">{invoice.address}</div>}
                {invoice.cnic && <div className="text-gray-600">CNIC: {invoice.cnic}</div>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Invoice Details:</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{invoice.invoice_type}</span>
                </div>
                {invoice.complaint_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Complaint #:</span>
                    <span className="font-medium">{invoice.complaint_number}</span>
                  </div>
                )}
                {invoice.do_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">DO #:</span>
                    <span className="font-medium">{invoice.do_number}</span>
                  </div>
                )}
                {invoice.product_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{invoice.product_name}</span>
                  </div>
                )}
                {invoice.payment_terms && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms:</span>
                    <span className="font-medium">{invoice.payment_terms}</span>
                  </div>
                )}
                {invoice.is_co && (
                  <div className="flex justify-between">
                    <span className="badge badge-info">Cash Order</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                    #
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                    Description
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                    Type
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                    Qty
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                    Rate
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                    GST
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {invoice.items?.map((item, index) => (
                  <tr key={item.invoice_item_id}>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                      <span className={`badge ${
                        item.item_type === 'SER' ? 'badge-success' : 'badge-info'
                      }`}>
                        {item.item_type}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right">
                      {parseFloat(item.quantity).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(item.rate_per_unit)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(item.gst_amount)}
                      <div className="text-xs text-gray-500">
                        ({item.gst_percentage}%)
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.net_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              {/* Left side - could add notes or terms */}
              <div className="text-sm text-gray-600">
                {invoice.payment_terms && (
                  <div>
                    <strong>Payment Terms:</strong> {invoice.payment_terms}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {parseFloat(invoice.gst_total) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST Total:</span>
                      <span className="font-medium">{formatCurrency(invoice.gst_total)}</span>
                    </div>
                  )}
                  {parseFloat(invoice.fst_total) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">FST Total:</span>
                      <span className="font-medium">{formatCurrency(invoice.fst_total)}</span>
                    </div>
                  )}
                  {parseFloat(invoice.discount) > 0 && (
                    <div className="flex justify-between text-danger-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        parseFloat(invoice.subtotal) + 
                        parseFloat(invoice.gst_total) + 
                        parseFloat(invoice.fst_total) - 
                        parseFloat(invoice.discount)
                      )}
                    </span>
                  </div>
                  {parseFloat(invoice.waive_off) > 0 && (
                    <div className="flex justify-between text-danger-600">
                      <span>Waive-off:</span>
                      <span>-{formatCurrency(invoice.waive_off)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-gray-900 text-lg font-bold">
                    <span>Net Amount:</span>
                    <span className="text-primary-600">
                      {formatCurrency(invoice.net_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <div className="text-sm">
              <strong className="text-gray-700">Amount in Words:</strong>
              <div className="text-gray-900 italic mt-1">
                {numberToWords(invoice.net_amount)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4">
            <div className="grid grid-cols-2 gap-6 text-xs text-gray-600">
              <div>
                <p><strong>Notes:</strong></p>
                <p>Thank you for your business!</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">SalesCare Service Center</p>
                <p>{invoice.area_name}</p>
                <p className="mt-2">_____________________</p>
                <p className="mt-1">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalFooter className="no-print">
        <button onClick={handlePrint} className="btn btn-outline">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </button>
        <button onClick={handleDownloadPDF} className="btn btn-outline">
          <Download className="w-4 h-4 mr-2" />
          PDF
        </button>
        <button onClick={onClose} className="btn btn-primary">
          Close
        </button>
      </ModalFooter>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </Modal>
  );
};

export default InvoiceViewModal;
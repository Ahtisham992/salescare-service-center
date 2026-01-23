// frontend/src/components/invoices/InvoiceViewModal.jsx
import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal, { ModalFooter } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import invoiceService from '../../services/invoiceService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { numberToWords } from '../../utils/numberToWords';
import { toast } from 'react-hot-toast';
import { Download, Printer } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const InvoiceViewModal = ({ isOpen, onClose, invoiceId }) => {
  const invoiceRef = useRef();

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
    if (!invoiceRef.current) return;
    const element = invoiceRef.current;
    const opt = {
      margin: 0.3,
      filename: `Invoice-${invoice?.invoice_number || 'draft'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } // Landscape fits your table better
    };

    toast.promise(
      html2pdf().set(opt).from(element).save(),
      {
        loading: 'Generating PDF...',
        success: 'PDF Downloaded!',
        error: 'Could not generate PDF.',
      }
    );
  };

  if (isLoading) return <Modal isOpen={isOpen} onClose={onClose}><LoadingSpinner /></Modal>;
  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice View`} size="xl">
      <div className="space-y-4">
        {/* Buttons */}
        <div className="flex justify-end gap-2 no-print">
          <button onClick={handlePrint} className="btn btn-outline flex items-center">
            <Printer className="w-4 h-4 mr-2" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-primary flex items-center">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </button>
        </div>

        {/* --- INVOICE DOCUMENT (Matches your Image Layout) --- */}
        <div id="invoice-content" ref={invoiceRef} className="bg-white p-6 rounded-none border border-gray-300 text-xs text-gray-800 font-sans">
          
          {/* 1. Header Section */}
          <div className="border-b-2 border-gray-800 pb-2 mb-4">
            <div className="flex justify-between items-start">
              <div className="w-1/2">
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SalesCare Service Center</h1>
                <p className="font-semibold">{invoice.area_name}</p>
                <div className="mt-2 text-gray-600">
                  <p>{invoice.address || 'Service Center Address'}</p>
                  <p>Phone: {invoice.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="w-1/2 text-right">
                <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-right float-right">
                  <span className="font-bold">Invoice #:</span> <span>{invoice.invoice_number}</span>
                  <span className="font-bold">Date:</span> <span>{formatDate(invoice.invoice_date)}</span>
                  <span className="font-bold">Job/Ref #:</span> <span>{invoice.complaint_number || invoice.do_number || 'N/A'}</span>
                  <span className="font-bold">NTN #:</span> <span>{invoice.sales_tax_reg || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Customer & Order Details Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4 border border-gray-300 p-2 bg-gray-50">
            <div>
              <h3 className="font-bold text-gray-700 border-b border-gray-300 mb-1">Customer Details</h3>
              <p className="font-bold">{invoice.customer_name}</p>
              <p>{invoice.phone}</p>
              <p>{invoice.address}</p>
              <p>CNIC: {invoice.cnic || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 border-b border-gray-300 mb-1">Order Details</h3>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-gray-500">Cust Order #:</span> <span>{invoice.customer_order_number || '-'}</span>
                <span className="text-gray-500">Dispatch:</span> <span>{invoice.dispatch_mode || '-'}</span>
                <span className="text-gray-500">Payment:</span> <span>{invoice.payment_terms || 'Cash'}</span>
              </div>
            </div>
            <div>
               <h3 className="font-bold text-gray-700 border-b border-gray-300 mb-1">Status</h3>
               <div className={`mt-2 text-center border rounded p-1 font-bold ${invoice.status === 'Paid' ? 'border-green-500 text-green-700 bg-green-50' : 'border-yellow-500 text-yellow-700 bg-yellow-50'}`}>
                 {invoice.status.toUpperCase()}
               </div>
            </div>
          </div>

          {/* 3. Detailed Items Table (Matches Image Columns) */}
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="border border-gray-300 p-1 w-8">#</th>
                <th className="border border-gray-300 p-1 w-12">Type</th>
                <th className="border border-gray-300 p-1 text-left">Description</th>
                <th className="border border-gray-300 p-1 w-12">Qty</th>
                <th className="border border-gray-300 p-1 w-20">Rate</th>
                <th className="border border-gray-300 p-1 w-20">Amount</th>
                <th className="border border-gray-300 p-1 w-12">GST%</th>
                <th className="border border-gray-300 p-1 w-16">GST</th>
                <th className="border border-gray-300 p-1 w-12">FST%</th>
                <th className="border border-gray-300 p-1 w-16">FST</th>
                <th className="border border-gray-300 p-1 w-20">Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border border-gray-300 p-1">{idx + 1}</td>
                  <td className="border border-gray-300 p-1 font-bold text-gray-600">{item.item_type}</td>
                  <td className="border border-gray-300 p-1 text-left">{item.description}</td>
                  <td className="border border-gray-300 p-1">{item.quantity}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatCurrency(item.rate_per_unit)}</td>
                  <td className="border border-gray-300 p-1 text-right">{formatCurrency(item.amount)}</td>
                  <td className="border border-gray-300 p-1">{item.gst_percentage}%</td>
                  <td className="border border-gray-300 p-1 text-right">{formatCurrency(item.gst_amount)}</td>
                  <td className="border border-gray-300 p-1">{item.fst_percentage || 0}%</td>
                  <td className="border border-gray-300 p-1 text-right">{formatCurrency(item.fst_amount || 0)}</td>
                  <td className="border border-gray-300 p-1 text-right font-bold">{formatCurrency(item.net_amount)}</td>
                </tr>
              ))}
              {/* Empty rows filler if needed for print layout */}
            </tbody>
          </table>

          {/* 4. Footer & Totals */}
          <div className="flex items-start justify-between">
            <div className="w-2/3 pr-8">
              <div className="border-t border-gray-300 pt-2 mt-2">
                <span className="font-bold">Amount in Words:</span>
                <p className="italic text-gray-700 mt-1 capitalize">{numberToWords(invoice.net_amount)} only.</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-8 text-center">
                <div className="border-t border-gray-400 pt-1">Customer Signature</div>
                <div className="border-t border-gray-400 pt-1">Authorized Signature</div>
              </div>
            </div>

            <div className="w-1/3 bg-gray-50 border border-gray-300 p-2">
              <div className="flex justify-between mb-1">
                <span>Subtotal:</span>
                <span className="font-bold">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between mb-1 text-gray-600">
                <span>Total GST:</span>
                <span>{formatCurrency(invoice.gst_total)}</span>
              </div>
              {parseFloat(invoice.fst_total) > 0 && (
                <div className="flex justify-between mb-1 text-gray-600">
                  <span>Total FST:</span>
                  <span>{formatCurrency(invoice.fst_total)}</span>
                </div>
              )}
              {parseFloat(invoice.discount) > 0 && (
                <div className="flex justify-between mb-1 text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {parseFloat(invoice.waive_off) > 0 && (
                <div className="flex justify-between mb-1 text-red-600">
                  <span>Waive Off:</span>
                  <span>-{formatCurrency(invoice.waive_off)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 pt-2 mt-2 text-base">
                <span className="font-bold">Net Payable:</span>
                <span className="font-bold text-primary-700">{formatCurrency(invoice.net_amount)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center text-[10px] text-gray-400 mt-6">
            Computer generated document. Valid without signature in some jurisdictions.
          </div>
        </div>
      </div>

      <ModalFooter className="no-print">
        <button onClick={onClose} className="btn btn-outline">Close</button>
      </ModalFooter>
    </Modal>
  );
};

export default InvoiceViewModal;
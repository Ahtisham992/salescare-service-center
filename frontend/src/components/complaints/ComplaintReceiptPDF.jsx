// frontend/src/components/complaints/ComplaintReceiptPDF.jsx
import React, { useRef } from 'react';
import { formatDate } from '../../utils/formatters';
import { Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';

const ComplaintReceiptPDF = ({ complaint, type = 'customer' }) => {
  const receiptRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Please allow pop-ups to print receipts');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Complaint Receipt - ${complaint.complaint_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; line-height: 1.4; }
            .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px; }
            .company-name { font-size: 18px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px; }
            .receipt-title { font-size: 14px; margin-top: 5px; }
            .copy-type { font-size: 16px; font-weight: bold; margin-top: 12px; padding: 8px; border: 2px solid #000; background-color: ${type === 'customer' ? '#f0f0f0' : '#e0e0e0'}; }
            .section { margin: 15px 0; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
            .section:last-of-type { border-bottom: none; }
            .section-title { font-weight: bold; margin-bottom: 8px; font-size: 13px; text-decoration: underline; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; line-height: 1.6; }
            .label { font-weight: bold; min-width: 140px; }
            .value { text-align: right; flex: 1; word-wrap: break-word; }
            .description-box { margin-top: 8px; padding: 8px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 11px; line-height: 1.5; white-space: pre-wrap; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000; text-align: center; font-size: 11px; }
            .signature { margin-top: 40px; text-align: center; }
            .signature-line { border-top: 1px solid #000; width: 200px; margin: 0 auto 5px; }
            .timestamp { text-align: center; font-size: 10px; margin-top: 15px; color: #666; }
            @media print { body { padding: 0; } .receipt { border: none; } @page { margin: 1cm; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="company-name">SALESCARE SERVICE CENTER</div>
              <div class="receipt-title">SERVICE COMPLAINT RECEIPT</div>
              <div class="copy-type">${type === 'customer' ? '📋 CUSTOMER COPY' : '🏢 OFFICE COPY'}</div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Complaint #:</span><span class="value"><strong>${complaint.complaint_number}</strong></span></div>
              <div class="row"><span class="label">Date & Time:</span><span class="value">${formatDate(complaint.complaint_date)}</span></div>
              <div class="row"><span class="label">Status:</span><span class="value">${complaint.status}</span></div>
              <div class="row"><span class="label">Priority:</span><span class="value">${complaint.priority || 'Medium'}</span></div>
            </div>
            <div class="section">
              <div class="section-title">CUSTOMER INFORMATION</div>
              <div class="row"><span class="label">Name:</span><span class="value">${complaint.customer_name}</span></div>
              <div class="row"><span class="label">Phone:</span><span class="value">${complaint.customer_phone}</span></div>
              ${complaint.customer_address ? `<div class="row"><span class="label">Address:</span><span class="value" style="font-size: 11px;">${complaint.customer_address}</span></div>` : ''}
            </div>
            <div class="section">
              <div class="section-title">PRODUCT DETAILS</div>
              <div class="row"><span class="label">Product:</span><span class="value">${complaint.product_name}</span></div>
              ${complaint.serial_number ? `<div class="row"><span class="label">Serial Number:</span><span class="value">${complaint.serial_number}</span></div>` : ''}
              <div class="row"><span class="label">Warranty:</span><span class="value">${complaint.warranty_status}</span></div>
              ${complaint.purchase_date ? `<div class="row"><span class="label">Purchase Date:</span><span class="value">${formatDate(complaint.purchase_date)}</span></div>` : ''}
            </div>
            <div class="section">
              <div class="section-title">COMPLAINT DETAILS</div>
              ${complaint.complaint_type ? `<div class="row"><span class="label">Type:</span><span class="value">${complaint.complaint_type}</span></div>` : ''}
              <div class="description-box"><strong>Description:</strong><br>${complaint.complaint_description || 'No description provided'}</div>
            </div>
            ${complaint.technician_name ? `
            <div class="section">
              <div class="section-title">ASSIGNED TECHNICIAN</div>
              <div class="row"><span class="label">Name:</span><span class="value">${complaint.technician_name}</span></div>
              ${complaint.technician_phone ? `<div class="row"><span class="label">Contact:</span><span class="value">${complaint.technician_phone}</span></div>` : ''}
            </div>` : ''}
            ${type === 'customer' ? `
            <div class="footer">
              <div style="margin-bottom: 8px; font-weight: bold;">⚠️ IMPORTANT - PLEASE KEEP THIS RECEIPT</div>
              <div style="font-size: 10px; line-height: 1.6;">This receipt is required for service tracking and parts collection.<br>For inquiries, contact our service center with your complaint number.</div>
            </div>` : `
            <div class="footer">
              <div style="font-weight: bold; margin-bottom: 5px;">OFFICE COPY - FOR INTERNAL USE</div>
              <div style="font-size: 10px;">File with complaint records</div>
            </div>`}
            <div class="signature"><div class="signature-line"></div><div>Authorized Signature</div></div>
            <div class="timestamp">Printed: ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    if (!receiptRef.current) return;

    const element = receiptRef.current;
    const opt = {
      margin: 0.5,
      filename: `Complaint-${complaint.complaint_number}-${type}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    toast.promise(
      html2pdf().set(opt).from(element).save(),
      {
        loading: 'Generating PDF...',
        success: 'PDF Downloaded Successfully!',
        error: 'Could not generate PDF.',
      }
    );
  };

  return (
    <div className="flex gap-2">
      {/* Hidden receipt for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div ref={receiptRef} style={{ 
          width: '400px', 
          padding: '20px', 
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          lineHeight: '1.4',
          backgroundColor: 'white'
        }}>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '15px', marginBottom: '15px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>
              SALESCARE SERVICE CENTER
            </div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>SERVICE COMPLAINT RECEIPT</div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginTop: '12px', 
              padding: '8px', 
              border: '2px solid #000',
              backgroundColor: type === 'customer' ? '#f0f0f0' : '#e0e0e0'
            }}>
              {type === 'customer' ? '📋 CUSTOMER COPY' : '🏢 OFFICE COPY'}
            </div>
          </div>

          <div style={{ margin: '15px 0', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Complaint #:</span>
              <span><strong>{complaint.complaint_number}</strong></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Date & Time:</span>
              <span>{formatDate(complaint.complaint_date)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Status:</span>
              <span>{complaint.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Priority:</span>
              <span>{complaint.priority || 'Medium'}</span>
            </div>
          </div>

          <div style={{ margin: '15px 0', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textDecoration: 'underline' }}>
              CUSTOMER INFORMATION
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Name:</span>
              <span>{complaint.customer_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Phone:</span>
              <span>{complaint.customer_phone}</span>
            </div>
            {complaint.customer_address && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Address:</span>
                <span style={{ fontSize: '11px', textAlign: 'right' }}>{complaint.customer_address}</span>
              </div>
            )}
          </div>

          <div style={{ margin: '15px 0', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textDecoration: 'underline' }}>
              PRODUCT DETAILS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Product:</span>
              <span>{complaint.product_name}</span>
            </div>
            {complaint.serial_number && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Serial Number:</span>
                <span>{complaint.serial_number}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Warranty:</span>
              <span>{complaint.warranty_status}</span>
            </div>
          </div>

          <div style={{ margin: '15px 0', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textDecoration: 'underline' }}>
              COMPLAINT DETAILS
            </div>
            {complaint.complaint_type && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Type:</span>
                <span>{complaint.complaint_type}</span>
              </div>
            )}
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', fontSize: '11px' }}>
              <strong>Description:</strong><br/>
              {complaint.complaint_description || 'No description provided'}
            </div>
          </div>

          {complaint.technician_name && (
            <div style={{ margin: '15px 0', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textDecoration: 'underline' }}>
                ASSIGNED TECHNICIAN
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Name:</span>
                <span>{complaint.technician_name}</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto 5px' }}></div>
            <div>Authorized Signature</div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '15px', color: '#666' }}>
            Generated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <button
        onClick={handlePrint}
        className="btn btn-outline flex items-center gap-2"
        type="button"
      >
        <Printer className="w-4 h-4" />
        Print {type === 'customer' ? 'Customer' : 'Office'}
      </button>

      <button
        onClick={handleDownloadPDF}
        className="btn btn-primary flex items-center gap-2"
        type="button"
      >
        <Download className="w-4 h-4" />
        PDF {type === 'customer' ? 'Customer' : 'Office'}
      </button>
    </div>
  );
};

export default ComplaintReceiptPDF;
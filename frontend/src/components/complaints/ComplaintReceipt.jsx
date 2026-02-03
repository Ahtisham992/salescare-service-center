// frontend/src/components/complaints/ComplaintReceipt.jsx (FIXED VERSION)
import React from 'react';
import { formatDate } from '../../utils/formatters';
import { Printer } from 'lucide-react';

const ComplaintReceipt = ({ complaint, type = 'customer' }) => {
  const printReceipt = () => {
    // Create a new window with proper settings
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Please allow pop-ups to print receipts');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Complaint Receipt - ${complaint.complaint_number}</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            body { 
              font-family: 'Courier New', monospace; 
              padding: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            
            .receipt { 
              max-width: 400px; 
              margin: 0 auto;
              border: 2px solid #000;
              padding: 20px;
            }
            
            .header { 
              text-align: center; 
              border-bottom: 2px dashed #000;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            
            .company-name { 
              font-size: 18px; 
              font-weight: bold;
              margin-bottom: 8px;
              letter-spacing: 1px;
            }
            
            .receipt-title {
              font-size: 14px;
              margin-top: 5px;
            }
            
            .copy-type {
              font-size: 16px;
              font-weight: bold;
              margin-top: 12px;
              padding: 8px;
              border: 2px solid #000;
              background-color: ${type === 'customer' ? '#f0f0f0' : '#e0e0e0'};
            }
            
            .section { 
              margin: 15px 0;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
            }
            
            .section:last-of-type {
              border-bottom: none;
            }
            
            .section-title {
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 13px;
              text-decoration: underline;
            }
            
            .row { 
              display: flex; 
              justify-content: space-between;
              margin: 5px 0;
              line-height: 1.6;
            }
            
            .label { 
              font-weight: bold;
              min-width: 140px;
            }
            
            .value { 
              text-align: right;
              flex: 1;
              word-wrap: break-word;
            }
            
            .description-box {
              margin-top: 8px;
              padding: 8px;
              background-color: #f9f9f9;
              border: 1px solid #ddd;
              font-size: 11px;
              line-height: 1.5;
              white-space: pre-wrap;
            }
            
            .footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px dashed #000;
              text-align: center;
              font-size: 11px;
            }
            
            .signature {
              margin-top: 40px;
              text-align: center;
            }
            
            .signature-line {
              border-top: 1px solid #000;
              width: 200px;
              margin: 0 auto 5px;
            }
            
            .timestamp {
              text-align: center;
              font-size: 10px;
              margin-top: 15px;
              color: #666;
            }
            
            @media print {
              body { 
                padding: 0; 
              }
              
              .receipt {
                border: none;
              }
              
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="company-name">SALESCARE SERVICE CENTER</div>
              <div class="receipt-title">SERVICE COMPLAINT RECEIPT</div>
              <div class="copy-type">
                ${type === 'customer' ? '📋 CUSTOMER COPY' : '🏢 OFFICE COPY'}
              </div>
            </div>

            <div class="section">
              <div class="row">
                <span class="label">Complaint #:</span>
                <span class="value"><strong>${complaint.complaint_number}</strong></span>
              </div>
              <div class="row">
                <span class="label">Date & Time:</span>
                <span class="value">${formatDate(complaint.complaint_date)}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span class="value">${complaint.status}</span>
              </div>
              <div class="row">
                <span class="label">Priority:</span>
                <span class="value">${complaint.priority || 'Medium'}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">CUSTOMER INFORMATION</div>
              <div class="row">
                <span class="label">Name:</span>
                <span class="value">${complaint.customer_name}</span>
              </div>
              <div class="row">
                <span class="label">Phone:</span>
                <span class="value">${complaint.customer_phone}</span>
              </div>
              ${complaint.customer_address ? `
              <div class="row">
                <span class="label">Address:</span>
                <span class="value" style="font-size: 11px;">
                  ${complaint.customer_address}
                </span>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">PRODUCT DETAILS</div>
              <div class="row">
                <span class="label">Product:</span>
                <span class="value">${complaint.product_name}</span>
              </div>
              ${complaint.serial_number ? `
              <div class="row">
                <span class="label">Serial Number:</span>
                <span class="value">${complaint.serial_number}</span>
              </div>
              ` : ''}
              <div class="row">
                <span class="label">Warranty:</span>
                <span class="value">${complaint.warranty_status}</span>
              </div>
              ${complaint.purchase_date ? `
              <div class="row">
                <span class="label">Purchase Date:</span>
                <span class="value">${formatDate(complaint.purchase_date)}</span>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">COMPLAINT DETAILS</div>
              ${complaint.complaint_type ? `
              <div class="row">
                <span class="label">Type:</span>
                <span class="value">${complaint.complaint_type}</span>
              </div>
              ` : ''}
              <div class="description-box">
                <strong>Description:</strong><br>
                ${complaint.complaint_description || 'No description provided'}
              </div>
            </div>

            ${complaint.technician_name ? `
            <div class="section">
              <div class="section-title">ASSIGNED TECHNICIAN</div>
              <div class="row">
                <span class="label">Name:</span>
                <span class="value">${complaint.technician_name}</span>
              </div>
              ${complaint.technician_phone ? `
              <div class="row">
                <span class="label">Contact:</span>
                <span class="value">${complaint.technician_phone}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}

            ${type === 'customer' ? `
            <div class="footer">
              <div style="margin-bottom: 8px; font-weight: bold;">
                ⚠️ IMPORTANT - PLEASE KEEP THIS RECEIPT
              </div>
              <div style="font-size: 10px; line-height: 1.6;">
                This receipt is required for service tracking and parts collection.<br>
                For inquiries, contact our service center with your complaint number.
              </div>
            </div>
            ` : `
            <div class="footer">
              <div style="font-weight: bold; margin-bottom: 5px;">
                OFFICE COPY - FOR INTERNAL USE
              </div>
              <div style="font-size: 10px;">
                File with complaint records
              </div>
            </div>
            `}

            <div class="signature">
              <div class="signature-line"></div>
              <div>Authorized Signature</div>
            </div>

            <div class="timestamp">
              Printed: ${new Date().toLocaleString('en-US', { 
                year: 'numeric',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          <script>
            // Auto-print when page loads
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // Optional: close window after printing
                // window.onafterprint = function() { window.close(); };
              }, 250);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <button
      onClick={printReceipt}
      className="btn btn-outline flex items-center gap-2"
      type="button"
    >
      <Printer className="w-4 h-4" />
      Print {type === 'customer' ? 'Customer' : 'Office'} Copy
    </button>
  );
};

export default ComplaintReceipt;
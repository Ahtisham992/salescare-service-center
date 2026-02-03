// backend/services/notificationService.js
const nodemailer = require('nodemailer');

// Email transporter (using Gmail - you can change to your SMTP)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// SMS service using Twilio (or you can use local SMS gateway)
const sendSMS = async (phone, message) => {
  try {
    // For Pakistan, you might use EoceanSMS, Veevo, or any local SMS gateway
    // This is a placeholder - replace with your SMS gateway API
    
    if (!process.env.SMS_ENABLED || process.env.SMS_ENABLED === 'false') {
      console.log(`SMS (Disabled): To ${phone}: ${message}`);
      return { success: true, message: 'SMS disabled in config' };
    }

    // Example using simple HTTP request to SMS gateway
    const response = await fetch(process.env.SMS_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMS_API_KEY}`
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        sender_id: process.env.SMS_SENDER_ID || 'SalesCare'
      })
    });

    if (!response.ok) {
      throw new Error('SMS sending failed');
    }

    console.log(`SMS sent to ${phone}`);
    return { success: true };

  } catch (error) {
    console.error('SMS Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Email
const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED === 'false') {
      console.log(`Email (Disabled): To ${to}, Subject: ${subject}`);
      return { success: true, message: 'Email disabled in config' };
    }

    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `${process.env.COMPANY_NAME || 'SalesCare'} <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Email Error:', error.message);
    return { success: false, error: error.message };
  }
};

// ===============================
// CUSTOMER NOTIFICATIONS
// ===============================

// 1. Complaint Registered
const notifyComplaintRegistered = async (complaint, customer) => {
  const subject = `Complaint Registered - ${complaint.complaint_number}`;
  
  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
        <h1>Complaint Registered Successfully</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Dear <strong>${customer.name}</strong>,</p>
        
        <p>Your service complaint has been registered successfully.</p>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3>Complaint Details:</h3>
          <p><strong>Complaint #:</strong> ${complaint.complaint_number}</p>
          <p><strong>Product:</strong> ${complaint.product_name}</p>
          <p><strong>Status:</strong> ${complaint.status}</p>
          <p><strong>Date:</strong> ${new Date(complaint.complaint_date).toLocaleDateString()}</p>
        </div>
        
        <p><strong>Description:</strong></p>
        <p style="background-color: white; padding: 10px; border-radius: 5px;">
          ${complaint.complaint_description}
        </p>
        
        <p>Our technician will contact you soon.</p>
        
        <p>Please keep your complaint number for reference.</p>
        
        <p>Best regards,<br><strong>${process.env.COMPANY_NAME || 'SalesCare Service Center'}</strong></p>
      </div>
      
      <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
        <p>For inquiries, contact us at ${process.env.SUPPORT_PHONE || 'N/A'}</p>
      </div>
    </div>
  `;

  const smsMessage = `Dear ${customer.name}, your complaint ${complaint.complaint_number} for ${complaint.product_name} has been registered. We will contact you soon. - ${process.env.COMPANY_NAME || 'SalesCare'}`;

  // Send both email and SMS
  const results = await Promise.allSettled([
    customer.email ? sendEmail(customer.email, subject, emailHTML) : Promise.resolve({ success: false, message: 'No email' }),
    customer.phone ? sendSMS(customer.phone, smsMessage) : Promise.resolve({ success: false, message: 'No phone' })
  ]);

  return {
    email: results[0].status === 'fulfilled' ? results[0].value : { success: false },
    sms: results[1].status === 'fulfilled' ? results[1].value : { success: false }
  };
};

// 2. Technician Assigned
const notifyTechnicianAssigned = async (complaint, customer, technician) => {
  const subject = `Technician Assigned - ${complaint.complaint_number}`;
  
  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
        <h1>Technician Assigned</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Dear <strong>${customer.name}</strong>,</p>
        
        <p>A technician has been assigned to your complaint.</p>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h3>Technician Details:</h3>
          <p><strong>Name:</strong> ${technician.full_name}</p>
          <p><strong>Phone:</strong> ${technician.phone || 'N/A'}</p>
        </div>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0;">
          <p><strong>Complaint #:</strong> ${complaint.complaint_number}</p>
          <p><strong>Product:</strong> ${complaint.product_name}</p>
        </div>
        
        <p>The technician will contact you to schedule a visit.</p>
        
        <p>Best regards,<br><strong>${process.env.COMPANY_NAME || 'SalesCare Service Center'}</strong></p>
      </div>
    </div>
  `;

  const smsMessage = `Technician ${technician.full_name} (${technician.phone}) has been assigned to your complaint ${complaint.complaint_number}. - ${process.env.COMPANY_NAME || 'SalesCare'}`;

  const results = await Promise.allSettled([
    customer.email ? sendEmail(customer.email, subject, emailHTML) : Promise.resolve({ success: false }),
    customer.phone ? sendSMS(customer.phone, smsMessage) : Promise.resolve({ success: false })
  ]);

  return {
    email: results[0].status === 'fulfilled' ? results[0].value : { success: false },
    sms: results[1].status === 'fulfilled' ? results[1].value : { success: false }
  };
};

// 3. Status Update
const notifyStatusUpdate = async (complaint, customer, oldStatus, newStatus) => {
  const subject = `Status Update - ${complaint.complaint_number}`;
  
  const statusColors = {
    'Assigned': '#2196F3',
    'In Progress': '#FF9800',
    'Completed': '#4CAF50',
    'On Hold': '#9E9E9E',
    'Cancelled': '#F44336'
  };

  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${statusColors[newStatus] || '#333'}; color: white; padding: 20px; text-align: center;">
        <h1>Complaint Status Updated</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Dear <strong>${customer.name}</strong>,</p>
        
        <p>Your complaint status has been updated.</p>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid ${statusColors[newStatus] || '#333'};">
          <p><strong>Complaint #:</strong> ${complaint.complaint_number}</p>
          <p><strong>Product:</strong> ${complaint.product_name}</p>
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>New Status:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: bold;">${newStatus}</span></p>
        </div>
        
        ${newStatus === 'Completed' ? `
          <div style="background-color: #E8F5E9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4CAF50;">✓ Service Completed</h3>
            <p>Thank you for choosing our service. We hope you're satisfied with our work!</p>
          </div>
        ` : ''}
        
        <p>Best regards,<br><strong>${process.env.COMPANY_NAME || 'SalesCare Service Center'}</strong></p>
      </div>
    </div>
  `;

  const smsMessage = `Your complaint ${complaint.complaint_number} status updated: ${oldStatus} → ${newStatus}. - ${process.env.COMPANY_NAME || 'SalesCare'}`;

  const results = await Promise.allSettled([
    customer.email ? sendEmail(customer.email, subject, emailHTML) : Promise.resolve({ success: false }),
    customer.phone ? sendSMS(customer.phone, smsMessage) : Promise.resolve({ success: false })
  ]);

  return {
    email: results[0].status === 'fulfilled' ? results[0].value : { success: false },
    sms: results[1].status === 'fulfilled' ? results[1].value : { success: false }
  };
};

// 4. Complaint Completed
const notifyComplaintCompleted = async (complaint, customer) => {
  const subject = `Service Completed - ${complaint.complaint_number}`;
  
  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
        <h1>✓ Service Completed Successfully</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Dear <strong>${customer.name}</strong>,</p>
        
        <p>We're pleased to inform you that your service complaint has been completed.</p>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3>Service Summary:</h3>
          <p><strong>Complaint #:</strong> ${complaint.complaint_number}</p>
          <p><strong>Product:</strong> ${complaint.product_name}</p>
          <p><strong>Completed Date:</strong> ${new Date(complaint.completion_date).toLocaleDateString()}</p>
          ${complaint.technician_name ? `<p><strong>Technician:</strong> ${complaint.technician_name}</p>` : ''}
        </div>
        
        <div style="background-color: #E8F5E9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Thank You!</h3>
          <p>We appreciate your trust in our services. If you have any feedback or concerns, please don't hesitate to contact us.</p>
        </div>
        
        <p>Best regards,<br><strong>${process.env.COMPANY_NAME || 'SalesCare Service Center'}</strong></p>
      </div>
    </div>
  `;

  const smsMessage = `Great news! Your complaint ${complaint.complaint_number} has been completed successfully. Thank you for choosing ${process.env.COMPANY_NAME || 'SalesCare'}!`;

  const results = await Promise.allSettled([
    customer.email ? sendEmail(customer.email, subject, emailHTML) : Promise.resolve({ success: false }),
    customer.phone ? sendSMS(customer.phone, smsMessage) : Promise.resolve({ success: false })
  ]);

  return {
    email: results[0].status === 'fulfilled' ? results[0].value : { success: false },
    sms: results[1].status === 'fulfilled' ? results[1].value : { success: false }
  };
};

// ===============================
// TECHNICIAN NOTIFICATIONS
// ===============================

// 1. Task Assigned to Technician
const notifyTechnicianTaskAssigned = async (complaint, technician, customer) => {
  const subject = `New Task Assigned - ${complaint.complaint_number}`;
  
  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
        <h1>🔧 New Task Assigned</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Hello <strong>${technician.full_name}</strong>,</p>
        
        <p>A new service task has been assigned to you.</p>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #FF9800;">
          <h3>Task Details:</h3>
          <p><strong>Complaint #:</strong> ${complaint.complaint_number}</p>
          <p><strong>Product:</strong> ${complaint.product_name}</p>
          <p><strong>Priority:</strong> <span style="color: ${complaint.priority === 'High' || complaint.priority === 'Critical' ? '#F44336' : '#666'};">${complaint.priority || 'Medium'}</span></p>
          <p><strong>Warranty:</strong> ${complaint.warranty_status}</p>
        </div>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0;">
          <h3>Customer Details:</h3>
          <p><strong>Name:</strong> ${customer.name}</p>
          <p><strong>Phone:</strong> ${customer.phone}</p>
          <p><strong>Address:</strong> ${customer.address || 'N/A'}</p>
        </div>
        
        <div style="background-color: #FFF3E0; padding: 15px; border-radius: 5px;">
          <p><strong>Problem Description:</strong></p>
          <p>${complaint.complaint_description}</p>
        </div>
        
        <p style="margin-top: 20px;">Please contact the customer to schedule a visit.</p>
        
        <p>Best regards,<br><strong>${process.env.COMPANY_NAME || 'SalesCare Service Center'}</strong></p>
      </div>
    </div>
  `;

  const smsMessage = `New task assigned! Complaint: ${complaint.complaint_number}, Product: ${complaint.product_name}, Customer: ${customer.name} (${customer.phone}). Priority: ${complaint.priority || 'Medium'}`;

  const results = await Promise.allSettled([
    technician.email ? sendEmail(technician.email, subject, emailHTML) : Promise.resolve({ success: false }),
    technician.phone ? sendSMS(technician.phone, smsMessage) : Promise.resolve({ success: false })
  ]);

  return {
    email: results[0].status === 'fulfilled' ? results[0].value : { success: false },
    sms: results[1].status === 'fulfilled' ? results[1].value : { success: false }
  };
};

module.exports = {
  sendEmail,
  sendSMS,
  notifyComplaintRegistered,
  notifyTechnicianAssigned,
  notifyStatusUpdate,
  notifyComplaintCompleted,
  notifyTechnicianTaskAssigned
};
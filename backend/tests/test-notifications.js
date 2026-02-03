// backend/tests/test-notifications.js
// Run this file to test your notification system

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  sendEmail,
  sendSMS,
  notifyComplaintRegistered,
  notifyTechnicianAssigned,
  notifyStatusUpdate,
  notifyComplaintCompleted,
  notifyTechnicianTaskAssigned
} = require('../services/notificationService');

// Test data
const testComplaint = {
  complaint_id: 1,
  complaint_number: 'RWP-2024-000001',
  complaint_date: new Date(),
  status: 'Open',
  priority: 'High',
  warranty_status: 'In Warranty',
  product_name: 'Refrigerator - PRL 700',
  complaint_description: 'Not cooling properly. Making strange noise.',
  complaint_type: 'Repair',
  completion_date: new Date()
};

const testCustomer = {
  customer_id: 1,
  name: 'Ahmed Ali',
  phone: '+923001234567', // Change to your phone for SMS test
  email: 'shamimuhammad77@gmail.com', // Change to your email for test
  address: 'House #123, Street 5, Rawalpindi'
};

const testTechnician = {
  user_id: 2,
  full_name: 'Usman Khan',
  phone: '+923007654321', // Change to your phone for SMS test
  email: 'i222690@nu.edu.pk', // Change to your email for test
  role: 'technician'
};

// Test functions
async function testBasicEmail() {
  console.log('\n🧪 TEST 1: Basic Email');
  console.log('='.repeat(50));
  
  const result = await sendEmail(
    testCustomer.email,
    'Test Email from SalesCare',
    '<h1>Hello!</h1><p>This is a test email from your notification system.</p>'
  );
  
  console.log('Result:', result);
  console.log('✓ Check your email inbox!\n');
}

async function testBasicSMS() {
  console.log('\n🧪 TEST 2: Basic SMS');
  console.log('='.repeat(50));
  
  const result = await sendSMS(
    testCustomer.phone,
    'Test SMS from SalesCare Service Center. Your notification system is working!'
  );
  
  console.log('Result:', result);
  if (result.success) {
    console.log('✓ Check your phone for SMS!\n');
  } else {
    console.log('ℹ SMS might be disabled or not configured yet.\n');
  }
}

async function testComplaintRegistered() {
  console.log('\n🧪 TEST 3: Complaint Registered Notification');
  console.log('='.repeat(50));
  
  const result = await notifyComplaintRegistered(testComplaint, testCustomer);
  
  console.log('Email Result:', result.email);
  console.log('SMS Result:', result.sms);
  console.log('✓ Check customer email and phone!\n');
}

async function testTechnicianAssigned() {
  console.log('\n🧪 TEST 4: Technician Assigned Notification');
  console.log('='.repeat(50));
  
  const complaintWithTech = {
    ...testComplaint,
    technician_name: testTechnician.full_name,
    technician_phone: testTechnician.phone
  };
  
  const result = await notifyTechnicianAssigned(
    complaintWithTech,
    testCustomer,
    testTechnician
  );
  
  console.log('Email Result:', result.email);
  console.log('SMS Result:', result.sms);
  console.log('✓ Check customer email and phone!\n');
}

async function testStatusUpdate() {
  console.log('\n🧪 TEST 5: Status Update Notification');
  console.log('='.repeat(50));
  
  const result = await notifyStatusUpdate(
    testComplaint,
    testCustomer,
    'Open',
    'In Progress'
  );
  
  console.log('Email Result:', result.email);
  console.log('SMS Result:', result.sms);
  console.log('✓ Check customer email and phone!\n');
}

async function testComplaintCompleted() {
  console.log('\n🧪 TEST 6: Complaint Completed Notification');
  console.log('='.repeat(50));
  
  const completedComplaint = {
    ...testComplaint,
    status: 'Completed',
    completion_date: new Date(),
    technician_name: testTechnician.full_name
  };
  
  const result = await notifyComplaintCompleted(completedComplaint, testCustomer);
  
  console.log('Email Result:', result.email);
  console.log('SMS Result:', result.sms);
  console.log('✓ Check customer email and phone!\n');
}

async function testTechnicianTaskAssigned() {
  console.log('\n🧪 TEST 7: Technician Task Assignment Notification');
  console.log('='.repeat(50));
  
  const result = await notifyTechnicianTaskAssigned(
    testComplaint,
    testTechnician,
    testCustomer
  );
  
  console.log('Email Result:', result.email);
  console.log('SMS Result:', result.sms);
  console.log('✓ Check technician email and phone!\n');
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   SALESCARE NOTIFICATION SYSTEM - TEST SUITE   ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('\nConfiguration:');
  console.log('- Email Enabled:', process.env.EMAIL_ENABLED || 'false');
  console.log('- SMS Enabled:', process.env.SMS_ENABLED || 'false');
  console.log('- Test Customer Email:', testCustomer.email);
  console.log('- Test Customer Phone:', testCustomer.phone);
  console.log('- Test Technician Email:', testTechnician.email);
  console.log('- Test Technician Phone:', testTechnician.phone);
  
  console.log('\n⚠️  IMPORTANT: Update test emails and phones above before running!\n');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Run tests one by one
    await testBasicEmail();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testBasicSMS();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testComplaintRegistered();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testTechnicianAssigned();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testStatusUpdate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testComplaintCompleted();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testTechnicianTaskAssigned();
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║         ALL TESTS COMPLETED! ✓                 ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\nCheck your email inbox and phone for messages!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
  }
}

// Run individual test or all tests
const testName = process.argv[2];

if (testName) {
  const tests = {
    'email': testBasicEmail,
    'sms': testBasicSMS,
    'registered': testComplaintRegistered,
    'assigned': testTechnicianAssigned,
    'status': testStatusUpdate,
    'completed': testComplaintCompleted,
    'tech': testTechnicianTaskAssigned
  };
  
  if (tests[testName]) {
    console.log(`\nRunning single test: ${testName}\n`);
    tests[testName]();
  } else {
    console.log('\n❌ Unknown test. Available tests:');
    console.log('- email       : Test basic email');
    console.log('- sms         : Test basic SMS');
    console.log('- registered  : Test complaint registered notification');
    console.log('- assigned    : Test technician assigned notification');
    console.log('- status      : Test status update notification');
    console.log('- completed   : Test complaint completed notification');
    console.log('- tech        : Test technician task assigned notification');
    console.log('\nOr run without arguments to run all tests.\n');
  }
} else {
  runAllTests();
}
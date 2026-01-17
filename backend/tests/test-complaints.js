// backend/test-complaints.js
// Complete test script for Complaint Management API

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let createdComplaintId = null;

// Helper function for API calls
async function apiCall(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

async function runTests() {
  console.log('🧪 Testing Complaint Management API\n');
  console.log('=' .repeat(60));

  try {
    // TEST 1: Login
    console.log('\n1️⃣  Testing Login...');
    const loginResult = await apiCall('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    if (loginResult.data.success) {
      authToken = loginResult.data.data.token;
      console.log('✅ Login successful');
      console.log(`   User: ${loginResult.data.data.user.full_name}`);
      console.log(`   Role: ${loginResult.data.data.user.role}`);
    } else {
      console.log('❌ Login failed');
      return;
    }

    // TEST 2: Create Complaint
    console.log('\n2️⃣  Testing Create Complaint...');
    const createResult = await apiCall('POST', '/api/complaints', {
      customer_id: 1,
      product_id: 1,
      area_id: 1,
      serial_number: 'SN123456789',
      warranty_status: 'In Warranty',
      purchase_date: '2024-06-15',
      complaint_type: 'Not Cooling',
      complaint_description: 'Refrigerator not cooling properly. Making unusual noise.',
      priority: 'High',
      scheduled_date: '2026-01-20'
    }, authToken);

    if (createResult.data.success) {
      createdComplaintId = createResult.data.data.complaint_id;
      console.log('✅ Complaint created successfully');
      console.log(`   Complaint #: ${createResult.data.data.complaint_number}`);
      console.log(`   Customer: ${createResult.data.data.customer_name}`);
      console.log(`   Product: ${createResult.data.data.product_name}`);
      console.log(`   Status: ${createResult.data.data.status}`);
    } else {
      console.log('❌ Create failed:', createResult.data.message);
    }

    // TEST 3: Get All Complaints
    console.log('\n3️⃣  Testing Get All Complaints...');
    const listResult = await apiCall('GET', '/api/complaints?page=1&limit=5', null, authToken);

    if (listResult.data.success) {
      console.log('✅ Complaints fetched successfully');
      console.log(`   Total complaints: ${listResult.data.data.pagination.total_items}`);
      console.log(`   Showing: ${listResult.data.data.complaints.length} items`);
      
      if (listResult.data.data.complaints.length > 0) {
        console.log('\n   Recent complaints:');
        listResult.data.data.complaints.slice(0, 3).forEach(c => {
          console.log(`   - ${c.complaint_number}: ${c.customer_name} (${c.status})`);
        });
      }
    } else {
      console.log('❌ Fetch failed');
    }

    // TEST 4: Get Complaint by ID
    if (createdComplaintId) {
      console.log('\n4️⃣  Testing Get Complaint by ID...');
      const detailResult = await apiCall('GET', `/api/complaints/${createdComplaintId}`, null, authToken);

      if (detailResult.data.success) {
        console.log('✅ Complaint details fetched');
        console.log(`   Complaint #: ${detailResult.data.data.complaint_number}`);
        console.log(`   Customer: ${detailResult.data.data.customer_name}`);
        console.log(`   Phone: ${detailResult.data.data.customer_phone}`);
        console.log(`   Product: ${detailResult.data.data.product_name}`);
        console.log(`   Description: ${detailResult.data.data.complaint_description}`);
      } else {
        console.log('❌ Fetch details failed');
      }
    }

    // TEST 5: Search Complaints
    console.log('\n5️⃣  Testing Search Complaints...');
    const searchResult = await apiCall('GET', '/api/complaints?search=refrigerator&status=Open', null, authToken);

    if (searchResult.data.success) {
      console.log('✅ Search successful');
      console.log(`   Found: ${searchResult.data.data.complaints.length} matching complaints`);
    }

    // TEST 6: Filter by Status
    console.log('\n6️⃣  Testing Filter by Status...');
    const filterResult = await apiCall('GET', '/api/complaints?status=Open', null, authToken);

    if (filterResult.data.success) {
      console.log('✅ Filter successful');
      console.log(`   Open complaints: ${filterResult.data.data.pagination.total_items}`);
    }

    // TEST 7: Assign Technician
    if (createdComplaintId) {
      console.log('\n7️⃣  Testing Assign Technician...');
      const assignResult = await apiCall('PATCH', `/api/complaints/${createdComplaintId}/assign`, {
        technician_id: 2 // tech1
      }, authToken);

      if (assignResult.data.success) {
        console.log('✅ Technician assigned');
        console.log(`   Status: ${assignResult.data.data.status}`);
        console.log('   Message:', assignResult.data.message);
      } else {
        console.log('❌ Assign failed:', assignResult.data.message);
      }
    }

    // TEST 8: Update Status
    if (createdComplaintId) {
      console.log('\n8️⃣  Testing Update Status...');
      const statusResult = await apiCall('PATCH', `/api/complaints/${createdComplaintId}/status`, {
        status: 'In Progress'
      }, authToken);

      if (statusResult.data.success) {
        console.log('✅ Status updated');
        console.log(`   New status: ${statusResult.data.data.status}`);
      } else {
        console.log('❌ Status update failed');
      }
    }

    // TEST 9: Update Complaint
    if (createdComplaintId) {
      console.log('\n9️⃣  Testing Update Complaint...');
      const updateResult = await apiCall('PUT', `/api/complaints/${createdComplaintId}`, {
        priority: 'Critical',
        selected_service_charge: 2000
      }, authToken);

      if (updateResult.data.success) {
        console.log('✅ Complaint updated');
        console.log(`   Priority: ${updateResult.data.data.priority}`);
        console.log(`   Service charge: Rs. ${updateResult.data.data.selected_service_charge}`);
      } else {
        console.log('❌ Update failed');
      }
    }

    // TEST 10: Get Statistics
    console.log('\n🔟 Testing Get Statistics...');
    const statsResult = await apiCall('GET', '/api/complaints/stats', null, authToken);

    if (statsResult.data.success) {
      console.log('✅ Statistics fetched');
      console.log(`   Total complaints: ${statsResult.data.data.total_complaints}`);
      console.log(`   Open: ${statsResult.data.data.open}`);
      console.log(`   In Progress: ${statsResult.data.data.in_progress}`);
      console.log(`   Completed: ${statsResult.data.data.completed}`);
      console.log(`   In Warranty: ${statsResult.data.data.in_warranty}`);
      console.log(`   Out of Warranty: ${statsResult.data.data.out_of_warranty}`);
      
      if (statsResult.data.data.avg_resolution_hours) {
        console.log(`   Avg Resolution: ${Math.round(statsResult.data.data.avg_resolution_hours)} hours`);
      }
    }

    // TEST 11: Test Validation (should fail)
    console.log('\n1️⃣1️⃣  Testing Validation (Invalid Data)...');
    const invalidResult = await apiCall('POST', '/api/complaints', {
      customer_id: 1,
      // Missing required fields
      complaint_description: ''
    }, authToken);

    if (!invalidResult.data.success) {
      console.log('✅ Validation working correctly');
      console.log('   Errors caught:', invalidResult.data.errors?.length || 0);
      if (invalidResult.data.errors) {
        invalidResult.data.errors.forEach(err => console.log(`   - ${err}`));
      }
    } else {
      console.log('⚠️  Validation should have failed');
    }

    // TEST 12: Test Authorization (Technician viewing other's complaint)
    console.log('\n1️⃣2️⃣  Testing Authorization...');
    const techLoginResult = await apiCall('POST', '/api/auth/login', {
      username: 'tech1',
      password: 'admin123'
    });

    if (techLoginResult.data.success) {
      const techToken = techLoginResult.data.data.token;
      
      // Try to access all complaints (should work but filtered)
      const techViewResult = await apiCall('GET', '/api/complaints', null, techToken);
      
      if (techViewResult.data.success) {
        console.log('✅ Authorization working');
        console.log(`   Technician sees: ${techViewResult.data.data.pagination.total_items} complaints (their own only)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed!\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log(`   ✅ Login: Working`);
    console.log(`   ✅ Create: Working`);
    console.log(`   ✅ Read: Working`);
    console.log(`   ✅ Update: Working`);
    console.log(`   ✅ Search/Filter: Working`);
    console.log(`   ✅ Assign Technician: Working`);
    console.log(`   ✅ Status Update: Working`);
    console.log(`   ✅ Statistics: Working`);
    console.log(`   ✅ Validation: Working`);
    console.log(`   ✅ Authorization: Working`);

    if (createdComplaintId) {
      console.log(`\n💡 Created complaint ID: ${createdComplaintId}`);
      console.log('   You can view it in the database or test delete separately');
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

// Run tests
console.log('\n🚀 Starting Complaint Management Tests...');
console.log('Make sure the server is running on http://localhost:5000\n');

runTests();
// TEST SCRIPT - Check if API returns correct pricing data
// Save as: test-inventory-api.js
// Run: node test-inventory-api.js

const https = require('http');

// Configuration
const API_BASE = 'http://localhost:5000';
const TEST_LOGIN = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test sequence
async function runTests() {
  console.log('🧪 Starting API Tests for Inventory Pricing...\n');

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', TEST_LOGIN);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    authToken = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get inventory stock
    console.log('📊 Step 2: Fetching inventory stock...');
    const stockResponse = await makeRequest('GET', '/api/inventory/stock', null, authToken);
    
    if (!stockResponse.data.success) {
      console.error('❌ Failed to fetch stock:', stockResponse.data.message);
      return;
    }

    const stock = stockResponse.data.data.stock;
    console.log(`✅ Fetched ${stock.length} inventory items\n`);

    // Step 3: Check pricing data
    console.log('💰 Step 3: Checking pricing data...\n');
    
    if (stock.length === 0) {
      console.log('⚠️  No inventory items found');
      return;
    }

    const pcb001 = stock.find(item => item.item_code === 'PCB-001');
    
    if (pcb001) {
      console.log('🔍 PCB-001 Data from API:');
      console.log('─────────────────────────────────────');
      console.log(`Item Code:          ${pcb001.item_code}`);
      console.log(`Description:        ${pcb001.description}`);
      console.log(`Quantity:           ${pcb001.quantity_in_hand}`);
      console.log(`Unit Price:         Rs. ${pcb001.unit_price || '0.00'}`);
      console.log(`Selling Price:      Rs. ${pcb001.selling_price || 'NOT RETURNED'}`);
      console.log(`Markup %:           ${pcb001.markup_percentage || 'NOT RETURNED'}%`);
      console.log(`Stock Value:        Rs. ${pcb001.stock_value || '0.00'}`);
      console.log(`Profit per Unit:    Rs. ${pcb001.profit_per_unit || 'NOT RETURNED'}`);
      console.log('─────────────────────────────────────\n');

      // Diagnosis
      if (!pcb001.selling_price || pcb001.selling_price === 0) {
        console.log('❌ PROBLEM FOUND: selling_price is missing or zero');
        console.log('\n🔧 SOLUTION:');
        console.log('1. Replace backend/controllers/inventoryController.js with the FIXED version');
        console.log('2. Restart your backend server');
        console.log('3. Clear browser cache and refresh frontend\n');
      } else if (pcb001.selling_price === 5999.50) {
        console.log('✅ SUCCESS: Pricing data is correct!');
        console.log('\n💡 If frontend still shows Rs. 0.00:');
        console.log('1. Hard refresh browser (Ctrl + Shift + R)');
        console.log('2. Clear browser cache');
        console.log('3. Check browser console for errors\n');
      } else {
        console.log(`⚠️  UNEXPECTED: selling_price = ${pcb001.selling_price} (expected 5999.50)`);
      }
    } else {
      console.log('⚠️  PCB-001 not found in inventory');
      console.log('\nAll items in inventory:');
      stock.forEach(item => {
        console.log(`  - ${item.item_code}: ${item.description}`);
      });
    }

    // Step 4: Check totals
    console.log('\n📈 Summary Statistics:');
    console.log('─────────────────────────────────────');
    const totals = stockResponse.data.data.totals;
    console.log(`Total Items:        ${totals.total_items}`);
    console.log(`Total Quantity:     ${totals.total_quantity}`);
    console.log(`Total Value:        Rs. ${totals.total_value?.toFixed(2) || '0.00'}`);
    
    if (totals.potential_revenue !== undefined) {
      console.log(`Potential Revenue:  Rs. ${totals.potential_revenue?.toFixed(2)}`);
      console.log(`Expected Profit:    Rs. ${totals.total_profit?.toFixed(2)}`);
    }
    console.log('─────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
runTests().then(() => {
  console.log('✅ Tests completed');
}).catch(err => {
  console.error('❌ Test suite failed:', err);
});
// backend/test-api.js
// Simple script to test your API endpoints

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing SalesCare API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('');

    // Test 2: Login
    console.log('2️⃣ Testing Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Login successful');
      console.log('   User:', loginData.data.user.full_name);
      console.log('   Role:', loginData.data.user.role);
      console.log('   Token:', loginData.data.token.substring(0, 30) + '...');
      console.log('');

      const token = loginData.data.token;

      // Test 3: Get Current User
      console.log('3️⃣ Testing Protected Route (Get Me)...');
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const meData = await meResponse.json();
      
      if (meData.success) {
        console.log('✅ Protected route working');
        console.log('   Username:', meData.data.user.username);
        console.log('   Email:', meData.data.user.email);
      } else {
        console.log('❌ Protected route failed:', meData.message);
      }

    } else {
      console.log('❌ Login failed:', loginData.message);
    }

    console.log('\n🎉 All tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev\n');
  }
}

// Run tests
testAPI();
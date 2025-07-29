const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:3000/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@protakeoff.com',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('Admin login response:', data);
    
    if (data.success) {
      console.log('✅ Admin login successful');
      console.log('Token:', data.data.token);
      
      // Test the token with a contact endpoint
      const contactResponse = await fetch('http://localhost:3000/api/contact/admin/stats', {
        headers: {
          'Authorization': `Bearer ${data.data.token}`
        }
      });
      
      const contactData = await contactResponse.json();
      console.log('Contact stats response:', contactData);
      
    } else {
      console.log('❌ Admin login failed:', data.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAdminLogin();
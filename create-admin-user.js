const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/protakeoff', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@protakeoff.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const adminUser = new User({
      email: 'admin@protakeoff.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      company: 'ProTakeoff',
      role: 'admin',
      isVerified: true,
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AS',
        zipCode: '12345'
      }
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@protakeoff.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser(); 
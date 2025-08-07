const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs");
const path = require("path");
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const takeoffRoutes = require('./routes/takeoff');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const contactRoutes = require('./routes/contact');
const promoCodeRoutes = require('./routes/promoCode');

const app = express();

const PORT = process.env.PORT || 3000;

dotenv.config();

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || 
                    process.env.NODE_ENV === 'production' || 
                    process.env.VERCEL_ENV || 
                    process.env.VERCEL_URL;

// Ensure uploads directory exists (only for local development)
if (!isServerless) {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
  }
}

app.use(express.json());
// CORS setup for credentials and specific origin   
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    "https://protakeoff-dev-backend.onrender.com",
    "https://pro-take-off.vercel.app",
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Serve static files from uploads directory with error handling (only for local development)
if (!isServerless) {
  app.use('/uploads', (req, res, next) => {
    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    next();
  }, express.static(path.join(__dirname, 'uploads')));
}

app.use('/api/takeoffs', takeoffRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/promocodes', promoCodeRoutes);

app.get("/", (req, res) => {
    res.send("Hello World");
});

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI environment variable is not set");
      return;
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("MongoDB connected");
    console.log("MongoDB URI:", process.env.MONGO_URI);
    console.log("Database name:", mongoose.connection.db.databaseName);
    
    // Test Contact model
    const Contact = require('./models/Contact');
    const contactCount = await Contact.countDocuments();
    console.log("Total contacts in database:", contactCount);
    
    // Seed default admin user if not exists
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@protakeoff.com';
    const adminPassword = 'admin123';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        admin = new User({
            email: adminEmail,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            company: 'ProTakeoff',
            role: 'admin',
            isVerified: true
        });
        await admin.save();
        console.log('Default admin user created:', adminEmail, '/', adminPassword);
    } else {
        console.log('Default admin user already exists:', adminEmail);
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Don't crash the app, just log the error
  }
};

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log("Server is running on port 3000");
  });
}

// Connect to database
connectDB();

// Export for Vercel serverless
module.exports = app;
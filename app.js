const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const takeoffRoutes = require('./routes/takeoff');

const app = express();

const PORT = process.env.PORT || 3000;

dotenv.config();
app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/takeoffs', takeoffRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port 3000");
});

app.get("/", (req, res) => {
    res.send("Hello World");
});


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log("MongoDB connected");
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
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});
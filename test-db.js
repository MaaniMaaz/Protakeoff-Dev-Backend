const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Import Contact model
    const Contact = require('./models/Contact');

    // Test fetching all contacts
    const allContacts = await Contact.find({});
    console.log('All contacts in database:', allContacts.length);
    console.log('Sample contact:', allContacts[0]);

    // Test with the same query as the admin panel
    const contacts = await Contact.find({})
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(10);

    console.log('Contacts with query:', contacts.length);
    console.log('Query result:', contacts);

    mongoose.connection.close();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabase();
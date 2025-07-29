const Contact = require('../models/Contact');
const { sendEmail } = require('../utils/email');
const { validationResult } = require('express-validator');

// Submit contact form
const submitContact = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, company, phone, message } = req.body;

    console.log('Submitting contact form with data:', { name, email, company, phone, message });

    // Create contact submission
    const contact = new Contact({
      name,
      email,
      company: company || '',
      phone,
      message,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      source: 'contact_form'
    });

    console.log('Created contact object:', contact);

    await contact.save();
    console.log('Contact saved successfully with ID:', contact._id);

    // Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@protakeoff.com';
    const emailSubject = `New Contact Form Submission from ${name}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">New Contact Form Submission</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Contact Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #059669;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Submission Details:</strong></p>
          <p style="margin: 5px 0;">Date: ${new Date().toLocaleString()}</p>
          <p style="margin: 5px 0;">IP Address: ${req.ip || req.connection.remoteAddress}</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.ADMIN_PANEL_URL || 'http://localhost:3000/admin'}/contacts" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Admin Panel
          </a>
        </div>
      </div>
    `;

    // Send email to admin
    await sendEmail({
      to: adminEmail,
      subject: emailSubject,
      html: emailHtml,
      replyTo: email
    });

    // Send confirmation email to user
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Thank you for contacting ProTakeoff.ai!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Message:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 5px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <p>If you have any urgent questions, please call us at +1 (555) 123-4567.</p>
        <p>Best regards,<br>The ProTakeoff.ai Team</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Thank you for contacting ProTakeoff.ai',
      html: userEmailHtml
    });

    console.log('Contact form submission completed successfully');

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon!',
      data: {
        id: contact._id,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.'
    });
  }
};

// Get all contacts (admin only)
const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    console.log('getAllContacts called with query:', req.query);

    let query = {};
    
    // Filter by status - only add if status is provided and not 'all' or 'undefined'
    if (status && status !== 'all' && status !== 'undefined') {
      query.status = status;
    }

    // Search functionality - only add if search is provided and not 'undefined'
    if (search && search !== 'undefined') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    // First, let's check if there are any contacts at all
    const allContacts = await Contact.find({});
    console.log('All contacts in database:', allContacts.length);
    console.log('Sample contact:', allContacts[0]);

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found contacts with query:', contacts.length);
    console.log('Query result:', contacts);

    const total = await Contact.countDocuments(query);

    console.log('Total contacts matching query:', total);

    const response = {
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalContacts: total,
          hasNextPage: skip + contacts.length < total,
          hasPrevPage: page > 1
        }
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));

    res.json(response);

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
};

// Get contact by ID (admin only)
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
};

// Update contact status (admin only)
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });

  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status'
    });
  }
};

// Delete contact (admin only)
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
};

// Get contact statistics (admin only)
const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalContacts = await Contact.countDocuments();
    const todayContacts = await Contact.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    const statsMap = {
      new: 0,
      read: 0,
      replied: 0,
      archived: 0
    };

    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        total: totalContacts,
        today: todayContacts,
        byStatus: statsMap
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics'
    });
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStats
};
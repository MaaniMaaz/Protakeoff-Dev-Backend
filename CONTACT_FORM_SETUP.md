# Contact Form Setup Guide

## Overview
The contact form system allows users to submit contact forms which are stored in the database and trigger email notifications to both the admin and the user.

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Admin Email for Contact Form Notifications
ADMIN_EMAIL=admin@protakeoff.com

# Admin Panel URL
ADMIN_PANEL_URL=http://localhost:3000/admin

# Client URL for CORS
CLIENT_URL=http://localhost:8080
```

## Gmail Setup for SMTP

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a password for "Mail"
   - Use this password as `EMAIL_PASSWORD`

## API Endpoints

### Public Endpoints
- `POST /api/contact/submit` - Submit contact form

### Admin Endpoints (require authentication)
- `GET /api/contact/admin/all` - Get all contacts with pagination
- `GET /api/contact/admin/stats` - Get contact statistics
- `GET /api/contact/admin/:id` - Get specific contact
- `PATCH /api/contact/admin/:id/status` - Update contact status
- `DELETE /api/contact/admin/:id` - Delete contact

## Contact Status Values
- `new` - New submission (default)
- `read` - Admin has read the message
- `replied` - Admin has replied to the user
- `archived` - Contact archived

## Features

### Frontend Integration
- Form validation (client-side and server-side)
- Real-time error handling
- Success notifications
- Email confirmation to user

### Admin Panel Features
- View all contact submissions
- Filter by status
- Search by name, email, or message
- Update contact status
- Delete contacts
- Copy email addresses
- Contact statistics dashboard

### Email Notifications
- Admin receives detailed email with contact information
- User receives confirmation email
- Professional HTML email templates
- Reply-to functionality for easy response

## Database Schema

The Contact model includes:
- name, email, company, phone, message
- status tracking
- IP address and user agent
- timestamps
- source tracking

## Testing

1. Start the backend server
2. Submit a contact form from the frontend
3. Check the database for the new contact
4. Verify email notifications are sent
5. Test admin panel functionality

## Troubleshooting

### Email Issues
- Verify Gmail app password is correct
- Check if 2FA is enabled
- Ensure EMAIL_USER and EMAIL_PASSWORD are set

### Database Issues
- Verify MongoDB connection
- Check if Contact model is properly imported

### Frontend Issues
- Verify API_BASE_URL is correct
- Check CORS configuration
- Ensure toast notifications are working
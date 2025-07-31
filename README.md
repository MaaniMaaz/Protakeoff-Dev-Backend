# ProTakeoff Backend

A Node.js backend for the ProTakeoff platform, providing APIs for takeoff management, user authentication, and order processing.

## Features

- **User Authentication**: JWT-based authentication with user registration and login
- **Takeoff Management**: CRUD operations for construction takeoffs with file uploads
- **Order Processing**: Stripe integration for payment processing
- **Email Notifications**: Order confirmation emails with download links
- **Admin Panel**: Comprehensive admin interface for managing users, orders, and content
- **File Management**: Cloudinary integration for secure file storage and delivery

## Email Features

### Order Confirmation Emails
- **Automatic Sending**: Emails are sent automatically when orders are completed
- **Rich Content**: Includes order details, item list, and download links
- **Professional Design**: Responsive HTML email template with ProTakeoff branding
- **Admin Controls**: Admins can resend emails from the admin panel

### Email Configuration
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login

### Takeoffs
- `GET /api/takeoffs` - Get all takeoffs
- `POST /api/takeoffs` - Create new takeoff
- `PUT /api/takeoffs/:id` - Update takeoff
- `DELETE /api/takeoffs/:id` - Delete takeoff

### Orders
- `POST /api/cart/checkout` - Process order with payment
- `GET /api/cart/orders/user/:email` - Get user orders
- `GET /api/cart/orders/:orderId` - Get specific order
- `POST /api/order/resend-email/:orderId` - Resend order confirmation email

### Admin
- `GET /api/users` - Get all users
- `GET /api/orders/transactions` - Get all transactions
- `GET /api/contact/admin/all` - Get all contact submissions

## Environment Variables

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=https://your-frontend-domain.com
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

## Testing

### Email Testing
```bash
node test-order-email.js
```

This will test the order confirmation email functionality with sample data.

## Deployment

The backend is configured for deployment on Vercel with serverless functions. All environment variables should be set in the Vercel dashboard.

## Documentation

- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [Order Email Feature](./ORDER_EMAIL_FEATURE.md)
- [Contact Form Setup](./CONTACT_FORM_SETUP.md)
- [PDF Functionality](./PDF_FUNCTIONALITY.md) 
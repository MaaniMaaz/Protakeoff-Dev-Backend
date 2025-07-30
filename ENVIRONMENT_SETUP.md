
# Environment Variables Setup

This application requires the following environment variables to be set in your Vercel deployment:

## Required Environment Variables

### MongoDB Connection
```
MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority
```

### JWT Secret
```
JWT_SECRET=your-super-secret-jwt-key-here
```

### Email Configuration (Gmail)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Frontend URLs
```
FRONTEND_URL=https://your-frontend-domain.com
CLIENT_URL=https://your-frontend-domain.com
```

### Node Environment
```
NODE_ENV=production
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable with its corresponding value

## Gmail App Password Setup

For email functionality, you need to create an App Password:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > App passwords
4. Generate a new app password for "Mail"
5. Use this password as `EMAIL_PASSWORD`

## Testing the Setup

After setting the environment variables, deploy your application and test the following endpoints:

- `GET /` - Should return "Hello World"
- `POST /api/auth/login` - Test authentication
- `POST /api/auth/admin-login` - Test admin login

## Troubleshooting

If the function still crashes:

1. Check Vercel function logs for specific error messages
2. Ensure all environment variables are set correctly
3. Verify MongoDB connection string is valid
4. Check that JWT_SECRET is a strong, random string 
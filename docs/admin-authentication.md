# Admin Authentication Setup

Dasharr includes single-user authentication for the admin panel.

## Initial Setup

When you first access `/admin`, you'll be redirected to the login page.

### First Time Setup

1. Navigate to `/admin/login`
2. Click **"Enable Admin Login"**
3. Enter your email and password
4. Click **"Create Admin Account"**

**Note**: Only one admin account can be created. This is by design for security in self-hosted environments.

## Features

- **Session-based authentication** - Secure httpOnly cookies
- **Persistent sessions** - 7-day session duration
- **SQLite database** - Auth data stored in `/app/config/dasharr-auth.db`
- **Protected routes** - All `/admin/*` routes require authentication
- **Logout functionality** - Available in the admin sidebar

## Security Notes

1. **Change default password** - If using the init script, change the password after first login
2. **Use HTTPS in production** - Authentication cookies require secure connections
3. **Database location** - Auth database is stored separately from main database

## Troubleshooting

### Can't access admin panel
- Ensure you've created an admin account
- Check browser cookies are enabled
- Clear browser cache and cookies if issues persist

### Lost password
- Password reset via email is coming soon
- For now: Delete `/app/config/dasharr-auth.db` and re-enable admin login
- Or use Docker: `docker exec dasharr rm /app/config/dasharr-auth.db`

## Future Features

- **Email-based password reset** - SMTP configuration for password recovery
- **Two-factor authentication** - Additional security layer
- **Session management** - View and revoke active sessions
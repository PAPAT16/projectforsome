# Food Truck Live Setup Guide

**A product of Energe Financial Corp LLC**

## Initial Setup

### 1. Developer Quick Login (Development Only)

For easy testing during development, click the **Developer Quick Login** button (Code icon) in the bottom-left corner. This provides one-click access to:

- **Admin Account**: Full admin panel access
- **Food Truck Owner**: Taco Paradise owner account
- **Customer Account**: Regular customer view

This button only appears in development mode and will not show in production builds.

### 2. Seed Sample Data (SUPER EASY!)

To populate your database with sample food trucks and accounts:

**Method 1 - Click the Database Button (Easiest!):**
1. Look for the **blue Database icon** button in the bottom-left corner (above the Code icon)
2. Click it
3. Confirm the action
4. Wait 5-10 seconds
5. Page will auto-refresh with 6 sample food trucks visible on the map!

**Method 2 - Browser Console:**
1. Open the app in your browser
2. Press F12 to open Developer Console
3. In the console, simply type: `seedDatabase()`
4. Press Enter
5. Wait for "Database seed completed!" message
6. Refresh the page

**What gets created:**
- 6 sample food trucks (all ACTIVE by default)
- Complete profiles with logos and descriptions
- Menu items for each truck
- 3 customer reviews per truck (4-5 star ratings)
- GPS locations in New York City area
- Sample customer accounts

### Sample Accounts Created

**Food Truck Owners:**
- tacoparadise@example.com
- burgerexpress@example.com
- sushiroll@example.com
- pizzaonwheels@example.com
- bbqheaven@example.com
- thaistreetkitchen@example.com

**Password for all accounts:** `Password123!`

### 3. Enable Google OAuth in Supabase (Optional)

To enable Google sign-in:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Providers**
3. Click on **Google** provider
4. Enable the provider
5. Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/):
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://[your-project-ref].supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase
7. Save the configuration

**Note**: If Google OAuth is not configured, the Google sign-in button will display an error. Users can still sign in with email/password.

### 4. Create an Admin Account

To create an admin account, use the Developer Quick Login in development, or manually update a user's role:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## PWA Installation

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. The app will now work like a native app

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. The app will now work like a native app

## Features

### For Customers
- Browse food trucks on an interactive map
- Search by name, cuisine, or location
- Filter by radius, cuisine type, and online status
- View truck profiles, menus, and reviews
- Featured highly-rated trucks section
- No sign-in required for browsing

### For Food Truck Owners
- Create and manage truck profile
- Toggle location on/off (requires subscription)
- Manage menu items
- Respond to customer reviews (premium feature)
- View subscription options

### For Admins
- View all users and food trucks
- Search users by ID, name, or email
- Block/unblock users
- Monitor subscription statuses
- View analytics

## Performance

The app includes:
- Code splitting for faster initial load
- Lazy loading of dashboard components
- Optimized bundle sizes
- PWA capabilities for offline functionality
- Responsive design for all devices

## Copyright

© 2025 Energe Financial Corp LLC. All rights reserved.

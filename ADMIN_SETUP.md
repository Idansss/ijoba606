# Admin Panel Setup Guide

## Overview

The admin panel has been completely revamped with:
- ✅ Unique admin dashboard at `/admin`
- ✅ Admin login page at `/admin/login` with access code
- ✅ Admin registration page at `/admin/register` with registration code
- ✅ User management (view users, make users admin)
- ✅ Quick navigation to all admin features

## Access Codes

**IMPORTANT:** Change these codes in production!

### Admin Access Code
- **Location:** `app/admin/login/page.tsx`
- **Current Code:** `IJ606-ADMIN-2024`
- **Purpose:** Allows existing admins to access the admin panel

### Admin Registration Code
- **Location:** `app/admin/register/page.tsx`
- **Current Code:** `IJ606-REGISTER-2024`
- **Purpose:** Allows users to register as admin (updates their role in Firestore)

## How to Use

### For New Admins (First Time Setup)

1. **Sign in** to the application with your regular account
2. **Go to** `/admin/register`
3. **Enter** the registration code: `IJ606-REGISTER-2024`
4. **Click** "Register as Admin"
5. Your role will be updated to `admin` in Firestore
6. You'll be redirected to `/admin` dashboard

### For Existing Admins

1. **Sign in** to the application
2. **Go to** `/admin/login`
3. **Enter** the access code: `IJ606-ADMIN-2024`
4. **Click** "Verify Access"
5. You'll be redirected to `/admin` dashboard

### Direct Access

If you're already an admin, you can:
- Click "Admin Panel" in the header dropdown menu
- Navigate directly to `/admin`

## Admin Dashboard Features

### Overview Stats
- Total users count
- Admin count
- Moderator count
- Regular user count

### Quick Links
- **Question Management** - Create, edit, delete quiz questions
- **PAYE Rules** - Configure tax rules and calculator settings
- **Moderation** - Review reports and moderate content

### User Management
- **View all users** with search and filter
- **Change user roles** (User → Moderator → Admin)
- **See user details** (handle, UID, creation date)
- **Filter by role** (All, Admin, Moderator, User)

## Security Notes

⚠️ **Change the access codes before deploying to production!**

1. Update `ADMIN_ACCESS_CODE` in `app/admin/login/page.tsx`
2. Update `ADMIN_REGISTRATION_CODE` in `app/admin/register/page.tsx`
3. Consider using environment variables for these codes
4. Keep codes secure and only share with trusted administrators

## Making Users Admin Manually

If you need to make a user admin without using the registration page:

1. Go to Firebase Console → Firestore Database
2. Navigate to `users/{uid}`
3. Find the `role` field
4. Change from `"user"` to `"admin"`
5. Save

## Troubleshooting

**"Permission denied" when registering:**
- The Firestore security rules may prevent role updates
- An existing admin needs to manually update your role in Firestore
- Or update `firestore.rules` to allow self-role updates (not recommended for production)

**Can't access admin panel:**
- Make sure you're signed in
- Verify your role is `admin` in Firestore: `users/{your-uid}` → `role: "admin"`
- Try the login page: `/admin/login`

**User management not showing users:**
- Check Firestore permissions
- Verify you have admin role
- Check browser console for errors

## Next Steps

1. **Change the access codes** to something secure
2. **Test the registration flow** with a test account
3. **Test the login flow** with an admin account
4. **Verify user management** works correctly
5. **Update Firestore rules** if needed for role updates

---

🎉 **Admin panel is ready to use!**

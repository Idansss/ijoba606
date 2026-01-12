# Deploy Updated Firestore Rules

## What Was Fixed

1. **Fixed `hasRole()` function** - Now handles cases where user document doesn't exist yet
2. **Added notification read permission** - Users can now read their own notifications

## Deploy the Rules

Run these commands:

```bash
# Make sure you're logged in to Firebase
firebase login

# Deploy the updated rules
firebase deploy --only firestore:rules
```

## Verify Deployment

1. Go to Firebase Console → Firestore Database → Rules
2. Verify the rules match the updated `firestore.rules` file
3. The rules should show the updated `hasRole()` function

## After Deployment

1. Sign out and sign in again
2. The "Missing or insufficient permissions" error should be gone
3. You should be able to read user data and notifications

## Next: Deploy Cloud Functions

After fixing permissions, you still need to deploy Cloud Functions to fix the CORS error. See `FIX_PERMISSIONS_AND_CORS.md` for details.


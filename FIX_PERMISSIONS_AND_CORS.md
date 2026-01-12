# Fix Permissions and CORS Issues

## Issue 1: "Missing or insufficient permissions"

### Problem
After sign-in, Firestore rules are failing because the `hasRole()` function tries to read the user document, but it might not exist yet or the read is failing.

### Fix Applied
Updated `firestore.rules` to:
1. Handle cases where user document doesn't exist yet
2. Added read permission for notifications

### Deploy Updated Rules

```bash
# Make sure you're logged in to Firebase
firebase login

# Deploy the updated rules
firebase deploy --only firestore:rules
```

## Issue 2: CORS Error with Cloud Functions

### Problem
Cloud Functions are not deployed, so calls to `createThread` are failing with CORS errors.

### Solution Options

#### Option A: Deploy Cloud Functions (Recommended)

If you have Cloud Functions code:

1. **Check if you have a `functions` directory:**
   ```bash
   ls functions/
   ```

2. **If functions directory exists:**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

3. **If functions directory doesn't exist, you need to create it:**
   ```bash
   firebase init functions
   # Select TypeScript
   # Install dependencies
   ```

#### Option B: Use Direct Firestore Writes (Temporary Workaround)

If you can't deploy functions right now, you can temporarily allow direct writes to Firestore for forum threads. However, this bypasses validation, rate limiting, and other security features.

**⚠️ Warning:** This is less secure and should only be used temporarily.

Update `firestore.rules` to allow direct creation (already allows this, but verify):

```javascript
// Forum Threads
match /forumThreads/{tid} {
  allow read: if true; // Public read
  allow create: if isSignedIn() && 
                   request.resource.data.uid == request.auth.uid &&
                   request.resource.data.title.size() >= 10 &&
                   request.resource.data.title.size() <= 200 &&
                   request.resource.data.bodyMD.size() >= 20 &&
                   request.resource.data.bodyMD.size() <= 5000 &&
                   request.resource.data.tags.size() >= 1 &&
                   request.resource.data.tags.size() <= 3;
  // ... rest of rules
}
```

Then update the client code to write directly to Firestore instead of calling the function.

#### Option C: Configure CORS for HTTP Functions

If your functions are deployed as HTTP functions (not callable), you need to add CORS headers:

```typescript
import * as cors from 'cors';
const corsHandler = cors({ origin: true });

export const createThread = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Your function logic here
  });
});
```

But since you're using `functions.https.onCall()`, CORS should be handled automatically once functions are deployed.

## Recommended Steps

1. **Deploy updated Firestore rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Check if Cloud Functions are deployed:**
   - Go to Firebase Console → Functions
   - See if `createThread` function exists
   - If not, you need to deploy them

3. **If functions don't exist, create and deploy them:**
   - Follow the guide in `CLOUD_FUNCTIONS_GUIDE.md`
   - Or use the structure from the codebase
   - Deploy with: `firebase deploy --only functions`

4. **Verify the fix:**
   - Sign in again
   - Try creating a thread
   - Check browser console for errors

## Quick Test

After deploying rules, test in browser console:

```javascript
// Check if user document exists
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getCurrentUser } from '@/lib/firebase/auth';

const user = getCurrentUser();
if (user) {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  console.log('User doc exists:', userDoc.exists());
  console.log('User data:', userDoc.data());
}
```

## Next Steps

1. ✅ Deploy updated Firestore rules
2. ⚠️ Deploy Cloud Functions (or use direct Firestore writes as temporary workaround)
3. ✅ Test sign-in and thread creation
4. ✅ Verify permissions are working


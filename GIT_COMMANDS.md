# Git Commands to Push Changes

## Step-by-Step Commands

Run these commands in order:

```bash
# 1. Add all modified and new files
git add firestore.rules lib/firebase/functions.ts tsconfig.json
git add DEPLOY_FIREBASE_RULES.md FIX_PERMISSIONS_AND_CORS.md FIX_PROJECT_MISMATCH.md NETLIFY_ENV_VARIABLES.md

# 2. Commit with a descriptive message
git commit -m "fix: resolve Firestore permissions and CORS issues

- Fix hasRole() function to handle missing user documents
- Add Firestore fallback for createThread when functions unavailable
- Update Next.js to 16.1.1 to fix security vulnerability
- Add troubleshooting documentation"

# 3. Push to remote repository
git push origin main
```

## Alternative: Add All Files at Once

If you want to add all changes:

```bash
# Add all changes (modified + new files)
git add -A

# Commit
git commit -m "fix: resolve Firestore permissions and CORS issues

- Fix hasRole() function to handle missing user documents
- Add Firestore fallback for createThread when functions unavailable
- Update Next.js to 16.1.1 to fix security vulnerability
- Add troubleshooting documentation"

# Push
git push origin main
```

## After Pushing

1. Netlify will automatically detect the push and start a new deployment
2. Wait for the deployment to complete (2-3 minutes)
3. Test sign-in and thread creation on your live site

## If You Get Errors

If `git push` fails, you might need to pull first:

```bash
git pull origin main
# Resolve any conflicts if they occur
git push origin main
```


# Setup Guide: Cloud Scheduler & Firestore Rules

This guide walks you through setting up the 48-hour hold release scheduler and deploying Firestore rules.

## Option 1: Using Firebase Scheduled Functions (Recommended - Easiest)

The function is already configured as a scheduled function using Firebase's built-in scheduler. Just deploy it!

### Step 1: Deploy the Function

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:releaseHeldFunds
```

That's it! Firebase will automatically create the Cloud Scheduler job for you.

### Step 2: Verify It's Running

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ijoba606-778a1`
3. Navigate to **Functions** → **Scheduled Functions**
4. You should see `releaseHeldFunds` listed
5. Click on it to see the schedule: "every 1 hours"

---

## Option 2: Using Google Cloud Console (Manual Setup)

If you prefer to set it up manually or the automatic setup didn't work:

### Step 1: Get Your Function URL

After deploying, your function URL will be:
```
https://us-central1-ijoba606-778a1.cloudfunctions.net/releaseHeldFunds
```

### Step 2: Create Cloud Scheduler Job

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `ijoba606-778a1`
3. Navigate to **Cloud Scheduler** (search in top bar)
4. Click **CREATE JOB**

Fill in the form:
- **Name**: `release-held-funds`
- **Region**: `us-central1` (same as your function)
- **Frequency**: `0 * * * *` (every hour at minute 0)
- **Timezone**: `Africa/Lagos`
- **Target Type**: `HTTP`
- **URL**: `https://us-central1-ijoba606-778a1.cloudfunctions.net/releaseHeldFunds`
- **HTTP method**: `POST`
- **Auth header**: `Add OIDC token`
  - **Service account**: Select or create one with Cloud Functions Invoker role

5. Click **CREATE**

### Step 3: Test the Job

1. In Cloud Scheduler, find your job
2. Click the **⋮** menu → **RUN NOW**
3. Check the logs to verify it worked

---

## Deploy Firestore Rules

### Step 1: Review the Rules

The rules are in `firestore.rules`. They include permissions for:
- Bank accounts
- Refund requests
- Service completions
- Disputes
- Wallet transactions

### Step 2: Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### Step 3: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Verify the rules are updated

---

## Create Firestore Indexes

Firebase will prompt you with links when indexes are needed, but you can also create them manually:

### Step 1: Check Required Indexes

The following indexes are needed:

1. **walletTransactions**
   - Fields: `consultantUid` (Ascending), `createdAt` (Descending)
   - Collection: `walletTransactions`

2. **walletTransactions** (for hold release)
   - Fields: `fundStatus` (Ascending), `holdReleaseAt` (Ascending)
   - Collection: `walletTransactions`

3. **serviceCompletions**
   - Fields: `invoiceId` (Ascending)
   - Collection: `serviceCompletions`

4. **refundRequests**
   - Fields: `status` (Ascending), `createdAt` (Descending)
   - Collection: `refundRequests`

5. **disputes**
   - Fields: `status` (Ascending), `createdAt` (Descending)
   - Collection: `disputes`

### Step 2: Create Indexes via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database** → **Indexes**
3. Click **CREATE INDEX**
4. For each index above:
   - Select the collection
   - Add the fields in order
   - Set sort order (Ascending/Descending)
   - Click **CREATE**

### Step 3: Or Use firestore.indexes.json

You can also add them to `firestore.indexes.json` and deploy:

```json
{
  "indexes": [
    {
      "collectionGroup": "walletTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "consultantUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "walletTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fundStatus", "order": "ASCENDING" },
        { "fieldPath": "holdReleaseAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "serviceCompletions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "invoiceId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "refundRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "disputes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## Testing

### Test the Scheduled Function

1. **Manual Test**: Go to Cloud Scheduler → Run the job manually
2. **Check Logs**: 
   - Firebase Console → Functions → Logs
   - Or Cloud Console → Cloud Functions → Logs
3. **Verify Results**: Check that funds are being released after 48 hours

### Test Firestore Rules

Use the Firebase Console Rules Playground:
1. Go to Firestore → Rules
2. Click **Rules Playground**
3. Test different scenarios (read, write, etc.)

---

## Troubleshooting

### Scheduled Function Not Running

1. **Check Function Deployment**: Ensure `releaseHeldFunds` is deployed
2. **Check Cloud Scheduler**: Verify job exists and is enabled
3. **Check Logs**: Look for errors in function logs
4. **Check Permissions**: Ensure service account has Cloud Functions Invoker role

### Firestore Rules Errors

1. **Syntax Errors**: Check `firestore.rules` for syntax issues
2. **Deployment Failed**: Check Firebase CLI output for errors
3. **Permission Denied**: Verify rules allow the operations you're testing

### Index Errors

1. **Missing Index**: Firebase will show a link - click it to create
2. **Index Building**: Large indexes can take time to build
3. **Query Error**: Ensure your query matches the index exactly

---

## Quick Commands Summary

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only the scheduler function
firebase deploy --only functions:releaseHeldFunds

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only indexes
firebase deploy --only firestore:indexes

# View function logs
firebase functions:log --only releaseHeldFunds
```

---

## Next Steps

1. ✅ Deploy the scheduled function
2. ✅ Deploy Firestore rules
3. ✅ Create required indexes
4. ✅ Test the system with a real transaction
5. ✅ Monitor logs for the first few releases

# Complete Consultant Feature Implementation Guide

This document covers all enhancements and features of the Consultant system, including the latest updates.

## ✅ All Completed Features

### 1. **Bank Account Management with Paystack**
- **Consultant**: `/consultants/bank-account`
- **User**: `/settings/bank-account`
- **Features**:
  - Fetches Nigerian banks from Paystack API
  - Account number resolution to get account name
  - Read-only account name field after resolution
  - Save multiple bank accounts
  - Set default account
  - Delete accounts

### 2. **Service Completion Workflow**
- **Consultant marks complete**: `/consultants/invoices/[invoiceId]/complete`
- **User confirms**: `/dashboard/invoices/[invoiceId]/confirm`
- **Flow**:
  1. Consultant marks service as complete
  2. Invoice status: `in_progress` → `pending_confirmation`
  3. User receives notification
  4. User can:
     - **Accept**: Service confirmed → 48-hour hold period
     - **Dispute**: Raises dispute for admin review
  5. If accepted: Status → `pending_release` → After 48h → `completed`

### 3. **48-Hour Hold System**
- Funds show as "Pending (In Service)" during service
- After user confirmation: "Pending Release (48h hold)"
- After 48 hours: "Available" (credited to wallet)
- Cloud Function `releaseHeldFunds` checks and releases funds hourly

### 4. **Refund System**
- **Request refund**: `/dashboard/invoices/[invoiceId]/refund`
- **Features**:
  - Request refund for paid invoices
  - Select reason (service not provided, poor quality, dispute, other)
  - Use saved bank account for refund
  - Admin approval required
  - Status tracking (pending → processing → completed)

### 5. **Admin Transaction Monitoring**
- **Location**: `/admin/transactions`
- **Features**:
  - View all payment transactions
  - Monitor refund requests (approve/reject)
  - Resolve disputes
  - View transaction details
  - Filter by status

### 6. **Enhanced Wallet System**
- **Location**: `/consultants/wallet`
- **Features**:
  - **Available Balance**: Only credited funds (can withdraw)
  - **Pending Release**: Funds in 48-hour hold
  - **In Service**: Funds from active services
  - **Total Earnings**: All-time gross
  - Transaction history with fund status
  - Withdrawal using saved bank accounts

### 7. **Invoice Enhancements**
- User search/autocomplete in invoice creation
- VAT (7.5%) automatic calculation
- Paystack fees (1.5% + ₦100) automatic calculation
- Service status tracking
- Service completion actions

## 📋 Setup Instructions

### 1. Environment Variables

Add to `.env.local`, Netlify, and Firebase Functions:

```env
# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ijoba606.com
```

### 2. Paystack Configuration

1. **Webhook URL**: `https://us-central1-ijoba606-778a1.cloudfunctions.net/handlePaystackWebhook`
2. **Webhook Events**: `charge.success`
3. **Bank List API**: Public endpoint (no auth needed for GET)
4. **Account Resolution**: Requires public key

### 3. Cloud Scheduler (for 48-hour hold release)

Set up a Cloud Scheduler job to call `releaseHeldFunds` every hour:

```bash
gcloud scheduler jobs create http release-held-funds \
  --schedule="0 * * * *" \
  --uri="https://us-central1-ijoba606-778a1.cloudfunctions.net/releaseHeldFunds" \
  --http-method=POST \
  --oidc-service-account-email=YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com
```

Or use Firebase Console → Functions → Schedule function

### 4. Firestore Rules

Deploy updated rules:
```bash
firebase deploy --only firestore:rules
```

### 5. Firestore Indexes

Required indexes:
- `walletTransactions`: `consultantUid` + `createdAt`
- `walletTransactions`: `fundStatus` + `holdReleaseAt`
- `serviceCompletions`: `invoiceId`
- `refundRequests`: `status` + `createdAt`
- `disputes`: `status` + `createdAt`

Firebase will prompt with links if needed.

## 🔄 Complete User Flows

### Customer Flow:
1. Browse consultants → Select → Start chat
2. Receive invoice → Pay via Paystack
3. Service begins (status: `in_progress`)
4. Consultant marks complete → User notified
5. User confirms or disputes
6. If confirmed → 48-hour hold → Funds released to consultant
7. If dispute → Admin reviews → Resolution

### Consultant Flow:
1. Chat with customers
2. Create invoice (with user search, VAT, fees)
3. Customer pays → Funds show as "Pending (In Service)"
4. Provide service
5. Mark service as complete
6. User confirms → Funds show as "Pending Release (48h hold)"
7. After 48 hours → Funds become "Available"
8. Request withdrawal to bank account

## 💰 Wallet Fund Statuses

- **pending**: Service in progress (funds not available)
- **pending_release**: User confirmed, 48-hour hold active
- **credited**: Available for withdrawal

## 🔐 Security

- Bank accounts verified via Paystack resolution
- Only credited funds can be withdrawn
- Refunds require admin approval
- Disputes require admin resolution
- All transactions logged

## 📝 Next Steps (From Guide)

1. **Admin Panel**: Consultant management (view, approve, manage consultants)
2. **Push Notifications**: Browser push for chat messages
3. **Reviews**: Rating/review system after service completion
4. **Analytics**: Consultant performance metrics
5. **Email Integration**: Enhanced email templates
6. **File Uploads**: Profile images and document uploads

## 🐛 Troubleshooting

### Bank account resolution fails:
- Check `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set
- Verify account number is 10 digits
- Check bank code is correct

### Funds not releasing after 48 hours:
- Verify Cloud Scheduler is set up
- Check `releaseHeldFunds` function is deployed
- Check Firestore rules allow function updates

### Withdrawal not working:
- Ensure funds are in "credited" status
- Check bank account is saved and verified
- Verify sufficient available balance

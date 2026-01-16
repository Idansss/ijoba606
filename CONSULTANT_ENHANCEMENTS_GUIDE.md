# Consultant Feature Enhancements Guide

This document outlines all the enhancements made to the Consultant Feature, including setup instructions and implementation details.

## ✅ Completed Enhancements

### 1. **User Search/Autocomplete in Invoice Creation**
- **Location**: `app/consultants/invoices/create/page.tsx`
- **Features**:
  - Real-time user search with autocomplete suggestions
  - Search by name or user ID
  - Click to select customer
  - Pre-fills customer if `customerUid` is provided in URL

### 2. **VAT and Paystack Fees Calculation**
- **VAT**: 7.5% automatically calculated on subtotal
- **Paystack Fee**: 1.5% + ₦100 (customer bears all fees)
- **Total**: Subtotal + VAT + Paystack Fee
- All calculations are automatic and displayed clearly

### 3. **User Dashboard**
- **Location**: `app/dashboard/page.tsx`
- **Features**:
  - View all invoices
  - Filter by status (All, Pending Payment, In Progress, Completed)
  - Service status tracking
  - Quick payment buttons
  - Statistics overview

### 4. **Consultant Wallet System**
- **Location**: `app/consultants/wallet/page.tsx`
- **Features**:
  - View available balance
  - Total earnings tracking
  - Total withdrawn amount
  - Pending withdrawal requests
  - Transaction history (credit/debit)
  - Withdrawal request system
  - Bank account management

### 5. **Cloud Functions for Paystack Webhook**
- **Location**: `functions/src/index.ts` - `handlePaystackWebhook`
- **Features**:
  - Verifies Paystack webhook signature
  - Updates invoice status on payment
  - Creates payment transaction records
  - Credits consultant wallet automatically
  - Sends notifications to both parties
  - Sets service status to "in_progress" after payment

### 6. **Chat Notifications**
- **Location**: `functions/src/index.ts` - `sendChatNotification`
- **Features**:
  - Sends notifications when new messages arrive
  - Updates unread message counts
  - Creates notification records in Firestore

### 7. **Email Integration**
- **Location**: `functions/src/index.ts` - `sendInvoiceEmail`
- **Features**:
  - Sends invoice emails to customers
  - Includes invoice link and details
  - Professional HTML email template

## 📋 Setup Instructions

### 1. Environment Variables

Add to `.env.local`, Netlify, and Firebase Functions:

```env
# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Email (for invoice emails)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ijoba606.com
```

**Note**: 
- Get Paystack keys from [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
- For production, consider using SendGrid, Mailgun, or AWS SES

### 2. Paystack Webhook Configuration

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Navigate to "Webhooks"
3. Add webhook URL: `https://us-central1-ijoba606-778a1.cloudfunctions.net/handlePaystackWebhook`
4. Select events: `charge.success`
5. Copy the webhook secret and set it as `PAYSTACK_SECRET_KEY`

### 3. Firestore Security Rules

The rules have been updated to include:
- `consultantWallets` - Consultant read/write
- `walletTransactions` - Consultant read
- `withdrawalRequests` - Consultant read/write

**Deploy rules**:
```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 5. Firestore Indexes

You may need to create indexes for:
- `walletTransactions` queries with `consultantUid` and `createdAt`
- `withdrawalRequests` queries with `consultantUid` and `createdAt`

Firebase will prompt you with links if indexes are needed.

## 🔄 User Flows

### Customer Flow:
1. Browse consultants → Select consultant → Start chat
2. Receive invoice via chat or email
3. View invoice in dashboard (`/dashboard`)
4. Pay via Paystack
5. Service status updates to "In Progress"
6. Service completes → Status updates to "Completed"

### Consultant Flow:
1. Chat with customers
2. Create invoice with customer search
3. Invoice automatically includes VAT and Paystack fees
4. Send invoice via chat or email
5. Payment received → Wallet automatically credited
6. View wallet balance and earnings (`/consultants/wallet`)
7. Request withdrawal to bank account
8. Track all transactions

## 💰 Wallet System Details

### Earnings Calculation:
- **Consultant receives**: Subtotal + VAT (not Paystack fee)
- **Customer pays**: Subtotal + VAT + Paystack Fee

### Withdrawal Process:
1. Consultant requests withdrawal
2. Amount deducted from balance
3. Status: Pending → Processing → Completed
4. Transfer initiated via Paystack Transfer API (to be implemented)

### Transaction Types:
- **Credit**: Payment received, refunds
- **Debit**: Withdrawals, refunds to customers

## 📧 Email Configuration

### Gmail Setup:
1. Enable 2-Factor Authentication
2. Generate App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Use App Password as `EMAIL_PASSWORD`

### Production Email Services:
- **SendGrid**: Recommended for production
- **Mailgun**: Good for transactional emails
- **AWS SES**: Cost-effective for high volume

Update `getEmailTransporter()` in `functions/src/index.ts` accordingly.

## 🔐 Security Considerations

1. **Webhook Verification**: All Paystack webhooks are verified using HMAC SHA512
2. **Wallet Security**: Only consultants can access their own wallets
3. **Withdrawal Limits**: Consider implementing minimum withdrawal amounts
4. **Email Security**: Use environment variables for credentials

## 🚀 Next Steps

1. **Paystack Transfer API**: Implement actual bank transfers for withdrawals
2. **Email Templates**: Enhance email templates with branding
3. **Push Notifications**: Add browser push notifications for chat
4. **Service Management**: Allow consultants to mark services as completed
5. **Reviews**: Add rating system after service completion
6. **Analytics**: Track consultant performance metrics

## 📝 Notes

- All amounts in wallet are stored in **kobo** (multiply by 100 for Naira)
- Invoice amounts are in **Naira**
- Paystack amounts are in **kobo** (multiply by 100)
- VAT is 7.5% as per Nigeria tax law
- Paystack fee structure: 1.5% + ₦100 per transaction

## 🐛 Troubleshooting

### Webhook not receiving events:
- Verify webhook URL in Paystack dashboard
- Check `PAYSTACK_SECRET_KEY` is set correctly
- Check Firebase Functions logs

### Email not sending:
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- For Gmail, ensure App Password is used (not regular password)
- Check Firebase Functions logs for errors

### Wallet not updating:
- Verify webhook is processing correctly
- Check Firestore rules allow wallet updates
- Verify consultant UID matches

### Withdrawal not working:
- Ensure bank account details are correct
- Check Paystack Transfer API is configured
- Verify sufficient balance

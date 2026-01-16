# Consultant Feature Implementation Guide

This document outlines the complete Consultant Feature implementation for IJOBA 606, including setup instructions and feature overview.

## ✅ Completed Features

### 1. **Consultant Profile System**
- **Location**: `app/consultants/profile/page.tsx`
- **Features**:
  - Full profile creation/editing (LinkedIn/Upwork style)
  - Qualifications, certifications, work experience
  - Portfolio items
  - Hourly rates and availability status
  - Professional bio and specialties
- **Access**: Only approved consultants can access (checks `consultantApplications` status)

### 2. **Consultant Discovery**
- **Location**: `app/consultants/browse/page.tsx`
- **Features**:
  - Browse all active consultants
  - Search by name, specialty, or expertise
  - Filter by specialty
  - Sort by rating, experience, or client count
  - View consultant cards with key information
  - Direct chat button for authenticated users

### 3. **Real-Time Chat System**
- **Location**: `app/consultants/chat/[consultantId]/page.tsx`
- **Features**:
  - Real-time messaging using Firestore
  - Auto-creates chat when customer initiates
  - Unread message tracking
  - Message history
  - Invoice sharing via chat
- **Collections**:
  - `consultantChats` - Chat metadata
  - `chatMessages` - Individual messages

### 4. **Invoice System**
- **Location**: `app/consultants/invoices/create/page.tsx` and `app/consultants/invoices/[invoiceId]/page.tsx`
- **Features**:
  - Create invoices with multiple line items
  - Calculate subtotal, tax, and total
  - Save as draft or send immediately
  - Auto-generate invoice numbers (INV-YYYYMMDD-XXXX)
  - Share invoices via chat
  - View invoice details
- **Collections**:
  - `invoices` - Invoice documents
  - `paymentTransactions` - Payment records

### 5. **Paystack Payment Integration**
- **Location**: `app/consultants/invoices/[invoiceId]/page.tsx`
- **Features**:
  - Paystack payment button
  - Payment verification
  - Automatic invoice status update on payment
  - Payment transaction recording

## 📋 Setup Instructions

### 1. Environment Variables

Add to `.env.local` and Netlify:

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

**Note**: Get your Paystack public key from [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)

### 2. Firestore Security Rules

The rules have been updated in `firestore.rules` to include:
- `consultantProfiles` - Public read, consultant write
- `consultantChats` - Participants only
- `chatMessages` - Participants only
- `invoices` - Consultant and customer access
- `paymentTransactions` - Participants only

**Deploy rules**:
```bash
firebase deploy --only firestore:rules
```

### 3. Firestore Indexes

You may need to create composite indexes for:
- `consultantProfiles` queries with `isActive` and `specialties`
- `consultantChats` queries with `consultantUid` and `customerUid`

Firebase will prompt you with links if indexes are needed.

### 4. Cloud Functions (Optional but Recommended)

Create Cloud Functions for:
- Payment webhook handling (Paystack)
- Chat notifications
- Invoice status updates

**Example webhook function** (to be added to `functions/src/index.ts`):

```typescript
export const handlePaystackWebhook = functions.https.onRequest(async (req, res) => {
  // Verify Paystack signature
  // Update invoice status
  // Create payment transaction
});
```

## 🔄 User Flow

### For Customers:
1. Browse consultants at `/consultants/browse`
2. Click "Chat" to start conversation
3. Discuss needs and negotiate fees
4. Receive invoice via chat or email
5. View invoice at `/consultants/invoices/[invoiceId]`
6. Pay via Paystack
7. Service begins after payment

### For Consultants:
1. Apply at `/consultants/apply`
2. Wait for admin approval
3. Once approved, create profile at `/consultants/profile`
4. Customers can discover you at `/consultants/browse`
5. Chat with customers
6. Create invoices at `/consultants/invoices/create`
7. Send invoices via chat
8. Receive payments automatically

## 📁 File Structure

```
app/consultants/
├── page.tsx                    # Landing page
├── apply/page.tsx              # Application form
├── request/page.tsx            # Customer request form (legacy)
├── thanks/page.tsx             # Success page
├── browse/page.tsx             # Consultant discovery
├── profile/page.tsx            # Profile creation/editing
├── chat/[consultantId]/page.tsx # Chat interface
└── invoices/
    ├── create/page.tsx         # Invoice creation
    └── [invoiceId]/page.tsx    # Invoice view & payment
```

## 🔐 Security Considerations

1. **Consultant Approval**: Only admins can approve applications
2. **Profile Access**: Only approved consultants can create profiles
3. **Chat Privacy**: Only chat participants can read messages
4. **Invoice Access**: Only consultant and customer can view invoices
5. **Payment Security**: Paystack handles all payment processing

## 🚀 Next Steps

1. **Admin Panel**: Add consultant management to admin dashboard
2. **Notifications**: Implement push notifications for new messages
3. **Reviews**: Add rating/review system for consultants
4. **Analytics**: Track consultant performance metrics
5. **Email Integration**: Send invoice emails via SendGrid/Mailgun
6. **File Uploads**: Add profile image and document uploads

## 📝 Notes

- The chat system uses Firestore real-time listeners for instant updates
- Invoice numbers are auto-generated with format: `INV-YYYYMMDD-XXXX`
- Payment amounts are in NGN (Nigerian Naira)
- Paystack amounts are in kobo (multiply by 100)
- All timestamps use Firestore `serverTimestamp()`

## 🐛 Troubleshooting

### Chat not loading:
- Check Firestore rules are deployed
- Verify user is authenticated
- Check browser console for errors

### Payment not processing:
- Verify `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set
- Check Paystack dashboard for transaction logs
- Ensure invoice total is in kobo (amount * 100)

### Consultant profile not accessible:
- Verify consultant application is approved
- Check `consultantApplications/{uid}` status is 'approved'
- Ensure user is signed in

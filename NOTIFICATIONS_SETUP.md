# Notifications Setup Guide (Email + Push)

This guide covers email (iPage/Network Solutions/Gmail) and push notifications for IJOBA 606.

## Overview

| Channel | Events | Status |
|---------|--------|--------|
| **In-app** | Chat, payment, invoice, dispute | ✅ Working |
| **Email** | Welcome, chat, invoice sent, payment | ✅ Working (requires config) |
| **Push** | Chat, payment | ✅ Working (requires VAPID key) |

---

# Step-by-Step Setup

## Part 1: Email (iPage / Network Solutions / Gmail)

### Step 1.1: Choose your email provider

**Option A – iPage or Network Solutions**

- Host: `smtp.ipage.com`
- Port: 465 (SSL) or 587 (TLS)
- Username: your full email (e.g. `noreply@yourdomain.com`)
- Password: your email account password

**Option B – Gmail**

- Use your Gmail address
- Create an [App Password](https://support.google.com/accounts/answer/185833) (not your normal password)
- No host/port needed

### Step 1.2: Set Firebase secrets

From your project root, run:

```bash
cd functions

# Required for all providers
firebase functions:secrets:set EMAIL_USER
# When prompted, enter: your-email@yourdomain.com (or your Gmail)

firebase functions:secrets:set EMAIL_PASSWORD
# When prompted, enter: your email password or Gmail App Password

firebase functions:secrets:set EMAIL_FROM
# When prompted, enter: noreply@ijoba606.com (or your sending address)
```

**For iPage / Network Solutions only**, also run:

```bash
firebase functions:secrets:set EMAIL_HOST
# Enter: smtp.ipage.com

firebase functions:secrets:set EMAIL_PORT
# Enter: 465

firebase functions:secrets:set EMAIL_SECURE
# Enter: true
```

**For Gmail:** do not set `EMAIL_HOST`, `EMAIL_PORT`, or `EMAIL_SECURE`.

### Step 1.3: Where emails are sent

| Event | Recipient |
|-------|-----------|
| **Welcome** | New users who sign up with Google (have email) |
| **Invoice sent** | Customer when consultant sends an invoice |
| **Chat message** | Recipient of a new chat message |
| **Payment completed** | Customer and consultant |

---

## Part 2: Push Notifications (optional)

### Step 2.1: Generate VAPID key

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Project Settings (gear icon) → **Cloud Messaging**
3. Under **Web Push certificates**, click **Generate key pair**
4. Copy the key (starts with `B...`)

### Step 2.2: Add to `.env.local`

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-copied-vapid-key
```

### Step 2.3: Service worker

`public/firebase-messaging-sw.js` is already set up. No changes needed unless you change Firebase projects.

### Step 2.4: Where push is sent

- New chat messages
- Payment completed (customer and consultant)

---

## Part 3: Deploy

```bash
# 1. Deploy Firestore rules (for FCM tokens)
firebase deploy --only firestore:rules

# 2. Build and deploy Cloud Functions
cd functions
npm run build
firebase deploy --only functions

# Or use the extended-timeout deploy script if you hit timeouts:
npm run deploy:functions
```

---

## Quick Checklist

- [ ] `EMAIL_USER` set via `firebase functions:secrets:set EMAIL_USER`
- [ ] `EMAIL_PASSWORD` set via `firebase functions:secrets:set EMAIL_PASSWORD`
- [ ] `EMAIL_FROM` set via `firebase functions:secrets:set EMAIL_FROM`
- [ ] **iPage only:** `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE` set
- [ ] **Push:** `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in `.env.local`
- [ ] Firestore rules deployed
- [ ] Functions deployed

---

## Troubleshooting

**Emails not sending**

- Confirm secrets: `firebase functions:secrets:access EMAIL_USER`
- For iPage: use full email as username, correct password
- For Gmail: use App Password, not normal password

**Push not working**

- Ensure `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set and app is rebuilt
- Check browser notification permission
- Confirm site is HTTPS (required for push)

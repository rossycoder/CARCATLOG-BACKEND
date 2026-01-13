# Production Subscription Issue - Fix Guide

## Problem
Dealer `rozeenacareers031@gmail.com` has:
- ✅ Verified email
- ✅ Active account status
- ✅ Completed payment
- ❌ Shows "No Active Subscription" on login

## Root Cause
The subscription record is missing or not in "active" status in the **production database**.

This happens when:
1. Stripe webhook didn't fire or failed
2. Webhook processed but subscription wasn't saved correctly
3. Different database between local and production

## Solution

### Step 1: Connect to Production Database

Update your `backend/.env` file to use the production MongoDB:

```bash
# Comment out local MongoDB
# MONGODB_URI=mongodb://localhost:27017/car-website

# Uncomment production MongoDB Atlas
MONGODB_URI=mongodb+srv://carcatlog:Rozeena%40123@cluster0.eeyiemx.mongodb.net/car-website?retryWrites=true&w=majority
```

### Step 2: Run Diagnostic Script

```bash
cd backend
node scripts/diagnoseProductionSubscription.js
```

This will show you:
- Dealer information
- All subscriptions for the dealer
- Subscription status
- Available plans
- Environment configuration

### Step 3: Fix the Subscription

```bash
node scripts/fixProductionSubscription.js
```

This script will:
- Find the dealer by email
- Check for existing subscriptions
- Create a subscription if missing
- Activate subscription if it exists but inactive
- Update dealer record with subscription ID

### Step 4: Verify the Fix

After running the fix script, test the login:

1. Go to your deployed frontend
2. Login with: `rozeenacareers031@gmail.com`
3. You should now see the dashboard with subscription info

## Alternative: Run on Production Server

If you're using a hosting service like Render, Railway, or Heroku:

### Option A: Using Render/Railway Console

1. Go to your backend service dashboard
2. Open the Shell/Console
3. Run:
```bash
node scripts/fixProductionSubscription.js
```

### Option B: Using Environment Variables

Create a temporary script that you can trigger via API:

```bash
# Add this route temporarily (remove after fix)
POST /api/admin/fix-subscription
```

## Prevention

To prevent this in the future:

### 1. Verify Stripe Webhook Configuration

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Ensure webhook endpoint is configured: `https://your-backend.com/api/payment/webhook`
3. Verify these events are enabled:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 2. Add Webhook Logging

The webhook handler should log all events:

```javascript
// In stripeSubscriptionService.js
async handleWebhook(event) {
  console.log('📥 Webhook received:', event.type);
  console.log('📋 Event data:', JSON.stringify(event.data.object, null, 2));
  // ... rest of handler
}
```

### 3. Add Fallback Subscription Creation

In the login controller, add a check:

```javascript
// After successful login
const subscription = await TradeSubscription.findActiveForDealer(dealer._id);

if (!subscription && dealer.stripeCustomerId) {
  // Dealer has paid but no subscription - create one
  console.warn('⚠️  Dealer has Stripe customer but no subscription, creating...');
  // Create subscription from Stripe data
}
```

## Manual Database Fix (Advanced)

If scripts don't work, you can manually create the subscription in MongoDB:

```javascript
// Connect to MongoDB Atlas
use car-website

// Find the dealer
db.tradedealers.findOne({ email: "rozeenacareers031@gmail.com" })

// Get a plan
const plan = db.subscriptionplans.findOne({ slug: "starter" })

// Create subscription
db.tradesubscriptions.insertOne({
  dealerId: ObjectId("696566dc317afa3c8d8f2297"),
  planId: plan._id,
  stripeSubscriptionId: "manual_" + Date.now(),
  stripeCustomerId: "cus_manual",
  status: "active",
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  listingsLimit: plan.listingLimit,
  listingsUsed: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Update dealer
db.tradedealers.updateOne(
  { _id: ObjectId("696566dc317afa3c8d8f2297") },
  { 
    $set: { 
      currentSubscriptionId: <subscription_id_from_above>,
      hasActiveSubscription: true
    }
  }
)
```

## Testing

After the fix, verify:

1. ✅ Dealer can login
2. ✅ Dashboard shows subscription info
3. ✅ Can create vehicle listings
4. ✅ Subscription limits are enforced

## Support

If issues persist:
1. Check backend logs for errors
2. Verify Stripe webhook logs
3. Check MongoDB connection
4. Ensure all environment variables are set correctly

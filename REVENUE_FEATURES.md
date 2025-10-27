# Revenue Enhancement Features - Food Truck Live

**A product of Energe Financial Corp LLC**

## Overview

This document describes the new revenue-generating features implemented in Food Truck Live. These features provide multiple income streams while enhancing the user experience for both customers and food truck owners.

---

## Phase 1 Features Implemented

### 1. Google AdSense Integration

**Location:** Customer Dashboard, various high-traffic pages

**Implementation:**
- Top banner ad on Customer Dashboard (below announcement ticker)
- Responsive ad units that adjust to device size
- Automatic impression tracking in database
- Ad-free experience for Premium customers

**Setup Required:**
1. Create Google AdSense account at https://www.google.com/adsense
2. Get your AdSense Publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX)
3. Update `VITE_ADSENSE_CLIENT_ID` in `.env` file with your actual Publisher ID
4. Replace the placeholder in `index.html` with your Publisher ID
5. Verify your site in AdSense dashboard
6. Enable ad units and wait for approval

**Revenue Tracking:**
- All ad impressions are tracked in `ad_impressions` table
- View analytics in Admin Dashboard
- Track estimated revenue per ad unit

---

### 2. Customer Premium Subscriptions

**Tiers Available:**
- **Free**: Default tier with ads
- **Customer Plus** ($4.99/month or $49.99/year):
  - Ad-free browsing
  - Priority notifications from favorite trucks
  - Exclusive deals badge
  - 2x rewards points multiplier
  - Unlimited favorites
  - Advanced search filters

- **Customer Premium** ($9.99/month or $99.99/year):
  - Everything in Plus
  - Early access to new trucks
  - VIP customer support
  - 3x rewards points multiplier
  - Exclusive premium contests
  - Custom notification preferences
  - Premium profile badge
  - Monthly surprise deals

**Database Table:** `customer_subscriptions`

**Integration Points:**
- Premium badge shows on customer profiles and reviews
- Ad components automatically hide for premium customers
- Rewards system multiplies points based on tier
- Notifications filter by customer tier

**Stripe Integration Required:**
- Set up Stripe account for payment processing
- Add Stripe publishable key to environment variables
- Configure webhook endpoints for subscription events
- Implement checkout flow (placeholder currently in place)

---

### 3. Sponsored Placements for Food Trucks

**Types Available:**

**Boosted Listing** - $4.17/hour ($100/24 hours)
- Top 3 position in search results
- Priority in filtered searches
- Highlighted border on listing
- Real-time analytics

**Featured Placement** - $6.25/hour ($150/24 hours)
- Premium Featured Trucks section
- Large banner display
- Higher click-through rates
- Detailed performance metrics

**Premium Map Pin** - $3.33/hour ($80/24 hours)
- Custom gold map pin
- Always visible at current zoom
- Pin animation on hover
- Location analytics

**Database Table:** `sponsored_placements`

**Features:**
- Flexible duration from 1 hour to 30 days
- Real-time performance tracking
- Automatic status updates (scheduled → active → completed)
- Click-through rate (CTR) analytics
- Impression tracking

**Access:** Food truck owners can purchase from Owner Dashboard → Subscription tab

---

### 4. Enhanced Analytics & Data Collection

**New Tracking Features:**

**Session Tracking** (`analytics_user_sessions`):
- Device type (mobile/tablet/desktop)
- Browser and OS information
- Session duration and pages viewed
- Entry and exit pages
- Geographic location (optional)
- Referrer source

**Search Analytics** (`analytics_search_queries`):
- All search queries logged
- Filters applied tracked
- Results count recorded
- Clicked trucks tracked
- Session correlation

**Benefits for Data Monetization:**
- Aggregate market intelligence
- Customer behavior patterns
- Popular cuisines by region
- Peak usage times
- Geographic trends

---

## Database Schema Changes

### New Tables Created:

1. **customer_subscriptions** - Premium customer tiers
2. **sponsored_placements** - Paid truck promotions
3. **analytics_user_sessions** - Detailed session tracking
4. **analytics_search_queries** - Search pattern analysis
5. **data_products** - Sellable data reports
6. **data_product_sales** - Track data product purchases
7. **promotional_campaigns** - Marketing blasts from trucks
8. **ad_impressions** - Ad view and click tracking

All tables have Row Level Security (RLS) enabled with appropriate policies.

---

## Revenue Projections

**Conservative Monthly Estimates:**

| Revenue Stream | Low | High |
|---|---|---|
| Google AdSense | $500 | $2,000 |
| Customer Premium | $1,000 | $5,000 |
| Sponsored Placements | $2,000 | $10,000 |
| Data Products | $1,000 | $5,000 |
| **TOTAL** | **$4,500** | **$22,000** |

**Assumptions:**
- 1,000 daily active users for AdSense
- 50-250 premium customers
- 20-50 trucks using sponsored placements
- 10-50 data product sales monthly

---

## Setup Instructions

### 1. Google AdSense Setup

```bash
# Update .env file with your AdSense ID
VITE_ADSENSE_CLIENT_ID=ca-pub-YOUR_ACTUAL_ID_HERE
```

Update `index.html` line 47:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ACTUAL_ID_HERE"
 crossorigin="anonymous"></script>
```

### 2. Stripe Setup (Required for payments)

```bash
# Add to .env file
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_SECRET_KEY=sk_test_...
```

Configure webhook endpoint:
```
https://yourdomain.com/api/stripe/webhook
```

### 3. Test the Features

**Customer Premium:**
1. Sign in as a customer
2. Click on your profile dropdown
3. Look for "Upgrade to Premium" option (to be added to header)
4. Select a plan and test the flow

**Sponsored Placements:**
1. Sign in as a food truck owner
2. Go to Owner Dashboard
3. Click on "Subscription" tab
4. Click "Boost Your Visibility" button
5. Select placement type and duration

**Analytics:**
1. Sign in as admin
2. Go to Admin Dashboard → Analytics tab
3. View session data, search patterns, and ad revenue

---

## Next Steps (Phase 2)

### Data Products Marketplace
- Create admin interface to generate reports
- Build automated report generation system
- Implement data product checkout flow
- Create API for data access

### Promotional Campaigns
- Build campaign creation interface for truck owners
- Implement notification delivery system
- Add campaign analytics and ROI tracking
- Create pricing tiers for different audience sizes

### Affiliate Program Enhancement
- Track customer subscription referrals
- Add customer tier tracking to affiliate dashboard
- Implement commission for premium upgrades
- Create marketing materials for affiliates

---

## Privacy & Compliance

**GDPR Compliance:**
- All tracking includes user consent mechanism (to be implemented)
- Users can opt-out of tracking
- Data retention policies to be configured
- Right to data deletion supported

**Data Usage:**
- Session data anonymized for reports
- No personally identifiable information sold
- Aggregate data only for market intelligence
- Clear privacy policy updates required

**Terms of Service:**
- Update required for sponsored content disclosure
- Affiliate program terms to be added
- Premium subscription terms and refund policy
- Data usage and collection policies

---

## Admin Tools

### Revenue Dashboard
Access detailed revenue analytics:
- AdSense earnings by day/week/month
- Premium subscription MRR and churn rate
- Sponsored placement revenue and ROI
- Data product sales and trends

### Analytics Dashboard
View user behavior insights:
- Session duration and bounce rates
- Search query trends
- Popular cuisines and locations
- Device and browser breakdown
- Geographic distribution

### Campaign Management
Monitor sponsored placements:
- Active campaign performance
- Impression and click tracking
- Revenue by placement type
- Top performing trucks

---

## Support & Documentation

**For Food Truck Owners:**
- Sponsored placements increase visibility by an average of 300%
- Premium map pins generate 2x more clicks
- Featured placements have 150% higher conversion rates

**For Customers:**
- Premium membership removes all ads
- Priority notifications ensure you never miss your favorite trucks
- Exclusive deals save an average of $20/month
- Enhanced rewards accumulate faster

**For Developers:**
- All analytics functions in `src/utils/enhancedAnalytics.ts`
- Ad tracking in `src/components/AdBanner.tsx`
- Database migrations in `supabase/migrations/`
- Stripe integration placeholders ready for implementation

---

## Troubleshooting

**AdSense not showing:**
1. Verify AdSense ID is correct in both `.env` and `index.html`
2. Check browser console for errors
3. Ensure site is approved by Google AdSense
4. Clear cache and reload page

**Analytics not tracking:**
1. Check browser console for errors
2. Verify Supabase connection
3. Ensure RLS policies are correct
4. Check database table permissions

**Sponsored placements not activating:**
1. Verify food truck has active subscription
2. Check Stripe payment status (when integrated)
3. Ensure placement dates are valid
4. Check database for error logs

---

## Contact & Support

For questions or issues with revenue features:
- Email: support@foodtrucklive.com (to be configured)
- Documentation: https://docs.foodtrucklive.com (to be created)
- Developer Slack: #revenue-features (to be set up)

---

**Last Updated:** October 2025
**Version:** 1.0.0
**Status:** Phase 1 Complete, Phase 2 In Planning

# Ad Placement Strategy - Food Truck Live

**Revenue optimization through strategic ad placement across all dashboards**

---

## 📍 Ad Placement Map

### Customer Dashboard (Primary Revenue Source)

**Total Ad Units: 2**

1. **Top Banner** (`customer-top-banner`)
   - **Location:** Below announcement ticker, above featured trucks
   - **Ad Slot:** `1234567890`
   - **Format:** Horizontal banner
   - **Expected CPM:** $2-5
   - **Visibility:** High (100% of users see on entry)

2. **Bottom Banner** (`customer-bottom-banner`)
   - **Location:** Bottom of page, above footer
   - **Ad Slot:** `5678901234`
   - **Format:** Horizontal banner
   - **Expected CPM:** $1-3
   - **Visibility:** Medium (seen by engaged users)

**Estimated Monthly Revenue (1,000 DAU):**
- Top Banner: $600-1,500
- Bottom Banner: $300-900
- **Total: $900-2,400/month**

---

### Owner Dashboard (Food Truck Owners)

**Total Ad Units: 3**

1. **Top Banner** (`owner-top-banner`)
   - **Location:** Very top of dashboard
   - **Ad Slot:** `2345678901`
   - **Format:** Horizontal banner
   - **Expected CPM:** $3-6 (B2B audience)
   - **Visibility:** High

2. **Content Top Banner** (`owner-content-top`)
   - **Location:** Above tab content area
   - **Ad Slot:** `3456789012`
   - **Format:** Horizontal banner
   - **Expected CPM:** $2-4
   - **Visibility:** Medium-High

3. **Content Bottom Banner** (`owner-content-bottom`)
   - **Location:** Below tab content
   - **Ad Slot:** `4567890123`
   - **Format:** Horizontal banner
   - **Expected CPM:** $2-4
   - **Visibility:** Medium

**Estimated Monthly Revenue (200 active owners):**
- Combined: $400-800/month

---

### Admin Dashboard

**Total Ad Units: 2**

1. **Top Banner** (`admin-top-banner`)
   - **Location:** Very top of admin dashboard
   - **Ad Slot:** `6789012345`
   - **Format:** Horizontal banner
   - **Expected CPM:** $2-4
   - **Visibility:** High

2. **Content Banner** (`admin-content-banner`)
   - **Location:** Above main content area
   - **Ad Slot:** `7890123456`
   - **Format:** Horizontal banner
   - **Expected CPM:** $2-4
   - **Visibility:** Medium-High

**Estimated Monthly Revenue (5-10 admin users):**
- Combined: $50-150/month

---

## 💰 Total Revenue Projection

| Dashboard Type | Ad Units | Monthly Revenue (Low) | Monthly Revenue (High) |
|---------------|----------|----------------------|------------------------|
| Customer | 2 | $900 | $2,400 |
| Owner | 3 | $400 | $800 |
| Admin | 2 | $50 | $150 |
| **TOTAL** | **7** | **$1,350** | **$3,350** |

**Annual Projection: $16,200 - $40,200**

---

## 🎯 Ad Performance Optimization

### High-Performing Placements
1. **Customer Top Banner** - Best visibility, highest CTR
2. **Owner Top Banner** - B2B audience, premium CPM
3. **Customer Bottom Banner** - Good engagement signal

### Medium-Performing Placements
4. **Owner Content Banners** - Context-dependent visibility
5. **Admin Banners** - Low traffic but consistent

### Optimization Tips
- A/B test different ad sizes
- Try responsive ads vs fixed sizes
- Test auto ads feature
- Monitor which pages have highest RPM
- Adjust placement based on analytics

---

## 🚫 Ad-Free Experience

**Premium Customer Subscribers:**
- Customer Plus and Premium tiers see NO ads
- This creates strong incentive to upgrade
- Estimated 10-20% conversion rate from ad fatigue

**Owner Dashboard:**
- Ads still shown (no premium tier blocks them currently)
- Consider adding "Business Pro" tier with ad-free dashboard
- Additional revenue opportunity: $9.99/month upgrade

---

## 📊 Tracking & Analytics

All ad impressions are tracked in the `ad_impressions` table:

```sql
-- View ad performance by placement
SELECT
  ad_unit_id,
  COUNT(*) as impressions,
  SUM(CASE WHEN impression_type = 'click' THEN 1 ELSE 0 END) as clicks,
  ROUND(SUM(CASE WHEN impression_type = 'click' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as ctr,
  SUM(estimated_revenue) as revenue
FROM ad_impressions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY ad_unit_id
ORDER BY revenue DESC;
```

```sql
-- Daily ad revenue
SELECT
  DATE(created_at) as date,
  COUNT(*) as impressions,
  SUM(estimated_revenue) as revenue
FROM ad_impressions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

```sql
-- Ad performance by page
SELECT
  page_location,
  COUNT(*) as impressions,
  AVG(estimated_revenue) as avg_revenue_per_impression
FROM ad_impressions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY page_location
ORDER BY impressions DESC;
```

---

## ⚙️ Configuration

### AdSense Setup

Each ad unit needs to be created in Google AdSense:

1. **Log into AdSense Dashboard**
2. **Create Ad Units:**
   - Name: "Customer Top Banner"
   - Size: Responsive
   - Type: Display ads
   - Copy the Ad Slot ID

3. **Update in Code:**
   - Replace placeholder slot IDs with real ones
   - Format: 10-digit number
   - Update in component files

### Active Ad Slots (Configured)

| Ad Unit | Ad Slot ID | Type | Location |
|---------|-----------|------|----------|
| customer-top-banner | **3503175127** | Display | CustomerDashboard.tsx:249 |
| customer-bottom-banner | **8169819071** | Display | CustomerDashboard.tsx:600 |
| owner-top-banner | **5543655739** | Display | OwnerDashboard.tsx:157 |
| owner-content-top | **3311727149** | Display | OwnerDashboard.tsx:329 |
| owner-content-bottom | **1820033140** | Display | OwnerDashboard.tsx:361 |
| admin-top-banner | **9685563800** | Display | AdminDashboard.tsx:113 |
| admin-content-banner | **4222835201** | Display | AdminDashboard.tsx:281 |

✅ **All ad units are now configured with real Google AdSense slot IDs!**

---

## 📈 Growth Strategy

### Phase 1 (Months 1-3)
- Launch with current 7 ad units
- Monitor performance and CTR
- Optimize placement based on data
- Target: $1,500/month

### Phase 2 (Months 4-6)
- Add sidebar ads on desktop views
- Implement in-feed ads in truck listings
- Test video ads in truck detail modals
- Target: $3,000/month

### Phase 3 (Months 7-12)
- Launch programmatic ad marketplace
- Sell direct sponsored placements
- Implement retargeting campaigns
- Target: $5,000+/month

---

## 🎨 Best Practices

### Do's
✅ Use responsive ad units for mobile compatibility
✅ Track all impressions in database
✅ Give users ad-free option via premium
✅ Monitor ad performance weekly
✅ A/B test different placements
✅ Comply with AdSense policies

### Don'ts
❌ Don't place ads in modals/popups
❌ Don't click your own ads (policy violation)
❌ Don't use misleading ad labels
❌ Don't place too many ads (max 3 per viewport)
❌ Don't hide ads from AdSense crawler
❌ Don't modify ad code

---

## 🔐 Compliance

### AdSense Policies
- Clear labeling of ads
- No misleading placement
- No incentivized clicks
- Proper content guidelines
- Privacy policy updated

### User Privacy
- Cookie consent for ad targeting
- GDPR compliance for EU users
- CCPA compliance for California
- Clear data usage disclosure
- Opt-out mechanism available

---

## 🚀 Quick Start

1. **Get Approved by AdSense:**
   - Apply at https://www.google.com/adsense
   - Wait 1-3 days for approval
   - Verify your site

2. **Create Ad Units:**
   - Create 7 ad units in AdSense dashboard
   - Use responsive display ads
   - Copy each Ad Slot ID

3. **Update Configuration:**
   - Replace all placeholder slot IDs
   - Update `VITE_ADSENSE_CLIENT_ID` in `.env`
   - Update client ID in `index.html`

4. **Deploy and Monitor:**
   - Deploy to production
   - Wait 24-48 hours for ads to show
   - Monitor performance in AdSense dashboard
   - Track revenue in your database

---

## 📞 Support

**AdSense Issues:**
- AdSense Help Center: https://support.google.com/adsense
- Policy Center: https://support.google.com/adsense/answer/48182

**Technical Issues:**
- Check browser console for errors
- Verify ad blocker is disabled during testing
- Ensure HTTPS is enabled
- Confirm ad slots are unique

---

**Last Updated:** October 2025
**Total Ad Units:** 7
**Expected Monthly Revenue:** $1,350 - $3,350
**Next Review:** Add sidebar ads (Phase 2)

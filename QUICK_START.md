# Food Truck Live - Quick Start

## ✅ Your App is Ready!

All configuration has been cleaned up and reset to defaults.

---

## 🚀 Deploy & Access

### Your App URL:
Your app will be accessible at the **default bolt.new URL** assigned by the platform.

### To Deploy:
```bash
git add .
git commit -m "Reset to default configuration"
git push origin main
```

bolt.new will automatically deploy in 5-10 minutes.

---

## ✅ What's Configured

### Core Features:
- ✅ Supabase database connected
- ✅ User authentication (email/password)
- ✅ Food truck management
- ✅ Reviews and ratings
- ✅ Real-time updates

### Revenue Features:
- ✅ Google AdSense (7 ad units)
- ✅ Premium subscriptions
- ✅ Sponsored placements
- ✅ Affiliate program

### Production Ready:
- ✅ Build successful (no errors)
- ✅ Security headers configured
- ✅ Mobile responsive
- ✅ Error handling implemented

---

## 📱 Testing After Deploy

1. Wait 10 minutes for deployment
2. Visit your bolt.new URL
3. Should see Food Truck Live homepage

### What You'll See:
- Header with logo and navigation
- Search bar for food trucks
- Map (if Google Maps API configured)
- Food truck listings
- Login/signup buttons
- Google AdSense ads

---

## 🔑 Login Options

### Test Accounts:
Use the dev login panel (bottom left) to create test accounts:

- **Customer** - Browse trucks, leave reviews
- **Owner** - Manage your food truck
- **Admin** - Full dashboard access

Or sign up with any email address.

---

## 🛠️ Configuration Files

### Environment Variables:
All Supabase credentials are embedded in the code as fallbacks.

Located in: `src/lib/supabase.ts`

### Google Maps API (Optional):
If you want to show maps, add your API key to `.env`:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Google AdSense:
AdSense is configured with 7 ad units.
Update your publisher ID in `.env`:
```
VITE_ADSENSE_CLIENT_ID=ca-pub-YOUR-PUBLISHER-ID
```

---

## 📊 Build Output

Current build:
```
✓ 1574 modules transformed
✓ built in 5.24s
Total size: ~480 kB (gzipped: ~140 kB)
```

All optimized and production-ready!

---

## 🆘 Need Help?

### Common Issues:

**White screen:**
- Wait for deployment to complete
- Clear browser cache completely
- Try incognito mode

**Can't login:**
- Use dev login panel (bottom left)
- Or sign up with any email

**Maps not showing:**
- Google Maps API key needs to be configured
- App works fine without maps

---

## 📚 Documentation

- Revenue features: `REVENUE_FEATURES.md`
- AdSense setup: `ADSENSE_CONFIGURED.md`
- Ad placements: `AD_PLACEMENTS.md`
- Setup guide: `SETUP.md`

---

## ✅ Next Steps

1. **Deploy the code**
   ```bash
   git push origin main
   ```

2. **Wait for deployment** (5-10 minutes)

3. **Test your site** at your bolt.new URL

4. **Optional configurations:**
   - Add Google Maps API key for maps
   - Update AdSense publisher ID for ads
   - Customize branding and colors

---

**Your Food Truck Live app is ready to deploy!** 🚀

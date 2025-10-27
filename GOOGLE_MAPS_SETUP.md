# Google Maps Setup Instructions

## Multi-Platform Configuration (Web, Android, iOS)

This guide covers setting up Google Maps API keys for all platforms including web, Android, and iOS applications.

## Current Configuration

Your API keys are configured in `.env`:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDlRSUOazuHcWdEBo7W7wVPH5zw6_f9S1k (Web)
VITE_GOOGLE_MAPS_ANDROID_API_KEY=AIzaSyDlRSUOazuHcWdEBo7W7wVPH5zw6_f9S1k (Android)
VITE_GOOGLE_MAPS_IOS_API_KEY=AIzaSyDlRSUOazuHcWdEBo7W7wVPH5zw6_f9S1k (iOS)
```

## Setup Steps

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select a Project
- Click the project dropdown at the top
- Create a new project or select an existing one

### 3. Enable Required APIs for All Platforms
1. Go to **"APIs & Services" > "Library"**
2. Search for and enable:

   **For Web:**
   - **Maps JavaScript API** (REQUIRED)
   - Places API (optional)
   - Geocoding API (optional)

   **For Android:**
   - **Maps SDK for Android** (REQUIRED)
   - Places API (optional)
   - Geocoding API (optional)

   **For iOS:**
   - **Maps SDK for iOS** (REQUIRED)
   - Places API (optional)
   - Geocoding API (optional)

### 4. Create API Keys (One for Each Platform)

#### Option A: Use Same Key for All Platforms (Current Setup)
You can use the same API key for all platforms if you configure it properly.

#### Option B: Separate Keys (Recommended for Production)
Create separate keys for better security:
1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS" > "API key"**
3. Create three keys:
   - Web API Key
   - Android API Key
   - iOS API Key

### 5. Configure API Key Restrictions

#### For Web API Key:
1. Click on your web API key to edit
2. **Application Restrictions:**
   - Select **"HTTP referrers (web sites)"**
   - Add these referrer patterns:
     ```
     http://localhost:*/*
     http://127.0.0.1:*/*
     https://*.webcontainer.io/*
     https://*.webcontainer-api.io/*
     https://yourdomain.com/*
     ```

3. **API Restrictions:**
   - Select **"Restrict key"**
   - Choose:
     - Maps JavaScript API
     - Places API (if using)
     - Geocoding API (if using)

#### For Android API Key:
1. Click on your Android API key to edit
2. **Application Restrictions:**
   - Select **"Android apps"**
   - Click **"+ ADD AN ITEM"**
   - Add your package name and SHA-1 certificate fingerprint

   To get SHA-1 fingerprint:
   ```bash
   # For debug keystore:
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # For release keystore:
   keytool -list -v -keystore /path/to/your/keystore -alias your_alias_name
   ```

3. **API Restrictions:**
   - Select **"Restrict key"**
   - Choose:
     - Maps SDK for Android
     - Places API (if using)
     - Geocoding API (if using)

#### For iOS API Key:
1. Click on your iOS API key to edit
2. **Application Restrictions:**
   - Select **"iOS apps"**
   - Click **"+ ADD AN ITEM"**
   - Add your iOS bundle identifier (e.g., com.yourcompany.foodtrucklive)

3. **API Restrictions:**
   - Select **"Restrict key"**
   - Choose:
     - Maps SDK for iOS
     - Places API (if using)
     - Geocoding API (if using)

### 6. Enable Billing
**Important**: Google Maps requires a billing account to work, even for development.

1. Go to **"Billing"** in Google Cloud Console
2. Link a billing account
3. Google provides $200/month free credit for Maps usage

### 7. Update Your .env File
Your keys are already configured:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDlRSUOazuHcWdEBo7W7wVPH5zw6_f9S1k
VITE_GOOGLE_MAPS_ANDROID_API_KEY=AIzaSyDlRSUOazuHcWdEBo7W7wVPH5zw6_f9S1k
VITE_GOOGLE_MAPS_IOS_API_KEY=AIzaSyDlRSUOazuHcWdEBo7W7wVPH5zw6_f9S1k
```

### 8. Android Integration
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application>
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="AIzaSyDlRSUOazuHcWdEBo7W7wVPH5zw6_f9S1k"/>
</application>
```

### 9. iOS Integration
Add to `ios/Runner/AppDelegate.swift`:
```swift
import GoogleMaps

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GMSServices.provideAPIKey("AIzaSyDlRSUOazuHcWdEBo7W7wVPH5zw6_f9S1k")
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

### 10. Restart Your Application
After configuration, restart your development server and rebuild mobile apps.

## Common Issues

### "This page can't load Google Maps correctly"
- **Cause**: API key not configured or billing not enabled
- **Solution**: Follow steps 3-6 above

### "RefererNotAllowedMapError"
- **Cause**: Your domain isn't in the allowed referrers list
- **Solution**: Add your domain to Application Restrictions (step 5)

### "ApiNotActivatedMapError"
- **Cause**: Maps JavaScript API not enabled
- **Solution**: Enable Maps JavaScript API in step 3

### Map shows but is grayed out
- **Cause**: Billing not enabled
- **Solution**: Enable billing in step 6

## Cost Information
- Google Maps provides **$200 free credit per month**
- For a food truck app with moderate usage, this should cover development and early production
- Monitor usage at: https://console.cloud.google.com/billing

## Need Help?
- Google Maps Platform Documentation: https://developers.google.com/maps/documentation
- Pricing Calculator: https://mapsplatform.google.com/pricing/

# Reset Domain in bolt.new - Step by Step

## ✅ Code is Already Clean

I've removed all custom domain references from your code. The publish button domain is controlled by bolt.new's platform settings.

---

## 🔧 How to Change the Publish Button Domain

### Method 1: Using bolt.new Dashboard

The domain shown on the publish button is set in bolt.new's **project settings**:

#### Step 1: Access Settings
Look for one of these in the bolt.new interface:
- **"Settings"** button (usually top right or in menu)
- **"Project Settings"** option
- **Gear icon** ⚙️
- **Three dots menu** (⋮) → Settings

#### Step 2: Find Domain Settings
Once in settings, look for:
- **"Domains"** section
- **"Custom Domain"** tab
- **"Deployment"** settings
- **"Publishing"** configuration

#### Step 3: Remove Custom Domain
You should see: `foodtrucklive.bolt.host`

Options you might see:
- **"Remove Domain"** button → Click it
- **"Delete"** button → Click it
- **"X"** icon next to domain → Click it
- **"Use Default"** option → Select it

#### Step 4: Save & Refresh
- Click **"Save"** if there's a save button
- Refresh the page
- The publish button should now show your default bolt.new URL

---

### Method 2: Deploy Without Custom Domain

If you can't find the settings, simply deploy the code as-is:

```bash
git add .
git commit -m "Remove custom domain configuration"
git push origin main
```

After deployment completes:
- The app will be accessible at **both** URLs:
  - Your default bolt.new URL (working, no SSL issues)
  - The custom domain (may have SSL cache issues)
- Use the default bolt.new URL going forward

---

### Method 3: Contact bolt.new Support

If neither method works:

1. Look for **"Help"** or **"Support"** in bolt.new
2. Ask to reset your project to the **default bolt.new URL**
3. Mention you want to remove the custom domain: `foodtrucklive.bolt.host`

---

## ✅ What I've Already Fixed in Code

I've cleaned all these files:
- ✅ `bolt.config.json` - removed domain redirects
- ✅ `netlify.toml` - removed domain-specific rules
- ✅ No domain references in any JSON, TOML, or config files

**Your code is ready!** The domain setting is just in bolt.new's dashboard.

---

## 🚀 After Removing Custom Domain

### You'll Get:
- Default bolt.new URL (like: `yourproject.bolt.new`)
- No SSL caching issues
- No white screen issues
- Fresh deployment that works immediately

### Test It:
1. Deploy the code (`git push`)
2. Wait 5-10 minutes
3. Visit your default bolt.new URL
4. Should work perfectly!

---

## 📱 Meanwhile: Access Your App

While waiting to change the domain setting, you can still access your app:

### Option A: Direct Default URL
Try visiting: `https://[your-project-name].bolt.new`

(Replace `[your-project-name]` with your actual project name)

### Option B: Find in bolt.new Dashboard
Look for:
- "Deployments" section
- Latest deployment
- There should be a link to the default URL

### Option C: Check Deployment Log
In bolt.new:
- Open deployment logs
- Look for "Published to: https://..."
- That's your working URL

---

## 🎯 Summary

**Problem:** Publish button shows `foodtrucklive.bolt.host`

**Why:** Domain setting is stored in bolt.new's platform (not in code)

**Solution:** 
1. Go to bolt.new project settings
2. Find "Domains" section
3. Remove custom domain
4. Save changes

**Already Done:**
- ✅ All code cleaned
- ✅ No domain references in files
- ✅ Configuration reset
- ✅ Ready to deploy

**Next Step:**
- Change domain in bolt.new dashboard settings
- OR just deploy and use the default URL directly

---

## 🔍 Can't Find Settings?

**Look for these elements in bolt.new:**

- ⚙️ **Settings icon** (gear icon)
- ☰ **Menu** (hamburger menu)
- ⋮ **More options** (three dots)
- 🏠 **Project Home** → Settings link
- 📋 **Project Info** → Edit
- 🌐 **Domains** tab or section

**Common locations:**
- Top right corner
- Left sidebar
- Project dropdown menu
- Under project name
- In deployment section

---

**Your code is clean and ready to deploy with the default bolt.new URL!** 🚀

**The publish button domain just needs to be changed in bolt.new's dashboard settings.**

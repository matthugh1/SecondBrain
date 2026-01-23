# Outlook/Office 365 Integration Setup Guide

This guide will walk you through setting up Outlook email integration in just a few minutes.

## Why Do I Need This?

Microsoft requires all apps that want to access Office 365/Outlook to be registered in Azure AD. This is a **one-time setup** that takes about 5 minutes. After that, users just click "Connect" and sign in with their Office 365 account.

## Step-by-Step Setup

### Step 1: Go to Azure Portal
1. Open https://portal.azure.com in your browser
2. Sign in with your Microsoft account (the same one you use for Office 365)

### Step 2: Create App Registration
1. In the search bar at the top, type "Azure Active Directory" and click it
2. In the left sidebar, click **"App registrations"**
3. Click the **"+ New registration"** button at the top

### Step 3: Configure Basic Settings
Fill in the form:
- **Name**: `SecondBrain Outlook Integration` (or any name you like)
- **Supported account types**: Select **"Accounts in any organizational directory and personal Microsoft accounts"**
- **Redirect URI**: 
  - Platform: Select **"Web"**
  - URL: `http://localhost:3000/api/integrations/outlook/callback`
  - Click **"Register"**

### Step 4: Copy Your Client ID
1. After registration, you'll be on the **Overview** page
2. Find **"Application (client) ID"** - it looks like: `12345678-1234-1234-1234-123456789abc`
3. Copy this value
4. Paste it into your `.env.local` file as `MICROSOFT_CLIENT_ID`

### Step 5: Create a Client Secret
1. In the left sidebar, click **"Certificates & secrets"**
2. Click **"+ New client secret"**
3. Fill in:
   - **Description**: `Outlook Integration Secret`
   - **Expires**: Choose **24 months** (or whatever you prefer)
4. Click **"Add"**
5. **IMPORTANT**: Copy the **Value** immediately (not the Secret ID) - you won't be able to see it again!
6. Paste it into your `.env.local` file as `MICROSOFT_CLIENT_SECRET`

### Step 6: Add API Permissions
1. In the left sidebar, click **"API permissions"**
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Search for and check these permissions:
   - `Mail.Read` - Read mail
   - `Mail.Send` - Send mail
6. Click **"Add permissions"**
7. If you see a **"Grant admin consent"** button and you're an admin, click it (optional but recommended)

### Step 7: Update Your .env.local File
Your `.env.local` should now have:
```bash
MICROSOFT_CLIENT_ID=your-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-value-here
```

### Step 8: Restart Your Dev Server
Stop your Next.js server (Ctrl+C) and restart it:
```bash
npm run dev
```

## That's It!

Now when you click "Connect" for Outlook:
1. You'll be redirected to Microsoft's login page
2. Sign in with your Office 365 account
3. Grant permission to read/send email
4. You'll be redirected back to your app, connected!

## Troubleshooting

**"Invalid client" error**: Make sure you copied the Client ID correctly (it should be a GUID format)

**"Invalid client secret" error**: Make sure you copied the **Value** from the secret, not the Secret ID. If you lost it, create a new secret.

**Redirect URI mismatch**: Make sure the redirect URI in Azure matches exactly: `http://localhost:3000/api/integrations/outlook/callback`

**For Production**: When deploying, add your production URL as an additional redirect URI in Azure, and update `NEXT_PUBLIC_APP_URL` in your production environment.

## Need Help?

If you get stuck, the error messages in the app will now tell you exactly what's missing!

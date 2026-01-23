#!/bin/bash

# Vercel CLI Setup Script
# This script helps you set up Vercel CLI deployment for the SecondBrain project

set -e

echo "🚀 Vercel CLI Setup for SecondBrain"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Installing Vercel CLI globally..."
    npm install -g vercel@latest
    echo "✅ Vercel CLI installed successfully"
else
    echo "✅ Vercel CLI is already installed"
    vercel --version
fi

echo ""
echo "🔐 Checking authentication..."

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "🔑 Please log in to Vercel..."
    vercel login
else
    echo "✅ Already logged in to Vercel"
    vercel whoami
fi

echo ""
echo "📁 Checking project link..."

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Project is not linked to Vercel"
    echo "🔗 Linking project to Vercel..."
    echo ""
    echo "Please follow the prompts:"
    echo "  - Select your organization"
    echo "  - Select or create a project"
    echo "  - Choose to link to existing project or create new one"
    echo ""
    vercel link
    echo "✅ Project linked successfully"
else
    echo "✅ Project is already linked"
    echo "📋 Project configuration:"
    cat .vercel/project.json | grep -E "(orgId|projectId)" | sed 's/^/   /'
fi

echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Get your Vercel credentials:"
echo "   - VERCEL_TOKEN: Get from https://vercel.com/account/tokens"
echo "   - VERCEL_ORG_ID: Found in .vercel/project.json (orgId field)"
echo "   - VERCEL_PROJECT_ID: Found in .vercel/project.json (projectId field)"
echo ""
echo "2. Add GitHub Secrets:"
echo "   - Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo "   - Add the three secrets listed above"
echo ""
echo "3. Configure Environment Variables in Vercel Dashboard:"
echo "   - Go to: https://vercel.com/dashboard"
echo "   - Select your project → Settings → Environment Variables"
echo "   - Add all required variables (see VERCEL_DEPLOYMENT.md)"
echo ""
echo "4. Test deployment:"
echo "   npm run vercel:deploy:preview"
echo ""
echo "✅ Setup complete! Your CI/CD pipeline will use Vercel CLI for deployments."
echo ""

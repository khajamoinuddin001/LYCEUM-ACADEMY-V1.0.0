#!/bin/bash

# Deployment Script for Lyceum Academy (lyceumacad.com)

echo "🚀 Starting Deployment Process..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# 2. Install Dependencies
echo "📦 Installing Frontend Dependencies..."
npm install

echo "📦 Installing Backend Dependencies..."
cd server
npm install
cd ..

# 3. Build Frontend
echo "🏗️  Building Frontend..."
npm run build

# 4. Restart Backend Services
echo "🔄 Restarting Backend Server..."
pm2 reload lyceum-academy || pm2 start ecosystem.config.cjs

echo "✅ Deployment Complete! Visit https://lyceumacad.com"

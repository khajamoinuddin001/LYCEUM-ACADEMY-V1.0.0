#!/bin/bash
# Lyceum Academy - Deployment Preparation Script
# Run this before deploying to VPS

set -e  # Exit on error

echo "🚀 Lyceum Academy - Deployment Preparation"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production files exist
echo ""
echo "📋 Checking environment files..."
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Frontend .env.production not found!${NC}"
    echo "Please create .env.production with your production API URL"
    exit 1
fi

if [ ! -f "server/.env.production" ]; then
    echo -e "${RED}❌ Backend server/.env.production not found!${NC}"
    echo "Please create server/.env.production with your production database URL and JWT secret"
    exit 1
fi

echo -e "${GREEN}✅ Environment files found${NC}"

# Check for placeholder values
echo ""
echo "🔍 Checking for placeholder values..."
if grep -q "REPLACE_WITH" server/.env.production; then
    echo -e "${YELLOW}⚠️  Warning: Found placeholder values in server/.env.production${NC}"
    echo "Please replace all REPLACE_WITH_* values before deploying"
fi

if grep -q "yourdomain.com" .env.production; then
    echo -e "${YELLOW}⚠️  Warning: Found 'yourdomain.com' in .env.production${NC}"
    echo "Please replace with your actual domain"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Build frontend
echo ""
echo "🏗️  Building frontend..."
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Create logs directory
echo ""
echo "📁 Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "📦 Next steps:"
echo "1. Upload this directory to your VPS"
echo "2. Copy .env.production to .env (both root and server/)"
echo "3. Install PostgreSQL and create database"
echo "4. Run: pm2 start ecosystem.config.json"
echo "5. Configure Nginx to serve dist/ and proxy /api"
echo ""
echo "📚 See deployment_checklist.md for detailed instructions"

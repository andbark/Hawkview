#!/bin/bash

echo "🚀 Starting comprehensive restart..."

# Kill any running Next.js processes
echo "📋 Killing any running Next.js processes..."
pkill -f "next dev" || true
pkill -f "node" || true
killall node 2>/dev/null || true

# Wait for processes to terminate
echo "⏳ Waiting for processes to terminate..."
sleep 3

# Remove .next directory with sudo permissions if needed
echo "🗑️  Removing .next directory..."
rm -rf .next 2>/dev/null || sudo rm -rf .next 2>/dev/null

# Remove node_modules/.cache
echo "🧹 Cleaning node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null || sudo rm -rf node_modules/.cache 2>/dev/null

# Clear Next.js cache
echo "🔄 Clearing Next.js cache..."
rm -rf .next/cache 2>/dev/null || sudo rm -rf .next/cache 2>/dev/null

# Fix permissions
echo "🔒 Fixing permissions..."
sudo chown -R $(whoami) .next 2>/dev/null || true
sudo chown -R $(whoami) node_modules 2>/dev/null || true

# Clear npm cache
echo "🧼 Clearing npm cache..."
npm cache clean --force

# Set PORT explicitly to avoid conflicts and start on a fresh port
export PORT=3002
echo "🌐 Starting Next.js on port $PORT..."
npm run dev 
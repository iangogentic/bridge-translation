#!/bin/bash

echo "Adding production environment variables to Vercel..."

# Critical production URLs
echo "NEXT_PUBLIC_APP_URL"
echo "https://bridge-translation.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production

echo "MARKETING_SITE_URL"
echo "https://bridge-website-theta.vercel.app" | vercel env add MARKETING_SITE_URL production

echo "✅ Production URLs added!"
echo "Environment variables are now configured for production deployment."

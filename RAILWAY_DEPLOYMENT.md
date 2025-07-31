# Railway Deployment Guide

## 🚀 Overview

This guide will help you deploy your Whitepages API headless browser application to Railway using Docker.

## 📋 Prerequisites

1. Railway account (sign up at [railway.app](https://railway.app))
2. GitHub repository with your code
3. 2captcha API key

## 🔧 Environment Variables

Set these environment variables in Railway:

```bash
# Required
NODE_ENV=production
TWOCAPTCHA_API_KEY=your_2captcha_api_key_here

# Optional (with defaults)
BROWSER_TIMEOUT=30000
PAGE_TIMEOUT=30000
```

## 🐳 Docker Configuration

The project uses a Puppeteer-specific Docker image that includes:

- **Base Image**: `ghcr.io/puppeteer/puppeteer:21.6.1`
- **Chrome Path**: `/usr/bin/google-chrome-stable`
- **Environment**: Production-optimized browser configuration

## 📦 Files Updated for Railway

### 1. Dockerfile

- Uses Puppeteer-specific Docker image
- Matches Puppeteer version (21.6.1)
- Uses yarn for dependency management
- Optimized for production deployment

### 2. Browser Configuration

- Conditional `executablePath` logic
- Production: Uses `PUPPETEER_EXECUTABLE_PATH`
- Development: Uses `puppeteer.executablePath()`

### 3. Railway Configuration

- `railway.json` for deployment settings
- Health check endpoint at `/health`
- Automatic restart on failure

## 🚀 Deployment Steps

### 1. Connect to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
railway link
```

### 2. Set Environment Variables

```bash
# Set required environment variables
railway variables set NODE_ENV=production
railway variables set TWOCAPTCHA_API_KEY=your_api_key_here

# Set optional variables (if needed)
railway variables set BROWSER_TIMEOUT=30000
railway variables set PAGE_TIMEOUT=30000
```

### 3. Deploy

```bash
# Deploy to Railway
railway up
```

### 4. Monitor Deployment

```bash
# Check deployment status
railway status

# View logs
railway logs
```

## 🔍 Health Check

The application includes a health check endpoint:

- **URL**: `GET /health`
- **Response**: `{ "status": "OK", "timestamp": "..." }`

## 🐛 Troubleshooting

### Common Issues

1. **Chrome not found**

   - Ensure `NODE_ENV=production` is set
   - Verify `PUPPETEER_EXECUTABLE_PATH` is available

2. **Memory issues**

   - Railway provides limited memory
   - Consider optimizing browser usage

3. **Timeout issues**
   - Increase `BROWSER_TIMEOUT` and `PAGE_TIMEOUT`
   - Monitor Railway logs for specific errors

### Debug Commands

```bash
# Check environment variables
railway variables

# View real-time logs
railway logs --follow

# Restart deployment
railway service restart
```

## 📊 Monitoring

Railway provides:

- Real-time logs
- Performance metrics
- Automatic scaling
- Health check monitoring

## 🔄 Updates

To update your deployment:

```bash
# Push changes to your repository
git push origin main

# Railway will automatically redeploy
# Or manually trigger deployment
railway up
```

## 📞 Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Puppeteer Docker: [github.com/puppeteer/puppeteer](https://github.com/puppeteer/puppeteer)
- 2captcha API: [2captcha.com](https://2captcha.com)

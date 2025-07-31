# 🚀 Server Deployment Guide

This guide explains how to deploy the Whitepages API with non-headless mode using virtual display.

## 📋 Prerequisites

### For Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y xvfb chromium
```

### For CentOS/RHEL:

```bash
sudo yum install -y xorg-x11-server-Xvfb chromium
```

## 🎯 Deployment Options

### Option 1: Direct Server Deployment

1. **Install Xvfb** (if not already installed):

   ```bash
   sudo apt-get install -y xvfb
   ```

2. **Start the server with virtual display**:
   ```bash
   yarn start:prod
   ```

### Option 2: Docker Deployment

1. **Build the Docker image**:

   ```bash
   docker build -t whitepages-api .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:3000 --env-file .env whitepages-api
   ```

### Option 3: PM2 Process Manager

1. **Install PM2**:

   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem.config.js**:

   ```javascript
   module.exports = {
     apps: [
       {
         name: "whitepages-api",
         script: "server.js",
         env: {
           DISPLAY: ":99",
         },
         interpreter: "/bin/bash",
         interpreter_args:
           '-c "Xvfb :99 -screen 0 1920x1080x24 & exec node server.js"',
       },
     ],
   };
   ```

3. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```
PORT=3000
TWOCAPTCHA_API_KEY=your_2captcha_api_key
```

### Virtual Display Settings

The server uses:

- **Display**: `:99`
- **Resolution**: `1920x1080x24`
- **Color Depth**: 24-bit

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### API Test

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "email: your_email" \
  -H "password: your_password" \
  -d '[{"name": "John Smith", "location": "New York, NY"}]'
```

## 🔍 Troubleshooting

### Virtual Display Issues

```bash
# Check if Xvfb is running
ps aux | grep Xvfb

# Check display
echo $DISPLAY

# Test virtual display
xdpyinfo -display :99
```

### Browser Issues

```bash
# Check if Chrome is available
which chromium

# Check browser data directory
ls -la ./browser-data/
```

## 📊 Benefits of This Setup

1. **✅ Non-Headless Mode**: Better element detection and form interaction
2. **✅ Virtual Display**: Allows GUI applications on headless servers
3. **✅ Better Captcha Solving**: More reliable than headless mode
4. **✅ Easier Debugging**: Can see what's happening (if needed)
5. **✅ Production Ready**: Optimized for server deployment

## 🚨 Important Notes

- The server uses `headless: false` for better reliability
- Virtual display (`:99`) is required for server deployment
- Browser data is persisted in `./browser-data/`
- Captcha solving is more reliable in non-headless mode

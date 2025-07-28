# Quick Setup Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your CapSolver API key:

```env
CAPSOLVER_API_KEY=your_capsolver_api_key_here
```

### 3. Test Setup

```bash
node test-setup.js
```

### 4. Run the Application

**Basic test:**

```bash
node src/index.js
```

**Example with search:**

```bash
node examples/basic-search.js
```

## 📁 Project Structure

```
whitepagesapi-headless/
├── src/
│   ├── config/
│   │   ├── browser.js          # Browser management with CapSolver
│   │   └── logger.js           # Winston logging configuration
│   ├── services/
│   │   └── whitepages-scraper.js  # Main scraping logic
│   ├── utils/
│   │   └── capsolver-config.js    # CapSolver configuration management
│   └── index.js                # Main application entry point
├── examples/
│   └── basic-search.js         # Example usage script
├── CapSolver.Browser.Extension/  # CapSolver extension (pre-configured)
├── logs/                       # Application logs (created on first run)
├── package.json                # Dependencies and scripts
├── .env.example               # Environment variables template
├── README.md                  # Comprehensive documentation
└── test-setup.js             # Setup verification script
```

## 🔧 Key Features

- **Automatic Captcha Solving**: CapSolver extension handles reCAPTCHA automatically
- **Multiple Search Types**: Name, phone, and address searches
- **Stealth Mode**: Uses puppeteer-extra with stealth plugin
- **Comprehensive Logging**: Winston-based logging system
- **Error Handling**: Robust error handling and recovery

## 🎯 Usage Examples

### Search by Name

```javascript
const app = new WhitepagesScraperApp();
await app.initialize();
const results = await app.searchByName("John Smith");
```

### Search by Phone

```javascript
const results = await app.searchByPhone("555-123-4567");
```

### Search by Address

```javascript
const results = await app.searchByAddress("123 Main St, New York, NY");
```

## ⚠️ Important Notes

1. **API Key Required**: You need a valid CapSolver API key
2. **Rate Limiting**: Respect Whitepages' terms of service
3. **Legal Compliance**: Use responsibly and ethically
4. **Browser Resources**: Ensure sufficient system resources for browser automation

## 🐛 Troubleshooting

- **Missing API Key**: Add `CAPSOLVER_API_KEY` to your `.env` file
- **Extension Issues**: Verify `CapSolver.Browser.Extension/` directory exists
- **Browser Problems**: Try running in headless mode or check system resources
- **Captcha Issues**: Verify your CapSolver account has sufficient balance

## 📞 Support

- **CapSolver Issues**: Contact [CapSolver Support](https://www.capsolver.com/)
- **Application Issues**: Check logs in `logs/` directory
- **Setup Problems**: Run `node test-setup.js` for diagnostics

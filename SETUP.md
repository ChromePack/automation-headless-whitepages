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

Edit `.env` and add your 2captcha API key:

```env
TWOCAPTCHA_API_KEY=your_2captcha_api_key_here
```

### 3. Run the Application

**Basic test:**

```bash
yarn start
```

**Interactive mode:**

```bash
yarn interactive
```

**Test website functionality:**

```bash
yarn test-website
```

## 📁 Project Structure

```
whitepagesapi-headless/
├── src/
│   ├── config/
│   │   ├── browser.js          # Browser management
│   │   └── logger.js           # Winston logging configuration
│   ├── services/
│   │   └── whitepages-scraper.js  # Main scraping logic
│   └── index.js                # Main application entry point
├── inject.js                     # 2captcha parameter interception script
├── test-website.js              # Complete website automation test
├── package.json                # Dependencies and scripts
├── .env.example               # Environment variables template
└── README.md                  # Comprehensive documentation
```

## 🔧 Key Features

- **Automatic Captcha Solving**: 2captcha service handles Cloudflare Turnstile captchas automatically
- **Multiple Search Types**: Name, phone, and address searches
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

1. **API Key Required**: You need a valid 2captcha API key
2. **Rate Limiting**: Respect Whitepages' terms of service
3. **Legal Compliance**: Use responsibly and ethically

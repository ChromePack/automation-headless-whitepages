const puppeteer = require("puppeteer");
const path = require("path");
const logger = require("./logger");
const { readFileSync } = require("fs");

class BrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
    this.chromeExecutablePath = "/opt/google/chrome/google-chrome";
  }

  async initialize() {
    try {
      logger.info("Initializing browser with 2captcha integration...");

      this.browser = await puppeteer.launch({
        headless: false, // Keep window open
        executablePath: this.chromeExecutablePath, // Use Google Chrome executable
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        timeout: parseInt(process.env.BROWSER_TIMEOUT) || 30000,
      });

      this.page = await this.browser.newPage();

      // Set page timeout
      this.page.setDefaultTimeout(parseInt(process.env.PAGE_TIMEOUT) || 30000);

      // Set user agent
      await this.page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Inject the 2captcha parameter interception script
      const preloadFile = readFileSync("./inject.js", "utf8");
      await this.page.evaluateOnNewDocument(preloadFile);

      logger.info("Browser initialized successfully with 2captcha integration");
      return this.page;
    } catch (error) {
      logger.error("Failed to initialize browser:", error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info("Browser closed");
    }
  }

  async getPage() {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }
    return this.page;
  }
}

module.exports = BrowserManager;

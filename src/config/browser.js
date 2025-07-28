const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");
const path = require("path");
const logger = require("./logger");

// Apply stealth plugin
puppeteer.use(StealthPlugin());

class BrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
    this.extensionPath = path.join(
      __dirname,
      "../../CapSolver.Browser.Extension"
    );
  }

  async initialize() {
    try {
      logger.info("Initializing browser with CapSolver extension...");

      this.browser = await puppeteer.launch({
        headless: process.env.HEADLESS === "true",
        args: [
          `--disable-extensions-except=${this.extensionPath}`,
          `--load-extension=${this.extensionPath}`,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        executablePath: executablePath(),
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

      logger.info("Browser initialized successfully");
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

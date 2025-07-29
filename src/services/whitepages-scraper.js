const logger = require("../config/logger");

class WhitepagesScraper {
  constructor(page) {
    this.page = page;
    this.baseUrl =
      process.env.WHITEPAGES_BASE_URL || "https://www.whitepages.com";
  }

  async navigateToHomepage() {
    try {
      logger.info("Navigating to Whitepages homepage...");
      await this.page.goto(this.baseUrl, { waitUntil: "networkidle2" });
      logger.info("Successfully navigated to Whitepages homepage");
      return true;
    } catch (error) {
      logger.error("Failed to navigate to homepage:", error);
      throw error;
    }
  }

  async searchPerson(searchData) {
    try {
      logger.info(`Searching for person: ${JSON.stringify(searchData)}`);

      // Navigate to homepage first
      await this.navigateToHomepage();

      // Wait for search form to be available
      await this.page.waitForSelector(
        'input[placeholder*="name"], input[placeholder*="phone"], input[placeholder*="address"]',
        { timeout: 10000 }
      );

      // Fill search form based on search type
      if (searchData.phone) {
        await this.searchByPhone(searchData.phone);
      } else if (searchData.address) {
        await this.searchByAddress(searchData.address);
      } else if (searchData.name) {
        await this.searchByName(searchData.name);
      } else {
        throw new Error("No valid search criteria provided");
      }

      // Handle potential captcha
      await this.handleCaptcha();

      // Wait for results to load
      await this.waitForResults();

      // Extract search results
      const results = await this.extractSearchResults();

      logger.info(`Search completed. Found ${results.length} results`);
      return results;
    } catch (error) {
      logger.error("Search failed:", error);
      throw error;
    }
  }

  async searchByName(name) {
    logger.info(`Searching by name: ${name}`);

    // Find name input field
    const nameInput = await this.page.$(
      'input[placeholder*="name"], input[name*="name"], input[id*="name"]'
    );
    if (nameInput) {
      await nameInput.fill(name);
      await this.page.keyboard.press("Enter");
    } else {
      throw new Error("Name input field not found");
    }
  }

  async searchByPhone(phone) {
    logger.info(`Searching by phone: ${phone}`);

    // Find phone input field
    const phoneInput = await this.page.$(
      'input[placeholder*="phone"], input[name*="phone"], input[id*="phone"]'
    );
    if (phoneInput) {
      await phoneInput.fill(phone);
      await this.page.keyboard.press("Enter");
    } else {
      throw new Error("Phone input field not found");
    }
  }

  async searchByAddress(address) {
    logger.info(`Searching by address: ${address}`);

    // Find address input field
    const addressInput = await this.page.$(
      'input[placeholder*="address"], input[name*="address"], input[id*="address"]'
    );
    if (addressInput) {
      await addressInput.fill(address);
      await this.page.keyboard.press("Enter");
    } else {
      throw new Error("Address input field not found");
    }
  }

  async handleCaptcha() {
    try {
      logger.info(
        "Captcha handling temporarily disabled - skipping captcha detection..."
      );

      // Temporarily disabled captcha handling
      // await this.page.waitForTimeout(2000);

      // Check for reCAPTCHA - DISABLED
      // const recaptchaExists = await this.page.$(
      //   '.g-recaptcha, iframe[src*="recaptcha"], div[class*="recaptcha"]'
      // );
      // if (recaptchaExists) {
      //   logger.info("reCAPTCHA detected, waiting for CapSolver to solve...");
      //   await this.waitForCaptchaSolution();
      // }

      // Check for other captcha types - DISABLED
      // const captchaExists = await this.page.$(
      //   '.captcha, .captcha-solver, [class*="captcha"]'
      // );
      // if (captchaExists) {
      //   logger.info("Captcha detected, waiting for CapSolver to solve...");
      //   await this.waitForCaptchaSolution();
      // }

      logger.info("Captcha handling skipped (temporarily disabled)");
    } catch (error) {
      logger.warn("Error in disabled captcha handling:", error);
      // Continue execution even if captcha handling fails
    }
  }

  async waitForCaptchaSolution() {
    try {
      // Wait for CapSolver extension to solve the captcha
      // This might take some time depending on the captcha type
      await this.page.waitForTimeout(10000);

      // Check if captcha was solved by looking for success indicators
      const solved = await this.page.evaluate(() => {
        // Look for common success indicators
        const successIndicators = [
          ".g-recaptcha-response",
          '[data-captcha-solved="true"]',
          ".captcha-solved",
        ];

        return successIndicators.some(
          (selector) => document.querySelector(selector) !== null
        );
      });

      if (solved) {
        logger.info("Captcha appears to be solved");
      } else {
        logger.warn("Captcha solution status unclear, continuing...");
      }
    } catch (error) {
      logger.warn("Error waiting for captcha solution:", error);
    }
  }

  async waitForResults() {
    try {
      logger.info("Waiting for search results...");

      // Wait for results to load - look for common result selectors
      const resultSelectors = [
        ".search-results",
        ".results",
        '[class*="result"]',
        '[class*="listing"]',
        ".person-card",
        ".contact-card",
      ];

      for (const selector of resultSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          logger.info(`Results found with selector: ${selector}`);
          return;
        } catch (error) {
          // Continue to next selector
        }
      }

      // If no specific result container found, wait for any content
      await this.page.waitForTimeout(3000);
      logger.info(
        "No specific result container found, proceeding with extraction"
      );
    } catch (error) {
      logger.warn("Error waiting for results:", error);
    }
  }

  async extractSearchResults() {
    try {
      logger.info("Extracting search results...");

      const results = await this.page.evaluate(() => {
        const extractedResults = [];

        // Common selectors for person/contact information
        const personSelectors = [
          ".person-card",
          ".contact-card",
          ".listing",
          '[class*="result"]',
          '[class*="person"]',
          '[class*="contact"]',
        ];

        for (const selector of personSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((element, index) => {
              const result = {
                index: index,
                name: "",
                phone: "",
                address: "",
                email: "",
                age: "",
                relatives: [],
                rawText: element.textContent.trim(),
              };

              // Extract name
              const nameElement = element.querySelector(
                'h1, h2, h3, .name, [class*="name"]'
              );
              if (nameElement) {
                result.name = nameElement.textContent.trim();
              }

              // Extract phone
              const phoneElement = element.querySelector(
                '.phone, [class*="phone"], a[href^="tel:"]'
              );
              if (phoneElement) {
                result.phone =
                  phoneElement.textContent.trim() ||
                  phoneElement.getAttribute("href")?.replace("tel:", "");
              }

              // Extract address
              const addressElement = element.querySelector(
                '.address, [class*="address"]'
              );
              if (addressElement) {
                result.address = addressElement.textContent.trim();
              }

              // Extract email
              const emailElement = element.querySelector(
                '.email, [class*="email"], a[href^="mailto:"]'
              );
              if (emailElement) {
                result.email =
                  emailElement.textContent.trim() ||
                  emailElement.getAttribute("href")?.replace("mailto:", "");
              }

              // Extract age
              const ageElement = element.querySelector('.age, [class*="age"]');
              if (ageElement) {
                result.age = ageElement.textContent.trim();
              }

              // Extract relatives
              const relativeElements = element.querySelectorAll(
                '.relative, [class*="relative"]'
              );
              relativeElements.forEach((relative) => {
                result.relatives.push(relative.textContent.trim());
              });

              extractedResults.push(result);
            });
            break; // Use the first selector that finds results
          }
        }

        return extractedResults;
      });

      logger.info(`Extracted ${results.length} results`);
      return results;
    } catch (error) {
      logger.error("Error extracting search results:", error);
      return [];
    }
  }

  async getPersonDetails(personUrl) {
    try {
      logger.info(`Getting detailed information for: ${personUrl}`);

      await this.page.goto(personUrl, { waitUntil: "networkidle2" });

      // Handle potential captcha on detail page
      await this.handleCaptcha();

      // Extract detailed information
      const details = await this.page.evaluate(() => {
        const detailInfo = {
          name: "",
          phoneNumbers: [],
          addresses: [],
          emails: [],
          age: "",
          relatives: [],
          backgroundInfo: {},
          propertyInfo: {},
          rawText: document.body.textContent.trim(),
        };

        // Extract name
        const nameElement = document.querySelector(
          'h1, .person-name, [class*="name"]'
        );
        if (nameElement) {
          detailInfo.name = nameElement.textContent.trim();
        }

        // Extract phone numbers
        const phoneElements = document.querySelectorAll(
          '.phone, [class*="phone"], a[href^="tel:"]'
        );
        phoneElements.forEach((phone) => {
          detailInfo.phoneNumbers.push(
            phone.textContent.trim() ||
              phone.getAttribute("href")?.replace("tel:", "")
          );
        });

        // Extract addresses
        const addressElements = document.querySelectorAll(
          '.address, [class*="address"]'
        );
        addressElements.forEach((address) => {
          detailInfo.addresses.push(address.textContent.trim());
        });

        // Extract emails
        const emailElements = document.querySelectorAll(
          '.email, [class*="email"], a[href^="mailto:"]'
        );
        emailElements.forEach((email) => {
          detailInfo.emails.push(
            email.textContent.trim() ||
              email.getAttribute("href")?.replace("mailto:", "")
          );
        });

        // Extract age
        const ageElement = document.querySelector('.age, [class*="age"]');
        if (ageElement) {
          detailInfo.age = ageElement.textContent.trim();
        }

        // Extract relatives
        const relativeElements = document.querySelectorAll(
          '.relative, [class*="relative"]'
        );
        relativeElements.forEach((relative) => {
          detailInfo.relatives.push(relative.textContent.trim());
        });

        return detailInfo;
      });

      logger.info("Successfully extracted person details");
      return details;
    } catch (error) {
      logger.error("Error getting person details:", error);
      throw error;
    }
  }
}

module.exports = WhitepagesScraper;

require("dotenv").config();
const BrowserManager = require("./src/config/browser");
const WhitepagesScraper = require("./src/services/whitepages-scraper");
const logger = require("./src/config/logger");

async function testWebsite() {
  const browserManager = new BrowserManager();
  let scraper = null;

  try {
    logger.info("🚀 Starting website test - CapSolver disabled");

    // Initialize browser (CapSolver extension disabled)
    const page = await browserManager.initialize();
    scraper = new WhitepagesScraper(page);

    // Navigate to Whitepages homepage
    logger.info("📱 Navigating to Whitepages homepage...");
    await scraper.navigateToHomepage();

    logger.info("✅ Website opened successfully!");

    // Wait for document to be fully loaded
    logger.info("⏳ Waiting for page to be fully loaded...");
    await page.waitForFunction(() => document.readyState === "complete");
    logger.info("✅ Page fully loaded");

    // Function to check if captcha is present with error handling
    const isCaptchaPresent = async () => {
      try {
        const captchaElement = await page.$(
          'input[name="cf-turnstile-response"]'
        );
        const captchaContainer = await page.$('div[id^="RInW4"]');
        return !!(captchaElement || captchaContainer);
      } catch (error) {
        logger.warn("Error checking for captcha:", error.message);
        return false; // Assume no captcha if error occurs
      }
    };

    // Wait for captcha to be solved and check for login button
    logger.info("🔍 Waiting for Cloudflare captcha to be solved...");

    let attempts = 0;
    const maxAttempts = 60; // 60 seconds total
    let loginButtonClicked = false;

    while (attempts < maxAttempts && !loginButtonClicked) {
      try {
        // Check if captcha is present
        const captchaPresent = await isCaptchaPresent();

        if (!captchaPresent) {
          // Wait 1 second to ensure captcha doesn't reappear
          logger.info(
            "⏳ Captcha not detected, waiting 1 second to ensure stability..."
          );
          await page.waitForTimeout(1000);

          // Check again after delay
          const captchaStillNotPresent = await isCaptchaPresent();

          if (!captchaStillNotPresent) {
            logger.info(
              "✅ Captcha solved or not present, checking for login button..."
            );

            // Check for login button after captcha is solved
            const loginButton = await page.$(
              'a[href="/auth/login?redirect=/"]'
            );

            if (loginButton) {
              logger.info("✅ Login button found, clicking...");
              await loginButton.click();
              logger.info("✅ Login button clicked");
              loginButtonClicked = true;
              break; // Exit the loop after clicking login button
            } else {
              logger.info("❌ Login button not found");
              break;
            }
          }
        }

        // Wait 1 second before next check
        await page.waitForTimeout(1000);
        attempts++;
      } catch (error) {
        logger.warn("Error during captcha check attempt:", error.message);
        await page.waitForTimeout(1000);
        attempts++;
      }
    }

    // Handle login form filling after login button is clicked
    if (loginButtonClicked) {
      try {
        // Wait for login page to load
        logger.info("⏳ Waiting for login page to load...");
        await page.waitForFunction(() => document.readyState === "complete");

        // Check if we're on the login page
        const currentUrl = page.url();
        if (currentUrl.includes("/auth/login")) {
          logger.info("✅ Login page loaded, filling credentials...");

          // Wait for form elements to be ready
          logger.info("⏳ Waiting for form elements to be ready...");
          await page.waitForSelector(
            '[data-qa-selector="login-username-input"]',
            { timeout: 10000 }
          );
          await page.waitForSelector(
            '[data-qa-selector="login-password-input"]',
            { timeout: 10000 }
          );
          await page.waitForSelector('[data-qa-selector="login-submit-btn"]', {
            timeout: 10000,
          });

          // Fill email using page.evaluate for direct DOM manipulation
          const emailFilled = await page.evaluate((email) => {
            const emailInput = document.querySelector(
              '[data-qa-selector="login-username-input"]'
            );
            if (emailInput) {
              emailInput.value = email;
              emailInput.dispatchEvent(new Event("input", { bubbles: true }));
              emailInput.dispatchEvent(new Event("change", { bubbles: true }));
              return true;
            }
            return false;
          }, process.env.WHITEPAGES_EMAIL);

          if (emailFilled) {
            logger.info("✅ Email filled");
          } else {
            logger.error("❌ Email input not found");
          }

          // Fill password using page.evaluate for direct DOM manipulation
          const passwordFilled = await page.evaluate((password) => {
            const passwordInput = document.querySelector(
              '[data-qa-selector="login-password-input"]'
            );
            if (passwordInput) {
              passwordInput.value = password;
              passwordInput.dispatchEvent(
                new Event("input", { bubbles: true })
              );
              passwordInput.dispatchEvent(
                new Event("change", { bubbles: true })
              );
              return true;
            }
            return false;
          }, process.env.WHITEPAGES_PASSWORD);

          if (passwordFilled) {
            logger.info("✅ Password filled");
          } else {
            logger.error("❌ Password input not found");
          }

          // Click submit button
          const submitButton = await page.$(
            'button[data-qa-selector="login-submit-btn"]'
          );
          if (submitButton) {
            logger.info("✅ Submit button found, clicking...");
            await submitButton.click();
            logger.info("✅ Login submitted");
          } else {
            logger.error("❌ Submit button not found");
          }
        } else {
          logger.info("❌ Not on login page, current URL:", currentUrl);
        }
      } catch (error) {
        logger.error("❌ Error during login form filling:", error.message);
      }
    }

    if (attempts >= maxAttempts) {
      logger.info("⏰ Timeout reached, captcha might still be present");
    }

    logger.info("🌐 Browser window is open and will stay open");
    logger.info("💡 You can now interact with the website manually");
    logger.info("🔄 Press Ctrl+C to close the browser when done");

    // Keep the process running to maintain the browser window
    process.on("SIGINT", async () => {
      logger.info("🛑 Closing browser...");
      await browserManager.close();
      process.exit(0);
    });

    // Keep the script running
    await new Promise(() => {}); // This keeps the process alive
  } catch (error) {
    logger.error("❌ Error during website test:", error);
    if (browserManager) {
      await browserManager.close();
    }
    process.exit(1);
  }
}

// Run the test
testWebsite().catch(console.error);

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

            // Wait for redirect to home page and then perform search
            logger.info("⏳ Waiting for redirect to home page...");

            // Wait for URL to change to home page
            await page.waitForFunction(
              () => {
                return (
                  window.location.href === "https://www.whitepages.com/" ||
                  window.location.href === "https://www.whitepages.com"
                );
              },
              { timeout: 30000 }
            );

            logger.info("✅ Redirected to home page");

            // Wait for page to fully load
            await page.waitForFunction(
              () => document.readyState === "complete"
            );
            await page.waitForTimeout(2000);
            logger.info("✅ Back on home page, performing search...");

            // Wait for search form to be ready
            await page.waitForSelector("#search-name", { timeout: 10000 });
            await page.waitForSelector("#search-location", {
              timeout: 10000,
            });

            // Fill name search
            const nameFilled = await page.evaluate((name) => {
              const nameInput = document.querySelector("#search-name");
              if (nameInput) {
                nameInput.value = name;
                nameInput.dispatchEvent(new Event("input", { bubbles: true }));
                nameInput.dispatchEvent(new Event("change", { bubbles: true }));
                return true;
              }
              return false;
            }, "Adam Nemirow");

            if (nameFilled) {
              logger.info("✅ Name filled: Adam Nemirow");
            } else {
              logger.error("❌ Name input not found");
            }

            // Fill location search
            const locationFilled = await page.evaluate((location) => {
              const locationInput = document.querySelector("#search-location");
              if (locationInput) {
                locationInput.value = location;
                locationInput.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
                locationInput.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
                return true;
              }
              return false;
            }, "Charleston, SC");

            if (locationFilled) {
              logger.info("✅ Location filled: Charleston, SC");

              // Wait for dropdown to appear and click first suggestion
              await page.waitForTimeout(2000);

              const suggestionClicked = await page.evaluate(() => {
                const suggestions = document.querySelector(
                  ".d-suggestions-wrapper-search li"
                );
                if (suggestions) {
                  suggestions.click();
                  return true;
                }
                return false;
              });

              if (suggestionClicked) {
                logger.info("✅ Location suggestion clicked");
              } else {
                logger.info("⚠️ No location suggestions found, continuing...");
              }
            } else {
              logger.error("❌ Location input not found");
            }

            // Click search button
            const searchButton = await page.$("#wp-search");
            if (searchButton) {
              logger.info("✅ Search button found, clicking...");
              await searchButton.click();
              logger.info("✅ Search submitted");

              // Wait for search results page to load
              logger.info("⏳ Waiting for search results page...");
              await page.waitForFunction(
                () => document.readyState === "complete"
              );

              // Check for Terms of Service modal and handle it
              logger.info("🔍 Checking for Terms of Service modal...");
              const tosModal = await page.$(".tos-modal-card");

              if (tosModal) {
                logger.info("✅ Terms of Service modal found, handling...");

                // Check the checkbox
                const checkbox = await page.$("#tos-checkbox");
                if (checkbox) {
                  await checkbox.click();
                  logger.info("✅ Terms checkbox checked");
                } else {
                  logger.error("❌ Terms checkbox not found");
                }

                // Click Continue to Results button
                const continueButton = await page.$(
                  "[data-js-tos-continue-button]"
                );
                if (continueButton) {
                  await continueButton.click();
                  logger.info("✅ Continue to Results button clicked");
                } else {
                  logger.error("❌ Continue to Results button not found");
                }
              } else {
                logger.info(
                  "ℹ️ No Terms of Service modal found, continuing..."
                );
              }

              // Wait a bit for the page to fully load after modal handling
              await page.waitForTimeout(2000);

              // Click on the first email link
              logger.info("🔍 Looking for email links...");
              const emailLinks = await page.$$(
                '[data-qa-selector="email-link"]'
              );

              if (emailLinks.length > 0) {
                logger.info(
                  `✅ Found ${emailLinks.length} email link(s), clicking the first one...`
                );
                await emailLinks[0].click();
                logger.info("✅ First email link clicked");
              } else {
                logger.info("ℹ️ No email links found on the page");
              }
            } else {
              logger.error("❌ Search button not found");
            }
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

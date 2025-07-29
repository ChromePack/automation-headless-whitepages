require("dotenv").config();
const { launch } = require("puppeteer");
const { readFileSync } = require("fs");
const { Solver } = require("@2captcha/captcha-solver");

// Initialize the 2captcha solver with your API key
const solver = new Solver(process.env.TWOCAPTCHA_API_KEY);

async function testWebsite() {
  console.log("🚀 Starting website test with 2captcha integration");

  // Launch browser with headless: false to see what's happening
  const browser = await launch({
    headless: false,
    devtools: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });

  try {
    // Get the first page
    const [page] = await browser.pages();

    // Read and inject the intercept script
    const preloadFile = readFileSync("./inject.js", "utf8");
    await page.evaluateOnNewDocument(preloadFile);

    // Set up console message handler to catch intercepted parameters
    page.on("console", async (msg) => {
      const txt = msg.text();

      if (txt.includes("intercepted-params:")) {
        const params = JSON.parse(txt.replace("intercepted-params:", ""));
        console.log("📡 Intercepted parameters:", params);

        try {
          console.log("🔍 Solving the captcha...");
          const res = await solver.cloudflareTurnstile(params);
          console.log(`✅ Captcha solved! ID: ${res.id}`);
          console.log("📄 Response:", res);

          // Pass the token to the callback function
          await page.evaluate((token) => {
            if (window.cfCallback) {
              window.cfCallback(token);
            }
          }, res.data);
        } catch (e) {
          console.error("❌ Error solving captcha:", e.err || e.message);
          return process.exit(1);
        }
      } else if (txt.includes("Console was cleared")) {
        // Ignore console clear messages
        return;
      } else {
        // Log other console messages for debugging
        console.log("📝 Console:", txt);
      }
    });

    // Navigate to the target website
    console.log("🌐 Navigating to Whitepages...");
    await page.goto("https://www.whitepages.com/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for document to be fully loaded
    console.log("⏳ Waiting for page to be fully loaded...");
    await page.waitForFunction(() => document.readyState === "complete");
    console.log("✅ Page fully loaded");

    // Wait a bit to ensure captcha is handled
    await page.waitForTimeout(5000);

    // Check for login button after captcha is solved
    console.log("🔍 Checking for login button...");
    const loginButton = await page.$('a[href="/auth/login?redirect=/"]');

    if (loginButton) {
      console.log("✅ Login button found, clicking...");
      await loginButton.click();
      console.log("✅ Login button clicked");
    } else {
      console.log("❌ Login button not found");
    }

    // Handle login form filling after login button is clicked
    try {
      // Wait for login page to load
      console.log("⏳ Waiting for login page to load...");
      await page.waitForFunction(() => document.readyState === "complete");

      // Check if we're on the login page
      const currentUrl = page.url();
      if (currentUrl.includes("/auth/login")) {
        console.log("✅ Login page loaded, filling credentials...");

        // Wait for form elements to be ready
        console.log("⏳ Waiting for form elements to be ready...");
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
          console.log("✅ Email filled");
        } else {
          console.error("❌ Email input not found");
        }

        // Fill password using page.evaluate for direct DOM manipulation
        const passwordFilled = await page.evaluate((password) => {
          const passwordInput = document.querySelector(
            '[data-qa-selector="login-password-input"]'
          );
          if (passwordInput) {
            passwordInput.value = password;
            passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
            passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }
          return false;
        }, process.env.WHITEPAGES_PASSWORD);

        if (passwordFilled) {
          console.log("✅ Password filled");
        } else {
          console.error("❌ Password input not found");
        }

        // Click submit button
        const submitButton = await page.$(
          'button[data-qa-selector="login-submit-btn"]'
        );
        if (submitButton) {
          console.log("✅ Submit button found, clicking...");
          await submitButton.click();
          console.log("✅ Login submitted");

          // Wait for redirect to home page and then perform search
          console.log("⏳ Waiting for redirect to home page...");

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

          console.log("✅ Redirected to home page");

          // Wait for page to fully load
          await page.waitForFunction(() => document.readyState === "complete");
          await page.waitForTimeout(2000);
          console.log("✅ Back on home page, performing search...");

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
            console.log("✅ Name filled: Adam Nemirow");
          } else {
            console.error("❌ Name input not found");
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
            console.log("✅ Location filled: Charleston, SC");

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
              console.log("✅ Location suggestion clicked");
            } else {
              console.log("⚠️ No location suggestions found, continuing...");
            }
          } else {
            console.error("❌ Location input not found");
          }

          // Click search button
          const searchButton = await page.$("#wp-search");
          if (searchButton) {
            console.log("✅ Search button found, clicking...");
            await searchButton.click();
            console.log("✅ Search submitted");

            // Wait for search results page to load
            console.log("⏳ Waiting for search results page...");
            await page.waitForFunction(
              () => document.readyState === "complete"
            );

            // Check for Terms of Service modal and handle it
            console.log("🔍 Checking for Terms of Service modal...");
            const tosModal = await page.$(".tos-modal-card");

            if (tosModal) {
              console.log("✅ Terms of Service modal found, handling...");

              // Check the checkbox
              const checkbox = await page.$("#tos-checkbox");
              if (checkbox) {
                await checkbox.click();
                console.log("✅ Terms checkbox checked");
              } else {
                console.error("❌ Terms checkbox not found");
              }

              // Click Continue to Results button
              const continueButton = await page.$(
                "[data-js-tos-continue-button]"
              );
              if (continueButton) {
                await continueButton.click();
                console.log("✅ Continue to Results button clicked");
              } else {
                console.error("❌ Continue to Results button not found");
              }
            } else {
              console.log("ℹ️ No Terms of Service modal found, continuing...");
            }

            // Wait a bit for the page to fully load after modal handling
            await page.waitForTimeout(2000);

            // Click on the first email link
            console.log("🔍 Looking for email links...");
            const emailLinks = await page.$$('[data-qa-selector="email-link"]');

            if (emailLinks.length > 0) {
              console.log(
                `✅ Found ${emailLinks.length} email link(s), clicking the first one...`
              );
              await emailLinks[0].click();
              console.log("✅ First email link clicked");
            } else {
              console.log("ℹ️ No email links found on the page");
            }
          } else {
            console.error("❌ Search button not found");
          }
        } else {
          console.error("❌ Submit button not found");
        }
      } else {
        console.log("❌ Not on login page, current URL:", currentUrl);
      }
    } catch (error) {
      console.error("❌ Error during login form filling:", error.message);
    }

    console.log("🌐 Browser window is open and will stay open");
    console.log("💡 You can now interact with the website manually");
    console.log("🔄 Press Ctrl+C to close the browser when done");

    // Keep the process running to maintain the browser window
    process.on("SIGINT", async () => {
      console.log("🛑 Closing browser...");
      await browser.close();
      process.exit(0);
    });

    // Keep the script running
    await new Promise(() => {}); // This keeps the process alive
  } catch (error) {
    console.error("❌ Error during website test:", error);
    await browser.close();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  process.exit(0);
});

// Run the test
testWebsite().catch(console.error);

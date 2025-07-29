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
    defaultViewport: {
      width: 1440,
      height: 900,
    },
    userDataDir: "./browser-data", // Persistent user data directory
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
      }
      // Removed all other console logging
    });

    // Navigate to the target website
    console.log("🌐 Navigating to Whitepages...");
    await page.goto("https://www.whitepages.com/", {
      waitUntil: "networkidle2",
      timeout: 60000, // Increased timeout to 60 seconds
    });

    // Wait for document to be fully loaded
    console.log("⏳ Waiting for page to be fully loaded...");
    await page.waitForFunction(() => document.readyState === "complete");
    console.log("✅ Page fully loaded");

    // Wait for captcha to be solved
    console.log("⏳ Checking for captcha...");
    let captchaSolved = false;
    let attempts = 0;
    const maxAttempts = 30; // Increased from 10 to 30 seconds to allow for captcha solving

    while (attempts < maxAttempts && !captchaSolved) {
      try {
        // Check if captcha is present
        const captchaElement = await page.$(
          'input[name="cf-turnstile-response"]'
        );
        const captchaContainer = await page.$('div[id^="RInW4"]');
        const captchaPresent = !!(captchaElement || captchaContainer);

        if (!captchaPresent) {
          // Wait 1 second to ensure captcha doesn't reappear
          console.log(
            "⏳ Captcha not detected, waiting 1 second to ensure stability..."
          );
          await page.waitForTimeout(1000);

          // Check again after delay
          const captchaStillNotPresent =
            (await page.$('input[name="cf-turnstile-response"]')) === null &&
            (await page.$('div[id^="RInW4"]')) === null;

          if (captchaStillNotPresent) {
            console.log("✅ Captcha solved or not present, proceeding...");
            captchaSolved = true;
            break;
          }
        }

        // Wait 1 second before next check
        await page.waitForTimeout(1000);
        attempts++;
      } catch (error) {
        console.log("⚠️ Error during captcha check attempt:", error.message);
        await page.waitForTimeout(1000);
        attempts++;
      }
    }

    if (captchaSolved) {
      // Check login status using CSS classes immediately after captcha
      console.log("🔍 Checking login status using CSS classes...");

      const loginStatus = await page.evaluate(() => {
        const loggedInContent = document.querySelector(".logged-in-content");
        const loggedOutContent = document.querySelector(".logged-out-content");

        if (loggedInContent && loggedOutContent) {
          const isLoggedIn =
            !loggedInContent.classList.contains("hidden") &&
            loggedOutContent.classList.contains("hidden");
          return {
            isLoggedIn,
            loggedInVisible: !loggedInContent.classList.contains("hidden"),
            loggedOutVisible: !loggedOutContent.classList.contains("hidden"),
          };
        }

        return {
          isLoggedIn: false,
          loggedInVisible: false,
          loggedOutVisible: true,
        };
      });

      console.log("📊 Login status:", loginStatus);

      if (loginStatus.isLoggedIn) {
        console.log("✅ User is already logged in, proceeding to search...");
      } else {
        console.log("❌ User is not logged in, checking for login link...");

        // Check for login link in navigation
        console.log("🔍 Checking for login link in navigation...");

        // Debug: Let's see what login-related links exist on the page
        const allLoginLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll("a"));
          const loginLinks = links.filter((link) => {
            const href = link.href || "";
            const text = link.textContent || "";
            return (
              href.includes("/auth/login") ||
              text.toLowerCase().includes("log in") ||
              text.toLowerCase().includes("login")
            );
          });
          return loginLinks.map((link) => ({
            href: link.href,
            text: link.textContent.trim(),
            classes: link.className,
            id: link.id,
          }));
        });

        console.log("🔍 Found login-related links:", allLoginLinks);

        if (allLoginLinks.length > 0) {
          const loginLink = allLoginLinks[0];
          console.log("✅ Login link found, clicking...");
          console.log("📝 Login link details:", loginLink);

          // Click the login link using a more reliable method
          try {
            // Try multiple selectors to click the login link
            const loginSelectors = [
              'a[href="/auth/login?redirect=/"]',
              'a[href*="/auth/login"]',
              "a.btn.primary--text.log-in",
              'a:contains("Log In")',
            ];

            let clicked = false;
            for (const selector of loginSelectors) {
              try {
                const element = await page.$(selector);
                if (element) {
                  await element.click();
                  console.log(
                    `✅ Login link clicked using selector: ${selector}`
                  );
                  clicked = true;
                  break;
                }
              } catch (error) {
                console.log(`⚠️ Failed to click with selector: ${selector}`);
              }
            }

            if (!clicked) {
              // Fallback: use evaluate to click
              await page.evaluate(() => {
                const loginLink =
                  document.querySelector('a[href="/auth/login?redirect=/"]') ||
                  document.querySelector('a[href*="/auth/login"]') ||
                  document.querySelector("a.btn.primary--text.log-in");
                if (loginLink) {
                  loginLink.click();
                }
              });
              console.log("✅ Login link clicked using evaluate fallback");
            }
          } catch (error) {
            console.log("❌ Error clicking login link:", error.message);
          }

          // Wait for login form to load
          console.log("⏳ Waiting for login form to load...");
          await page.waitForTimeout(2000);

          // Debug: Check what page we're on and what elements are available
          const currentUrl = await page.url();
          console.log("🔍 Current URL after login click:", currentUrl);

          // Debug: Check what elements are available on the page
          const availableElements = await page.evaluate(() => {
            const elements = {
              allInputs: Array.from(document.querySelectorAll("input")).map(
                (input) => ({
                  id: input.id,
                  name: input.name,
                  type: input.type,
                  placeholder: input.placeholder,
                  className: input.className,
                })
              ),
              allForms: Array.from(document.querySelectorAll("form")).map(
                (form) => ({
                  id: form.id,
                  className: form.className,
                  action: form.action,
                })
              ),
              pageTitle: document.title,
              bodyText: document.body.textContent.substring(0, 200),
            };
            return elements;
          });

          console.log(
            "🔍 Available elements after login click:",
            availableElements
          );

          // Fill login form
          console.log("📝 Filling login form...");

          try {
            // Wait for page to load completely
            await page.waitForFunction(
              () => document.readyState === "complete",
              { timeout: 15000 }
            );
            console.log("✅ Page fully loaded");

            // Wait a bit more for any dynamic content
            await page.waitForTimeout(3000);

            // Debug: Check what page we're on and what elements are available
            const currentUrl = await page.url();
            console.log("🔍 Current URL after login click:", currentUrl);

            // Debug: Check what elements are available on the page
            const availableElements = await page.evaluate(() => {
              const elements = {
                allInputs: Array.from(document.querySelectorAll("input")).map(
                  (input) => ({
                    id: input.id,
                    name: input.name,
                    type: input.type,
                    placeholder: input.placeholder,
                    className: input.className,
                  })
                ),
                allForms: Array.from(document.querySelectorAll("form")).map(
                  (form) => ({
                    id: form.id,
                    className: form.className,
                    action: form.action,
                  })
                ),
                pageTitle: document.title,
                bodyText: document.body.textContent.substring(0, 200),
              };
              return elements;
            });

            console.log(
              "🔍 Available elements after login click:",
              availableElements
            );

            // Find email and password inputs
            const emailInput = await page.$('input[placeholder*="email" i]');
            const passwordInput = await page.$('input[type="password"]');

            if (emailInput && passwordInput) {
              console.log(
                '✅ Found email input with selector: input[placeholder*="email" i]'
              );
              console.log(
                '✅ Found password input with selector: input[type="password"]'
              );

              // Fill email field using proper typing
              await emailInput.click();
              await page.keyboard.type(process.env.WHITEPAGES_EMAIL, {
                delay: 100,
              });
              console.log("✅ Email filled");

              // Fill password field using proper typing
              await passwordInput.click();
              await page.keyboard.type(process.env.WHITEPAGES_PASSWORD, {
                delay: 100,
              });
              console.log("✅ Password filled");

              // Find and click submit button
              const submitButton = await page.$('button[type="submit"]');
              if (submitButton) {
                console.log(
                  '✅ Found submit button with selector: button[type="submit"]'
                );
                await submitButton.click();
                console.log("✅ Submit button clicked");
                console.log("✅ Login form submitted");
                await page.waitForTimeout(3000);

                // Debug: Check what page we're on after login
                const currentUrl = await page.url();
                console.log("🔍 Current URL after login attempt:", currentUrl);

                // Debug: Check what elements are available on the page
                const availableElements = await page.evaluate(() => {
                  const elements = {
                    searchName: document.querySelector("#search-name"),
                    searchLocation: document.querySelector("#search-location"),
                    searchButton: document.querySelector(
                      'button[type="submit"]'
                    ),
                    allInputs: Array.from(
                      document.querySelectorAll("input")
                    ).map((input) => ({
                      id: input.id,
                      name: input.name,
                      type: input.type,
                      placeholder: input.placeholder,
                      className: input.className,
                    })),
                    pageTitle: document.title,
                    bodyText: document.body.textContent.substring(0, 200),
                  };
                  return elements;
                });

                console.log(
                  "🔍 Available elements after login:",
                  availableElements
                );
              } else {
                console.log("❌ Submit button not found");
              }
            } else {
              console.log("❌ Email or password input not found");
            }
          } catch (error) {
            console.log("❌ Error during login form filling:", error.message);
          }
        } else {
          console.log("❌ No login link found, proceeding with search...");
        }
      }

      // Wait for page to fully stabilize after captcha
      console.log("⏳ Waiting for page to stabilize after captcha...");
      await page.waitForTimeout(3000);

      // Wait for navigation elements to be ready
      console.log("⏳ Waiting for navigation elements to load...");
      await page.waitForTimeout(2000);

      // Perform search (whether logged in or not)
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
          locationInput.dispatchEvent(new Event("input", { bubbles: true }));
          locationInput.dispatchEvent(new Event("change", { bubbles: true }));
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
        await page.waitForFunction(() => document.readyState === "complete");

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
          const continueButton = await page.$("[data-js-tos-continue-button]");
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
      console.log("⏰ Timeout reached, captcha might still be present");
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

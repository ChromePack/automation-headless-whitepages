require("dotenv").config();
const { launch } = require("puppeteer");
const { readFileSync } = require("fs");
const { Solver } = require("@2captcha/captcha-solver");

// Initialize the 2captcha solver
const solver = new Solver(process.env.TWOCAPTCHA_API_KEY);

async function testLogin() {
  console.log("🚀 Starting login test...");

  // Test credentials - you can modify these or use environment variables
  const credentials = {
    email: process.env.WHITEPAGES_EMAIL || "test@example.com",
    password: process.env.WHITEPAGES_PASSWORD || "testpassword",
  };

  console.log("📧 Using email:", credentials.email);
  console.log("🔑 Password provided:", credentials.password ? "Yes" : "No");

  // Launch browser optimized for server deployment
  const browser = await launch({
    headless: false, // Use non-headless mode for better reliability
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
    defaultViewport: null,
    userDataDir: "./browser-data",
  });

  try {
    const [page] = await browser.pages();

    // Read and inject the intercept script
    const preloadFile = readFileSync("./inject.js", "utf8");
    await page.evaluateOnNewDocument(preloadFile);

    // Set up console message handler
    page.on("console", async (msg) => {
      const txt = msg.text();

      if (txt.includes("intercepted-params:")) {
        const params = JSON.parse(txt.replace("intercepted-params:", ""));
        console.log("📡 Intercepted parameters:", params);

        try {
          console.log("🔍 Solving the captcha...");
          const res = await solver.cloudflareTurnstile(params);
          console.log(`✅ Captcha solved! ID: ${res.id}`);

          await page.evaluate((token) => {
            if (window.cfCallback) {
              window.cfCallback(token);
            }
          }, res.data);
        } catch (e) {
          console.error("❌ Error solving captcha:", e.err || e.message);
          throw new Error("Captcha solving failed");
        }
      }
    });

    // Navigate to Whitepages
    console.log("🌐 Navigating to Whitepages...");
    await page.goto("https://www.whitepages.com/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for page to load
    await page.waitForFunction(() => document.readyState === "complete");

    // Handle captcha
    console.log("⏳ Checking for captcha...");
    let captchaSolved = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && !captchaSolved) {
      try {
        const captchaElement = await page.$(
          'input[name="cf-turnstile-response"]'
        );
        const captchaContainer = await page.$('div[id^="RInW4"]');
        const captchaPresent = !!(captchaElement || captchaContainer);

        if (!captchaPresent) {
          await page.waitForTimeout(1000);
          captchaSolved = true;
          console.log("✅ Captcha solved or not present, proceeding...");
        } else {
          await page.waitForTimeout(1000);
          attempts++;
        }
      } catch (error) {
        console.log("⚠️ Error checking captcha, retrying...", error.message);
        await page.waitForTimeout(1000);
        attempts++;
      }
    }

    if (!captchaSolved) {
      throw new Error("Captcha solving timeout");
    }

    // Check login status
    let loginStatus;
    try {
      loginStatus = await page.evaluate(() => {
        const loggedInContent = document.querySelector(".logged-in-content");
        const loggedOutContent = document.querySelector(
          ".logged-out-content.hidden"
        );
        return {
          isLoggedIn: !!loggedInContent && !!loggedOutContent,
          loggedInVisible:
            loggedInContent && loggedInContent.offsetParent !== null,
          loggedOutVisible:
            loggedOutContent && loggedOutContent.offsetParent !== null,
        };
      });
    } catch (error) {
      console.log(
        "⚠️ Error checking login status, assuming not logged in:",
        error.message
      );
      loginStatus = {
        isLoggedIn: false,
        loggedInVisible: false,
        loggedOutVisible: true,
      };
    }

    console.log("📊 Login status:", loginStatus);

    if (!loginStatus.isLoggedIn) {
      console.log("❌ User is not logged in, redirecting to login page...");

      // Navigate directly to login page
      await page.goto("https://www.whitepages.com/auth/login?redirect=%2F", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      console.log("✅ Redirected to login page");

      // Wait for login form to load
      await page.waitForTimeout(3000);

      // Fill login form
      console.log("📝 Filling login form...");
      try {
        // Try multiple selectors for email input
        let emailInput = await page.$(
          '[data-qa-selector="login-username-input"]'
        );
        if (!emailInput) {
          emailInput = await page.$('input[type="email"]');
        }
        if (!emailInput) {
          emailInput = await page.$('input[name="email"]');
        }
        if (!emailInput) {
          emailInput = await page.$('input[placeholder*="email" i]');
        }

        // Try multiple selectors for password input
        let passwordInput = await page.$(
          '[data-qa-selector="login-password-input"]'
        );
        if (!passwordInput) {
          passwordInput = await page.$('input[type="password"]');
        }
        if (!passwordInput) {
          passwordInput = await page.$('input[name="password"]');
        }

        // Try multiple selectors for submit button
        let submitButton = await page.$(
          '[data-qa-selector="login-submit-btn"]'
        );
        if (!submitButton) {
          submitButton = await page.$('button[type="submit"]');
        }
        if (!submitButton) {
          submitButton = await page.$('input[type="submit"]');
        }

        console.log("🔍 Form elements found:");
        console.log("  - Email input:", !!emailInput);
        console.log("  - Password input:", !!passwordInput);
        console.log("  - Submit button:", !!submitButton);

        if (emailInput && passwordInput && submitButton) {
          // Clear fields first
          await emailInput.click({ clickCount: 3 });
          await emailInput.type(credentials.email);
          console.log("✅ Email entered");

          await passwordInput.click({ clickCount: 3 });
          await passwordInput.type(credentials.password);
          console.log("✅ Password entered");

          // Wait a moment before clicking submit
          await page.waitForTimeout(1000);

          await submitButton.click();
          console.log("✅ Login form submitted");

          // Wait for login to complete
          await page.waitForTimeout(3000);

          // Check if login was successful
          const currentUrl = page.url();
          console.log("📍 Current URL after login attempt:", currentUrl);

          // Check for error messages
          const errorElements = await page.$$(
            '.error, .alert, [class*="error"], [class*="alert"]'
          );
          if (errorElements.length > 0) {
            for (let i = 0; i < errorElements.length; i++) {
              const errorText = await errorElements[i].evaluate(
                (el) => el.textContent
              );
              console.log(`⚠️ Error message ${i + 1}:`, errorText);
            }
          }

          // Check login status again
          try {
            const newLoginStatus = await page.evaluate(() => {
              const loggedInContent =
                document.querySelector(".logged-in-content");
              const loggedOutContent = document.querySelector(
                ".logged-out-content.hidden"
              );
              return {
                isLoggedIn: !!loggedInContent && !!loggedOutContent,
                loggedInVisible:
                  loggedInContent && loggedInContent.offsetParent !== null,
                loggedOutVisible:
                  loggedOutContent && loggedOutContent.offsetParent !== null,
              };
            });
            console.log("📊 Login status after attempt:", newLoginStatus);
          } catch (error) {
            console.log(
              "⚠️ Error checking login status after attempt:",
              error.message
            );
          }
        } else {
          console.log("⚠️ Login form elements not found");

          // Take a screenshot for debugging
          await page.screenshot({
            path: "login-form-debug.png",
            fullPage: true,
          });
          console.log("📸 Screenshot saved as 'login-form-debug.png'");

          // Log page HTML for debugging
          const pageContent = await page.content();
          console.log("📄 Page HTML length:", pageContent.length);
        }
      } catch (error) {
        console.log("❌ Error during login:", error.message);
      }
    } else {
      console.log("✅ User is already logged in");
    }

    // Wait a bit before closing
    await page.waitForTimeout(2000);
    console.log("✅ Login test completed");
  } catch (error) {
    console.error("❌ Error during login test:", error.message);
    throw error;
  } finally {
    await browser.close();
    console.log("🔒 Browser closed");
  }
}

// Run the test
testLogin().catch(console.error);

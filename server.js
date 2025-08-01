require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { launch } = require("puppeteer");
const { readFileSync } = require("fs");
const { Solver } = require("@2captcha/captcha-solver");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the 2captcha solver
const solver = new Solver(process.env.TWOCAPTCHA_API_KEY);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Reusable function to handle captcha on any page
async function handleCaptcha(page, pageName = "current page") {
  console.log(`⏳ Checking for captcha on ${pageName}...`);
  let attempts = 0;
  const maxAttempts = 30;
  let captchaSolved = false;

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
        console.log(
          `✅ Captcha solved or not present on ${pageName}, proceeding...`
        );
      } else {
        console.log(
          `⏳ Waiting for captcha to be solved on ${pageName}... (attempt ${
            attempts + 1
          }/${maxAttempts})`
        );
        await page.waitForTimeout(1000);
        attempts++;
      }
    } catch (error) {
      console.log(
        `⚠️ Error checking captcha on ${pageName}, retrying...`,
        error.message
      );
      await page.waitForTimeout(1000);
      attempts++;
    }
  }

  if (!captchaSolved) {
    console.log(
      `⚠️ Captcha solving timeout on ${pageName}, proceeding anyway...`
    );
  }

  // Wait a bit more for any pending operations
  await page.waitForTimeout(2000);
  return captchaSolved;
}

// Main search endpoint
app.post("/api/search", async (req, res) => {
  try {
    const { email, password } = req.headers;
    const people = req.body;

    // Validate headers
    if (!email || !password) {
      return res.status(400).json({
        error:
          "Missing credentials in headers. Required: email and password headers",
      });
    }

    // Validate body
    if (!Array.isArray(people) || people.length === 0) {
      return res.status(400).json({
        error: "Body must be an array of people with name and location",
      });
    }

    const credentials = { email, password };
    const results = [];

    console.log(`🔍 Starting search for ${people.length} person(s)`);

    // Validate all people have required fields
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      if (!person.name || !person.location) {
        return res.status(400).json({
          error: `Person at index ${i} must have 'name' and 'location' fields`,
        });
      }
    }

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

      // Track captcha solving attempts to prevent race conditions
      let captchaSolvingInProgress = false;
      let captchaSolved = false;

      // Set up console message handler
      page.on("console", async (msg) => {
        const txt = msg.text();

        if (txt.includes("intercepted-params:") && !captchaSolvingInProgress) {
          captchaSolvingInProgress = true;
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

            captchaSolved = true;
          } catch (e) {
            console.error("❌ Error solving captcha:", e.err || e.message);
            // Don't throw error here, just log it and continue
            console.log("⚠️ Continuing without captcha solution...");
          } finally {
            captchaSolvingInProgress = false;
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

      // Handle captcha on homepage
      await handleCaptcha(page, "homepage");

      // Check login status and login if needed
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

        // Handle captcha on login page
        await handleCaptcha(page, "login page");

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
          } else {
            console.log("⚠️ Login form elements not found");
          }
        } catch (error) {
          console.log("❌ Error during login:", error.message);
        }
      }

      // Navigate to search page
      console.log("🔍 Navigating to search page...");
      try {
        await page.goto("https://www.whitepages.com/", {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
      } catch (error) {
        console.log(
          "⚠️ Error navigating to search page, trying to reload...",
          error.message
        );
        await page.reload({ waitUntil: "networkidle2" });
      }

      // Process each person in the array
      for (let i = 0; i < people.length; i++) {
        const person = people[i];
        const { name, location } = person;

        console.log(
          `\n🔍 Processing person ${i + 1}/${
            people.length
          }: ${name} in ${location}`
        );

        if (i === 0) {
          // First person - use the main search form
          console.log("📝 Filling search form for first person...");
          const nameInput = await page.$("#search-name");
          if (nameInput) {
            await nameInput.type(name);
            console.log("✅ Name entered");

            // Fill location
            const locationInput = await page.$("#search-location");
            if (locationInput) {
              await locationInput.type(location);
              console.log("✅ Location entered");

              // Wait for location suggestions and click if available
              await page.waitForTimeout(1000);
              const suggestions = await page.$$(".location-suggestion");
              if (suggestions.length > 0) {
                await suggestions[0].click();
                console.log("✅ Location suggestion clicked");
              }
            }

            // Click search button
            const searchButton = await page.$("#wp-search");
            if (searchButton) {
              console.log("✅ Search button found, clicking...");
              await searchButton.click();
              console.log("✅ Search submitted");

              // Wait for search results
              await page.waitForFunction(
                () => document.readyState === "complete"
              );

              // Wait for document to be fully loaded before checking for modal
              await page.waitForTimeout(1500);

              // Handle captcha on search results page
              await handleCaptcha(page, "search results page");

              // Handle Terms of Service modal
              const tosModal = await page.$(".tos-modal-card");
              if (tosModal) {
                console.log("✅ Terms of Service modal found, handling...");
                const checkbox = await page.$("#tos-checkbox");
                if (checkbox) {
                  await checkbox.click();
                  console.log("✅ Terms checkbox checked");
                }
                const continueButton = await page.$(
                  "[data-js-tos-continue-button]"
                );
                if (continueButton) {
                  await continueButton.click();
                  console.log("✅ Continue to Results button clicked");
                }
              }

              await page.waitForTimeout(1000);

              // Click on the first email link
              console.log("🔍 Looking for email links...");
              const emailLinks = await page.$$(
                '[data-qa-selector="email-link"]'
              );

              if (emailLinks.length > 0) {
                console.log(
                  `✅ Found ${emailLinks.length} email link(s), clicking the first one...`
                );
                await emailLinks[0].click();
                console.log("✅ First email link clicked");

                // Wait for the person's result page to load
                console.log("⏳ Waiting for person's result page to load...");
                await page.waitForFunction(
                  () => document.readyState === "complete"
                );
                await page.waitForTimeout(2000);

                // Handle captcha on person result page
                await handleCaptcha(page, "person result page");
              } else {
                console.log("ℹ️ No email links found for first person");
                results.push({
                  name: name,
                  location: location,
                  error: "No results found",
                });
                continue;
              }
            } else {
              console.error("❌ Search button not found");
              results.push({
                name: name,
                location: location,
                error: "Search functionality not available",
              });
              continue;
            }
          } else {
            console.error("❌ Name input not found");
            results.push({
              name: name,
              location: location,
              error: "Search form not available",
            });
            continue;
          }
        } else {
          // Subsequent people - use the navbar search form on person result page
          console.log("📝 Using navbar search form for subsequent person...");

          try {
            // Find and fill the navbar search form
            const navbarNameInput = await page.$("#name-input");
            const navbarLocationInput = await page.$("#location-input");
            const navbarSearchButton = await page.$(
              '[data-qa-selector="person-search-button"]'
            );

            if (navbarNameInput && navbarLocationInput && navbarSearchButton) {
              // Clear previous inputs
              await navbarNameInput.click({ clickCount: 3 });
              await navbarNameInput.type(name);
              console.log("✅ Navbar name entered");

              await navbarLocationInput.click({ clickCount: 3 });
              await navbarLocationInput.type(location);
              console.log("✅ Navbar location entered");

              // Wait for location suggestions and click if available
              await page.waitForTimeout(1000);
              const navbarSuggestions = await page.$$(
                '[data-qa-selector="person-location-suggestions"] > div'
              );
              if (navbarSuggestions.length > 0) {
                await navbarSuggestions[0].click();
                console.log("✅ Navbar location suggestion clicked");
              }

              // Click search button
              await navbarSearchButton.click();
              console.log("✅ Navbar search submitted");

              // Wait for search results
              await page.waitForFunction(
                () => document.readyState === "complete"
              );
              await page.waitForTimeout(1500);

              // Handle captcha on search results page
              await handleCaptcha(page, "search results page");

              // Handle Terms of Service modal if it appears
              const tosModal = await page.$(".tos-modal-card");
              if (tosModal) {
                console.log("✅ Terms of Service modal found, handling...");
                const checkbox = await page.$("#tos-checkbox");
                if (checkbox) {
                  await checkbox.click();
                  console.log("✅ Terms checkbox checked");
                }
                const continueButton = await page.$(
                  "[data-js-tos-continue-button]"
                );
                if (continueButton) {
                  await continueButton.click();
                  console.log("✅ Continue to Results button clicked");
                }
              }

              // Check if we're on a "no results" page
              const noResultsContainer = await page.$(".no-results-container");
              if (noResultsContainer) {
                console.log("ℹ️ No results found for this person, skipping...");
                results.push({
                  name: name,
                  location: location,
                  error: "No results found",
                });

                // Navigate back to homepage for next search
                console.log(
                  "🏠 Navigating back to homepage for next search..."
                );
                await page.goto("https://www.whitepages.com/", {
                  waitUntil: "networkidle2",
                  timeout: 30000,
                });
                await page.waitForTimeout(2000);
                continue;
              }

              // Click on the first email link
              console.log("🔍 Looking for email links...");
              const emailLinks = await page.$$(
                '[data-qa-selector="email-link"]'
              );

              if (emailLinks.length > 0) {
                console.log(
                  `✅ Found ${emailLinks.length} email link(s), clicking the first one...`
                );
                await emailLinks[0].click();
                console.log("✅ First email link clicked");

                // Wait for the person's result page to load
                console.log("⏳ Waiting for person's result page to load...");
                await page.waitForFunction(
                  () => document.readyState === "complete"
                );
                await page.waitForTimeout(2000);

                // Handle captcha on person result page
                await handleCaptcha(page, "person result page");
              } else {
                console.log("ℹ️ No email links found for this person");
                results.push({
                  name: name,
                  location: location,
                  error: "No results found",
                });
                continue;
              }
            } else {
              console.error("❌ Navbar search form elements not found");
              console.log(
                "🏠 Navigating back to homepage to use main search form..."
              );

              // Navigate back to homepage and use main search form
              await page.goto("https://www.whitepages.com/", {
                waitUntil: "networkidle2",
                timeout: 30000,
              });
              await page.waitForTimeout(2000);

              // Use the main search form instead
              const nameInput = await page.$("#search-name");
              const locationInput = await page.$("#search-location");
              const searchButton = await page.$("#wp-search");

              if (nameInput && locationInput && searchButton) {
                // Clear and fill name
                await nameInput.click({ clickCount: 3 });
                await nameInput.type(name);
                console.log("✅ Name entered in main form");

                // Clear and fill location
                await locationInput.click({ clickCount: 3 });
                await locationInput.type(location);
                console.log("✅ Location entered in main form");

                // Wait for location suggestions and click if available
                await page.waitForTimeout(1000);
                const suggestions = await page.$$(".location-suggestion");
                if (suggestions.length > 0) {
                  await suggestions[0].click();
                  console.log("✅ Location suggestion clicked");
                }

                // Click search button
                await searchButton.click();
                console.log("✅ Main search form submitted");

                // Wait for search results
                await page.waitForFunction(
                  () => document.readyState === "complete"
                );
                await page.waitForTimeout(1500);

                // Handle captcha on search results page
                await handleCaptcha(page, "search results page");

                // Handle Terms of Service modal if it appears
                const tosModal = await page.$(".tos-modal-card");
                if (tosModal) {
                  console.log("✅ Terms of Service modal found, handling...");
                  const checkbox = await page.$("#tos-checkbox");
                  if (checkbox) {
                    await checkbox.click();
                    console.log("✅ Terms checkbox checked");
                  }
                  const continueButton = await page.$(
                    "[data-js-tos-continue-button]"
                  );
                  if (continueButton) {
                    await continueButton.click();
                    console.log("✅ Continue to Results button clicked");
                  }
                }

                // Check if we're on a "no results" page
                const noResultsContainer = await page.$(
                  ".no-results-container"
                );
                if (noResultsContainer) {
                  console.log(
                    "ℹ️ No results found for this person, skipping..."
                  );
                  results.push({
                    name: name,
                    location: location,
                    error: "No results found",
                  });
                  continue;
                }

                // Click on the first email link
                console.log("🔍 Looking for email links...");
                const emailLinks = await page.$$(
                  '[data-qa-selector="email-link"]'
                );

                if (emailLinks.length > 0) {
                  console.log(
                    `✅ Found ${emailLinks.length} email link(s), clicking the first one...`
                  );
                  await emailLinks[0].click();
                  console.log("✅ First email link clicked");

                  // Wait for the person's result page to load
                  console.log("⏳ Waiting for person's result page to load...");
                  await page.waitForFunction(
                    () => document.readyState === "complete"
                  );
                  await page.waitForTimeout(2000);

                  // Handle captcha on person result page
                  await handleCaptcha(page, "person result page");
                } else {
                  console.log("ℹ️ No email links found for this person");
                  results.push({
                    name: name,
                    location: location,
                    error: "No results found",
                  });
                  continue;
                }
              } else {
                console.error("❌ Main search form elements not found");
                results.push({
                  name: name,
                  location: location,
                  error: "Search functionality not available",
                });
                continue;
              }
            }
          } catch (error) {
            console.error(`❌ Error searching for ${name}:`, error.message);
            results.push({
              name: name,
              location: location,
              error: error.message,
            });
            continue;
          }
        }

        // Extract person data (same for all people)
        console.log("🔍 Extracting person data...");
        const personData = await page.evaluate(() => {
          const data = {
            state: "",
            city: "",
            birthday: "",
            emails: "",
            phone_number: "",
            zip_code: "",
            county: "",
            address: "",
          };

          try {
            // Extract address information
            const addressLine1 = document.querySelector(
              ".address-line1.address-line--linked"
            );
            const addressLine2 = document.querySelector(
              ".address-line2.address-line--linked"
            );

            if (addressLine1 && addressLine2) {
              const streetAddress = addressLine1.textContent.trim();
              const cityStateZip = addressLine2.textContent.trim();

              data.address = `${streetAddress}, ${cityStateZip}`;

              // Parse city, state, and zip from address line 2
              const parts = cityStateZip.split(", ");
              if (parts.length >= 2) {
                data.city = parts[0];
                const stateZip = parts[1].split(" ");
                if (stateZip.length >= 2) {
                  data.state = stateZip[0];
                  data.zip_code = stateZip[1];
                }
              }
            }

            // Extract birthday information
            const ageElement = document.querySelector(
              ".person-age-desktop .list-item--content--title"
            );
            if (ageElement) {
              const ageText = ageElement.textContent.trim();
              const birthdayMatch = ageText.match(/\(([^)]+)\)/);
              if (birthdayMatch) {
                const birthdayText = birthdayMatch[1];
                const date = new Date(birthdayText);
                if (!isNaN(date.getTime())) {
                  data.birthday = date.toISOString().split("T")[0];
                }
              }
            }

            // Extract email
            const emailElement = document.querySelector(
              '[data-qa-selector="email"]'
            );
            if (emailElement) {
              data.emails = emailElement.textContent.trim();
            }

            // Extract phone number
            const phoneElement = document.querySelector(
              '[data-qa-selector="phone-number"] a'
            );
            if (phoneElement) {
              data.phone_number = phoneElement.textContent.trim();
            }

            // Extract county (if available)
            const countyElement = document.querySelector(".county-info");
            if (countyElement) {
              data.county = countyElement.textContent.trim();
            }
          } catch (error) {
            console.error("Error extracting data:", error);
          }

          return data;
        });

        console.log(`📊 Extracted Person Data for ${name}:`);
        console.log(JSON.stringify(personData, null, 2));

        // Add to results array
        results.push({
          name: name,
          location: location,
          ...personData,
        });
      }

      await browser.close();
      return res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error("❌ Error during search:", error);
      await browser.close();
      return res.status(500).json({
        success: false,
        error: error.message || "An error occurred during the search",
      });
    }
  } catch (error) {
    console.error("❌ Error in API endpoint:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoint: POST http://localhost:${PORT}/api/search`);
  console.log(`🏥 Health check: GET http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server...");
  process.exit(0);
});

require("dotenv").config();
const BrowserManager = require("./config/browser");
const WhitepagesScraper = require("./services/whitepages-scraper");
const CapSolverConfigManager = require("./utils/capsolver-config");
const logger = require("./config/logger");
const readline = require("readline");

class WhitepagesScraperApp {
  constructor() {
    this.browserManager = new BrowserManager();
    this.scraper = null;
    this.configManager = new CapSolverConfigManager();
  }

  async initialize() {
    try {
      logger.info("Initializing Whitepages Scraper Application...");

      // Validate and update CapSolver configuration
      const apiKey = process.env.CAPSOLVER_API_KEY;
      if (!apiKey) {
        throw new Error("CAPSOLVER_API_KEY environment variable is required");
      }

      this.configManager.updateApiKey(apiKey);
      this.configManager.validateConfig();

      // Initialize browser
      const page = await this.browserManager.initialize();
      this.scraper = new WhitepagesScraper(page);

      logger.info("Application initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize application:", error);
      throw error;
    }
  }

  async searchByName(name) {
    try {
      logger.info(`Starting search for name: ${name}`);
      const results = await this.scraper.searchPerson({ name });
      return results;
    } catch (error) {
      logger.error(`Search by name failed for ${name}:`, error);
      throw error;
    }
  }

  async searchByPhone(phone) {
    try {
      logger.info(`Starting search for phone: ${phone}`);
      const results = await this.scraper.searchPerson({ phone });
      return results;
    } catch (error) {
      logger.error(`Search by phone failed for ${phone}:`, error);
      throw error;
    }
  }

  async searchByAddress(address) {
    try {
      logger.info(`Starting search for address: ${address}`);
      const results = await this.scraper.searchPerson({ address });
      return results;
    } catch (error) {
      logger.error(`Search by address failed for ${address}:`, error);
      throw error;
    }
  }

  async getPersonDetails(personUrl) {
    try {
      logger.info(`Getting details for person at: ${personUrl}`);
      const details = await this.scraper.getPersonDetails(personUrl);
      return details;
    } catch (error) {
      logger.error(`Failed to get person details for ${personUrl}:`, error);
      throw error;
    }
  }

  async close() {
    try {
      await this.browserManager.close();
      logger.info("Application closed successfully");
    } catch (error) {
      logger.error("Error closing application:", error);
    }
  }

  async interactiveMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n🎯 Whitepages Scraper Interactive Mode");
    console.log("=====================================");
    console.log("Commands:");
    console.log("  name <full_name>     - Search by name");
    console.log("  phone <number>       - Search by phone");
    console.log("  address <address>    - Search by address");
    console.log("  details <url>        - Get detailed info for a person");
    console.log("  quit                 - Exit the application");
    console.log("  help                 - Show this help");
    console.log("");

    const askQuestion = () => {
      rl.question("Enter command: ", async (input) => {
        const parts = input.trim().split(" ");
        const command = parts[0].toLowerCase();
        const args = parts.slice(1).join(" ");

        try {
          switch (command) {
            case "name":
              if (!args) {
                console.log("❌ Please provide a name to search for");
                break;
              }
              console.log(`🔍 Searching for: ${args}`);
              const nameResults = await this.searchByName(args);
              console.log(`Found ${nameResults.length} results:`);
              nameResults.forEach((result, index) => {
                console.log(
                  `  ${index + 1}. ${result.name} - ${
                    result.phone || "No phone"
                  } - ${result.address || "No address"}`
                );
              });
              break;

            case "phone":
              if (!args) {
                console.log("❌ Please provide a phone number to search for");
                break;
              }
              console.log(`📞 Searching for: ${args}`);
              const phoneResults = await this.searchByPhone(args);
              console.log(`Found ${phoneResults.length} results:`);
              phoneResults.forEach((result, index) => {
                console.log(
                  `  ${index + 1}. ${result.name} - ${result.phone} - ${
                    result.address || "No address"
                  }`
                );
              });
              break;

            case "address":
              if (!args) {
                console.log("❌ Please provide an address to search for");
                break;
              }
              console.log(`🏠 Searching for: ${args}`);
              const addressResults = await this.searchByAddress(args);
              console.log(`Found ${addressResults.length} results:`);
              addressResults.forEach((result, index) => {
                console.log(
                  `  ${index + 1}. ${result.name} - ${
                    result.phone || "No phone"
                  } - ${result.address}`
                );
              });
              break;

            case "details":
              if (!args) {
                console.log("❌ Please provide a URL to get details for");
                break;
              }
              console.log(`📋 Getting details for: ${args}`);
              const details = await this.getPersonDetails(args);
              console.log(
                "Detailed Information:",
                JSON.stringify(details, null, 2)
              );
              break;

            case "help":
              console.log("\n🎯 Available Commands:");
              console.log("  name <full_name>     - Search by name");
              console.log("  phone <number>       - Search by phone");
              console.log("  address <address>    - Search by address");
              console.log(
                "  details <url>        - Get detailed info for a person"
              );
              console.log("  quit                 - Exit the application");
              console.log("  help                 - Show this help");
              break;

            case "quit":
            case "exit":
              console.log("👋 Goodbye!");
              rl.close();
              await this.close();
              process.exit(0);
              break;

            default:
              console.log(
                '❌ Unknown command. Type "help" for available commands.'
              );
          }
        } catch (error) {
          console.error("❌ Error:", error.message);
        }

        console.log(""); // Add empty line for readability
        askQuestion();
      });
    };

    askQuestion();
  }
}

// Example usage and main execution
async function main() {
  const app = new WhitepagesScraperApp();

  try {
    await app.initialize();

    // Check if interactive mode is requested
    const isInteractive =
      process.argv.includes("--interactive") || process.argv.includes("-i");

    if (isInteractive) {
      console.log("🚀 Starting interactive mode...");
      await app.interactiveMode();
    } else {
      // For now, just demonstrate the setup without closing
      logger.info(
        "Application is ready for use. Browser window will remain open."
      );
      logger.info(
        "To use interactive mode, run: node src/index.js --interactive"
      );

      // Keep the process running
      console.log("\n🎯 Application is running!");
      console.log("Browser window is open and ready for use.");
      console.log("Press Ctrl+C to exit.");

      // Keep the process alive
      process.on("SIGINT", async () => {
        console.log("\n👋 Shutting down...");
        await app.close();
        process.exit(0);
      });
    }
  } catch (error) {
    logger.error("Application failed:", error);
    process.exit(1);
  }
}

// Export the app class for use in other modules
module.exports = WhitepagesScraperApp;

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error("Unhandled error:", error);
    process.exit(1);
  });
}

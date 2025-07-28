require("dotenv").config();
const WhitepagesScraperApp = require("./src/index");

async function demo() {
  const app = new WhitepagesScraperApp();

  try {
    console.log("🚀 Starting Whitepages Scraper Demo...");
    await app.initialize();

    console.log("\n✅ Application initialized successfully!");
    console.log("🌐 Browser window is now open and ready for use.");
    console.log("\n📝 You can now:");
    console.log(
      "  1. Watch the browser window to see the automation in action"
    );
    console.log("  2. Press Ctrl+C to exit when done");
    console.log(
      "  3. Or run interactive mode: node src/index.js --interactive"
    );

    // Keep the process running
    process.on("SIGINT", async () => {
      console.log("\n👋 Shutting down demo...");
      await app.close();
      process.exit(0);
    });

    // Optional: Run a simple test search after a delay
    setTimeout(async () => {
      try {
        console.log("\n🔍 Running a test search...");
        const results = await app.searchByName("John Smith");
        console.log(`Found ${results.length} results for "John Smith"`);
        results.forEach((result, index) => {
          console.log(
            `  ${index + 1}. ${result.name} - ${result.phone || "No phone"} - ${
              result.address || "No address"
            }`
          );
        });
      } catch (error) {
        console.log("❌ Test search failed:", error.message);
      }
    }, 5000); // Wait 5 seconds before running test
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    await app.close();
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  demo().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = demo;

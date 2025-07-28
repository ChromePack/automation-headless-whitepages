require("dotenv").config();
const WhitepagesScraperApp = require("../src/index");

async function basicSearchExample() {
  const app = new WhitepagesScraperApp();

  try {
    console.log("🚀 Initializing Whitepages Scraper...");
    await app.initialize();

    // Example 1: Search by name
    console.log('\n🔍 Searching for "John Smith"...');
    const nameResults = await app.searchByName("John Smith");
    console.log(`Found ${nameResults.length} results for name search:`);
    nameResults.forEach((result, index) => {
      console.log(
        `  ${index + 1}. ${result.name} - ${result.phone || "No phone"} - ${
          result.address || "No address"
        }`
      );
    });

    // Example 2: Search by phone (uncomment to test)
    /*
    console.log('\n📞 Searching for phone "555-123-4567"...');
    const phoneResults = await app.searchByPhone('555-123-4567');
    console.log(`Found ${phoneResults.length} results for phone search:`);
    phoneResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} - ${result.phone} - ${result.address || 'No address'}`);
    });
    */

    // Example 3: Search by address (uncomment to test)
    /*
    console.log('\n🏠 Searching for address "123 Main St, New York, NY"...');
    const addressResults = await app.searchByAddress('123 Main St, New York, NY');
    console.log(`Found ${addressResults.length} results for address search:`);
    addressResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} - ${result.phone || 'No phone'} - ${result.address}`);
    });
    */

    console.log("\n✅ Search examples completed successfully!");
  } catch (error) {
    console.error("❌ Error during search:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    console.log("\n🔒 Closing application...");
    await app.close();
    console.log("👋 Application closed.");
  }
}

// Run the example
if (require.main === module) {
  basicSearchExample().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = basicSearchExample;
